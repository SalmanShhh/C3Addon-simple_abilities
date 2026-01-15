import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

// Optimization #3: Bit flags for boolean states
const FLAG_ENABLED = 1;  // 0b01
const FLAG_ACTIVE = 2;   // 0b10

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      const properties = this._getInitProperties();
      if (properties) {
      }

      // Ability storage: Map<abilityID, {cooldown, maxCooldown, flags, stacks, maxStacks, stackCooldown, canRegenerate, data}>
      this._abilities = new Map();
      
      // Optimization #5: Track count of abilities with active timers
      this._activeTimerCount = 0;
      
      // Optimization #8: Lazy cache - only updated when expressions access it
      this._cachedAbilityCount = 0;
      this._cachedAbilityList = "";
      this._cacheValid = false;
      
      // Event system for callbacks
      this.events = {};
      
      // Track current ability for trigger conditions
      this._currentAbilityID = "";

      // Enable ticking for timer updates
      this._setTicking(true);
    }
    
    // Optimization #3: Bit flag helpers
    _hasFlag(ability, flag) {
      return (ability.flags & flag) !== 0;
    }
    
    _setFlag(ability, flag, value) {
      if (value) {
        ability.flags |= flag;
      } else {
        ability.flags &= ~flag;
      }
    }

    _tick() {
      // Optimization #5: Early exit when no active timers
      if (this._activeTimerCount === 0) return;
      
      const dt = this.instance.dt;
      const currentTime = this.runtime.gameTime; //Return the in-game time in seconds, which is affected by the time scale, so we use it for scheduling.
      
      // Update cooldowns and stack regeneration
      for (const [abilityID, ability] of this._abilities) {
        // Check for scheduled removal
        if (ability.hasRemovalScheduled && currentTime >= ability.removeAt) {
          this._abilities.delete(abilityID);
          this._activeTimerCount--;
          this._invalidateCache();
          this._triggerAbility(abilityID, "OnAbilityRemoved");
          continue;
        }
        
        // Skip abilities not on cooldown and not regenerating stacks
        if (ability.cooldown <= 0 && ability.stackCooldown <= 0) continue;
        
        // Update regular cooldown
        if (ability.cooldown > 0) {
          const wasOnCooldown = true;
          ability.cooldown -= dt;
          if (ability.cooldown < 0) ability.cooldown = 0;
          
          // Trigger "On ability ready" when cooldown reaches 0
          if (ability.cooldown === 0 && wasOnCooldown) {
            this._activeTimerCount--;
            this._triggerAbility(abilityID, "OnAbilityReady");
          }
        }
        
        // Optimization #10: Skip stack regeneration if ability can't regenerate
        if (!ability.canRegenerate) continue;
        
        // Stack regeneration
        if (ability.stacks < ability.maxStacks && ability.stackCooldown > 0) {
          ability.stackCooldown -= dt;
          
          if (ability.stackCooldown <= 0) {
            ability.stacks++;
            
            this._triggerAbility(abilityID, "OnStackGained");
            
            // Continue regenerating if not at max
            if (ability.stacks < ability.maxStacks) {
              ability.stackCooldown = ability.maxCooldown;
            } else {
              ability.stackCooldown = 0;
              this._activeTimerCount--;
            }
          }
        }
      }
    }
    
    _invalidateCache() {
      this._cacheValid = false;
    }
    
    _updateCache() {
      if (this._cacheValid) return;
      
      this._cachedAbilityCount = this._abilities.size;
      const abilities = Array.from(this._abilities.keys());
      this._cachedAbilityList = abilities.join(",");
      this._cacheValid = true;
    }

    _trigger(method) {
      this.dispatch(method);
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    // Optimization #7: Single unified trigger method
    _triggerAbility(abilityID, conditionName) {
      this._currentAbilityID = abilityID;
      this._trigger(conditionName);
      this._currentAbilityID = "";
    }

    on(tag, callback, options) {
      if (!this.events[tag]) {
        this.events[tag] = [];
      }
      this.events[tag].push({ callback, options });
    }

    off(tag, callback) {
      if (this.events[tag]) {
        this.events[tag] = this.events[tag].filter(
          (event) => event.callback !== callback
        );
      }
    }

    dispatch(tag) {
      if (this.events[tag]) {
        this.events[tag].forEach((event) => {
          if (event.options && event.options.params) {
            const fn = self.C3[AddonTypeMap[addonType]][id].Cnds[tag];
            if (fn && !fn.call(this, ...event.options.params)) {
              return;
            }
          }
          event.callback();
          if (event.options && event.options.once) {
            this.off(tag, event.callback);
          }
        });
      }
    }

    _release() {
      super._release();
    }

    _getDebuggerProperties() {
      const props = [
        {
          title: "$" + this.behaviorType.name,
          properties: [
            { name: "$Ability count", value: this._abilities.size, readonly: true },
          ]
        }
      ];

      // Add section for each ability
      for (const [abilityID, ability] of this._abilities) {
        const enabled = this._hasFlag(ability, FLAG_ENABLED);
        const active = this._hasFlag(ability, FLAG_ACTIVE);
        const abilityProps = [
          { name: "Cooldown", value: ability.cooldown.toFixed(2) + "s" },
          { name: "$Max cooldown", value: ability.maxCooldown.toFixed(2) + "s", readonly: true },
          { name: "$Ready", value: ability.cooldown === 0 && enabled, readonly: true },
          { name: "$Enabled", value: enabled },
          { name: "$Active", value: active },
          { name: "$Stacks", value: ability.stacks },
          { name: "$Max stacks", value: ability.maxStacks },
          { name: "$Stack cooldown", value: ability.stackCooldown.toFixed(2) + "s", readonly: true },
        ];

        // Add custom data if any
        if (ability.data && ability.data.size > 0) {
          for (const [key, value] of ability.data) {
            abilityProps.push({
              name: `Data: ${key}`,
              value: value
            });
          }
        }

        props.push({
          title: `${this.behaviorType.name}: ${abilityID}`,
          properties: abilityProps
        });
      }

      return props;
    }

    _editDebuggerProperty(header, name, value) {
      // Extract ability ID from header
      const abilityMatch = header.match(/^Ability: (.+)$/);
      if (!abilityMatch) return false;
      
      const abilityID = abilityMatch[1];
      const ability = this._abilities.get(abilityID);
      if (!ability) return false;

      // Allow editing specific properties
      if (name === "Cooldown") {
        const seconds = parseFloat(value);
        if (!isNaN(seconds)) {
          ability.cooldown = Math.max(0, seconds);
          return true;
        }
      } else if (name === "Enabled") {
        this._setFlag(ability, FLAG_ENABLED, !!value);
        return true;
      } else if (name === "Active") {
        this._setFlag(ability, FLAG_ACTIVE, !!value);
        return true;
      } else if (name === "Stacks") {
        const stacks = parseInt(value);
        if (!isNaN(stacks)) {
          ability.stacks = Math.max(0, Math.min(stacks, ability.maxStacks));
          return true;
        }
      } else if (name === "Max stacks") {
        const maxStacks = parseInt(value);
        if (!isNaN(maxStacks)) {
          ability.maxStacks = Math.max(1, maxStacks);
          ability.stacks = Math.min(ability.stacks, ability.maxStacks);
          return true;
        }
      } else if (name.startsWith("Data: ")) {
        const key = name.substring(6);
        if (!ability.data) {
          ability.data = new Map();
        }
        ability.data.set(key, String(value));
        return true;
      }

      return false;
    }

    _saveToJson() {
      const abilitiesData = [];
      for (const [abilityID, ability] of this._abilities) {
        abilitiesData.push({
          id: abilityID,
          cooldown: ability.cooldown,
          maxCooldown: ability.maxCooldown,
          flags: ability.flags,
          stacks: ability.stacks,
          maxStacks: ability.maxStacks,
          stackCooldown: ability.stackCooldown,
          removeAt: ability.removeAt || 0,
          hasRemovalScheduled: ability.hasRemovalScheduled || false,
          data: ability.data ? Array.from(ability.data.entries()) : []
        });
      }
      return {
        abilities: abilitiesData
      };
    }

    _loadFromJson(o) {
      this._abilities.clear();
      this._activeTimerCount = 0;
      
      if (o.abilities) {
        for (const abilityData of o.abilities) {
          // Backwards compatibility: convert old enabled/active to flags
          let flags = abilityData.flags !== undefined ? abilityData.flags : 0;
          if (flags === 0 && abilityData.enabled !== undefined) {
            if (abilityData.enabled) flags |= FLAG_ENABLED;
            if (abilityData.active) flags |= FLAG_ACTIVE;
          }
          
          const maxCooldown = abilityData.maxCooldown;
          const cooldown = abilityData.cooldown;
          const stackCooldown = abilityData.stackCooldown !== undefined ? abilityData.stackCooldown : 0;
          
          // Count active timers
          if (cooldown > 0) this._activeTimerCount++;
          if (stackCooldown > 0) this._activeTimerCount++;
          if (abilityData.hasRemovalScheduled) this._activeTimerCount++;
          
          this._abilities.set(abilityData.id, {
            cooldown: cooldown,
            maxCooldown: maxCooldown,
            flags: flags,
            stacks: abilityData.stacks !== undefined ? abilityData.stacks : 1,
            maxStacks: abilityData.maxStacks !== undefined ? abilityData.maxStacks : 1,
            stackCooldown: stackCooldown,
            canRegenerate: maxCooldown > 0,  // Optimization #10
            removeAt: abilityData.removeAt || 0,
            hasRemovalScheduled: abilityData.hasRemovalScheduled || false,
            data: abilityData.data && abilityData.data.length > 0 ? new Map(abilityData.data) : null
          });
        }
      }
      
      this._invalidateCache();
    }
  };
}
