import { action, condition, expression } from "../template/aceDefine.js";

// ============================================================================
// ACTIONS - Ability Management
// ============================================================================

action(
  "AbilityManagement",
  "CreateAbility",
  {
    listName: "Create ability",
    displayText: "Create ability [b]{0}[/b]",
    description: "Give the object an ability. Creates a new ability slot if it doesn't exist.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for this ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return;
    
    // Don't recreate if already exists
    if (!this._abilities.has(abilityID)) {
      this._abilities.set(abilityID, {
        cooldown: 0,
        maxCooldown: 0,
        flags: 1,  // FLAG_ENABLED
        stacks: 1,
        maxStacks: 1,
        stackCooldown: 0,
        canRegenerate: false,  // Optimization #10
        removeAt: 0,
        hasRemovalScheduled: false,
        data: null
      });
      
      this._invalidateCache();
      this._triggerAbility(abilityID, "OnAbilityCreated");
    }
  }
);

action(
  "AbilityManagement",
  "CreateAbilityWithCooldown",
  {
    listName: "Create ability with cooldown",
    displayText: "Create ability [b]{0}[/b] with [b]{1}[/b] second cooldown",
    description: "Give the object an ability and set its cooldown in one action. Useful for initial setup.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for this ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "cooldown",
        name: "Cooldown",
        desc: "Cooldown duration in seconds",
        type: "number",
        initialValue: "0",
      },
    ],
  },
  function (abilityID, cooldown) {
    if (!abilityID) return;
    
    const cooldownValue = Math.max(0, cooldown);
    
    // Create or update ability
    if (!this._abilities.has(abilityID)) {
      if (cooldownValue > 0) this._activeTimerCount++;
      
      this._abilities.set(abilityID, {
        cooldown: cooldownValue,
        maxCooldown: cooldownValue,
        flags: 1,  // FLAG_ENABLED
        stacks: 1,
        maxStacks: 1,
        stackCooldown: 0,
        canRegenerate: cooldownValue > 0,  // Optimization #10
        removeAt: 0,
        hasRemovalScheduled: false,
        data: null
      });
      
      this._invalidateCache();
      this._triggerAbility(abilityID, "OnAbilityCreated");
    } else {
      // If ability exists, just update the cooldown
      const ability = this._abilities.get(abilityID);
      const wasOnCooldown = ability.cooldown > 0;
      ability.cooldown = cooldownValue;
      ability.maxCooldown = Math.max(ability.maxCooldown, cooldownValue);
      ability.canRegenerate = ability.maxCooldown > 0;
      
      if (!wasOnCooldown && cooldownValue > 0) this._activeTimerCount++;
    }
  }
);

action(
  "AbilityManagement",
  "CreateAbilityWithCooldownAndStacks",
  {
    listName: "Create ability with cooldown and stacks",
    displayText: "Create ability [b]{0}[/b] with [b]{1}[/b]s cooldown and [b]{2}[/b] max stacks",
    description: "Give the object an ability and set its cooldown and max stacks in one action. Perfect for charge-based abilities.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for this ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "cooldown",
        name: "Cooldown",
        desc: "Cooldown/regeneration duration in seconds",
        type: "number",
        initialValue: "0",
      },
      {
        id: "maxStacks",
        name: "Max stacks",
        desc: "Maximum number of charges",
        type: "number",
        initialValue: "1",
      },
    ],
  },
  function (abilityID, cooldown, maxStacks) {
    if (!abilityID) return;
    
    const cooldownValue = Math.max(0, cooldown);
    const maxStacksValue = Math.max(1, Math.floor(maxStacks));
    
    // Create or update ability
    if (!this._abilities.has(abilityID)) {
      this._abilities.set(abilityID, {
        cooldown: 0,
        maxCooldown: cooldownValue,
        flags: 1,  // FLAG_ENABLED
        stacks: maxStacksValue,
        maxStacks: maxStacksValue,
        stackCooldown: 0,
        canRegenerate: cooldownValue > 0,
        removeAt: 0,
        hasRemovalScheduled: false,
        data: null
      });
      
      this._invalidateCache();
      this._triggerAbility(abilityID, "OnAbilityCreated");
    } else {
      // If ability exists, update cooldown and stacks
      const ability = this._abilities.get(abilityID);
      ability.maxCooldown = cooldownValue;
      ability.maxStacks = maxStacksValue;
      ability.stacks = Math.min(ability.stacks, maxStacksValue);
      ability.canRegenerate = cooldownValue > 0;
    }
  }
);

action(
  "AbilityManagement",
  "CreateTemporaryAbility",
  {
    listName: "Create temporary ability",
    displayText: "Create temporary ability [b]{0}[/b] that expires after [b]{1}[/b] seconds",
    description: "Create an ability that automatically removes itself after a duration. If ability already exists, just schedules new removal time Perfect for temporary power-ups and time-limited buffs.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for this ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "duration",
        name: "Duration",
        desc: "Time in seconds before ability is removed",
        type: "number",
        initialValue: "10",
      },
    ],
  },
  function (abilityID, duration) {
    if (!abilityID) return;
    
    const durationValue = Math.max(0, duration);
    
    // Create ability if it doesn't exist
    if (!this._abilities.has(abilityID)) {
      this._abilities.set(abilityID, {
        cooldown: 0,
        maxCooldown: 0,
        flags: 1,  // FLAG_ENABLED
        stacks: 1,
        maxStacks: 1,
        stackCooldown: 0,
        canRegenerate: false,
        removeAt: this.runtime.gameTime + durationValue,
        hasRemovalScheduled: true,
        data: null
      });
      
      this._activeTimerCount++;
      this._invalidateCache();
      this._triggerAbility(abilityID, "OnAbilityCreated");
    } else {
      // If ability exists, just schedule removal
      const ability = this._abilities.get(abilityID);
      ability.removeAt = this.runtime.gameTime + durationValue;
      
      if (!ability.hasRemovalScheduled) {
        ability.hasRemovalScheduled = true;
        this._activeTimerCount++;
      }
    }
  }
);

action(
  "AbilityManagement",
  "RemoveAbilityAfter",
  {
    listName: "Remove ability after duration",
    displayText: "Remove ability [b]{0}[/b] after [b]{1}[/b] seconds",
    description: "Schedule automatic removal of an ability after a duration. Useful for temporary power-ups and time-limited abilities.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "duration",
        name: "Duration",
        desc: "Time in seconds before ability is removed",
        type: "number",
        initialValue: "10",
      },
    ],
  },
  function (abilityID, duration) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    const durationValue = Math.max(0, duration);
    
    // Schedule removal
    ability.removeAt = this.runtime.gameTime + durationValue;
    
    // Track if we need to check for removal
    if (!ability.hasRemovalScheduled) {
      ability.hasRemovalScheduled = true;
      this._activeTimerCount++;
    }
  }
);

action(
  "AbilityManagement",
  "RemoveAbility",
  {
    listName: "Remove ability",
    displayText: "Remove ability [b]{0}[/b]",
    description: "Remove an ability from the object. Deletes all associated data.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability to remove",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return;
    
    if (this._abilities.delete(abilityID)) {
      this._invalidateCache();
      this._triggerAbility(abilityID, "OnAbilityRemoved");
    }
  }
);

action(
  "AbilityManagement",
  "ClearAllAbilities",
  {
    listName: "Clear all abilities",
    displayText: "Clear all abilities",
    description: "Remove all abilities from the object. Triggers removal event for each ability.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [],
  },
  function () {
    // Trigger removal for each ability before clearing
    for (const abilityID of this._abilities.keys()) {
      this._triggerAbility(abilityID, "OnAbilityRemoved");
    }
    
    this._abilities.clear();
    this._activeTimerCount = 0;
    this._invalidateCache();
  }
);

action(
  "AbilityManagement",
  "ActivateAbility",
  {
    listName: "Activate ability",
    displayText: "Activate ability [b]{0}[/b]",
    description: "Trigger an ability activation callback. Only works if ability is ready (off cooldown and enabled).",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability to activate",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    // Check if ability is ready (has stacks and enabled)
    const enabled = this._hasFlag(ability, 1);  // FLAG_ENABLED
    if (ability.stacks <= 0 || !enabled) return;
    
    // Consume a stack
    ability.stacks--;
    
    // Start regeneration if needed
    if (ability.stacks < ability.maxStacks && ability.stackCooldown === 0 && ability.canRegenerate) {
      ability.stackCooldown = ability.maxCooldown;
      this._activeTimerCount++;
    }
    
    // Trigger activation callback
    this._triggerAbility(abilityID, "OnAbilityActivated");
  }
);

// ============================================================================
// ACTIONS - Cooldowns
// ============================================================================

action(
  "Cooldowns",
  "SetAbilityCooldown",
  {
    listName: "Set ability cooldown",
    displayText: "Set [b]{0}[/b] cooldown to [b]{1}[/b] seconds",
    description: "Set the cooldown time for an ability. The ability will not be usable until the cooldown expires.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "seconds",
        name: "Seconds",
        desc: "Cooldown duration in seconds",
        type: "number",
        initialValue: "0",
      },
    ],
  },
  function (abilityID, seconds) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    const wasOnCooldown = ability.cooldown > 0;
    ability.cooldown = Math.max(0, seconds);
    ability.maxCooldown = Math.max(ability.maxCooldown, ability.cooldown);
    ability.canRegenerate = ability.maxCooldown > 0;
    
    if (!wasOnCooldown && ability.cooldown > 0) this._activeTimerCount++;
  }
);

action(
  "Cooldowns",
  "ResetCooldown",
  {
    listName: "Reset cooldown",
    displayText: "Reset [b]{0}[/b] cooldown",
    description: "Instantly reset an ability's cooldown to 0, making it ready to use immediately.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    // #10: Simplified conditional check
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    ability.cooldown = 0;
  }
);

// ============================================================================
// ACTIONS - Stacks
// ============================================================================

action(
  "Stacks",
  "SetMaxStacks",
  {
    listName: "Set ability max stacks",
    displayText: "Set [b]{0}[/b] max stacks to [b]{1}[/b]",
    description: "Set the maximum number of charges an ability can have. Current stacks will be clamped to new max.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "maxStacks",
        name: "Max stacks",
        desc: "Maximum number of charges",
        type: "number",
        initialValue: "1",
      },
    ],
  },
  function (abilityID, maxStacks) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    ability.maxStacks = Math.max(1, Math.floor(maxStacks));
    ability.stacks = Math.min(ability.stacks, ability.maxStacks);
    ability.canRegenerate = ability.maxCooldown > 0;
  }
);

action(
  "Stacks",
  "SetStacks",
  {
    listName: "Set ability stacks",
    displayText: "Set [b]{0}[/b] stacks to [b]{1}[/b]",
    description: "Set the current number of charges for an ability. Clamped between 0 and max stacks.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "stacks",
        name: "Stacks",
        desc: "Number of charges to set",
        type: "number",
        initialValue: "1",
      },
    ],
  },
  function (abilityID, stacks) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    ability.stacks = Math.max(0, Math.min(Math.floor(stacks), ability.maxStacks));
    
    // Start/stop regeneration as needed
    const wasRegenerating = ability.stackCooldown > 0;
    if (ability.stacks < ability.maxStacks && ability.stackCooldown === 0 && ability.canRegenerate) {
      ability.stackCooldown = ability.maxCooldown;
      this._activeTimerCount++;
    } else if (ability.stacks >= ability.maxStacks && wasRegenerating) {
      ability.stackCooldown = 0;
      this._activeTimerCount--;
    }
  }
);

action(
  "Stacks",
  "AddStacks",
  {
    listName: "Add ability stacks",
    displayText: "Add [b]{1}[/b] stacks to [b]{0}[/b]",
    description: "Add charges to an ability. Will not exceed max stacks.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "count",
        name: "Count",
        desc: "Number of charges to add",
        type: "number",
        initialValue: "1",
      },
    ],
  },
  function (abilityID, count) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    ability.stacks = Math.min(ability.stacks + Math.floor(count), ability.maxStacks);
    
    // Stop regeneration if at max
    if (ability.stacks >= ability.maxStacks && ability.stackCooldown > 0) {
      ability.stackCooldown = 0;
      this._activeTimerCount--;
    }
  }
);

action(
  "Stacks",
  "ConsumeStack",
  {
    listName: "Consume ability stack",
    displayText: "Consume 1 stack of [b]{0}[/b]",
    description: "Manually consume one charge of an ability without triggering activation. Starts stack regeneration.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability || ability.stacks <= 0) return;
    
    ability.stacks--;
    
    // Start stack regeneration cooldown if not at max
    if (ability.stacks < ability.maxStacks && ability.stackCooldown === 0 && ability.canRegenerate) {
      ability.stackCooldown = ability.maxCooldown;
      this._activeTimerCount++;
    }
    
    this._triggerAbility(abilityID, "OnStackConsumed");
  }
);

// ============================================================================
// ACTIONS - Ability State
// ============================================================================

action(
  "AbilityState",
  "SetAbilityEnabled",
  {
    listName: "Set ability enabled",
    displayText: "Set [b]{0}[/b] enabled to [b]{1}[/b]",
    description: "Enable or disable an ability. Disabled abilities cannot be activated even if off cooldown.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "enabled",
        name: "Enabled",
        desc: "Whether the ability should be enabled",
        type: "combo",
        initialValue: "enabled",
        items: [
          { enabled: "Enabled" },
          { disabled: "Disabled" },
        ],
      },
    ],
  },
  function (abilityID, enabled) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    this._setFlag(ability, 1, enabled === "enabled");  // FLAG_ENABLED = 1
  }
);

action(
  "AbilityState",
  "SetAbilityActive",
  {
    listName: "Set ability active",
    displayText: "Set [b]{0}[/b] active to [b]{1}[/b]",
    description: "Set whether an ability is currently active (for channeled/duration abilities).",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "active",
        name: "Active",
        desc: "Whether the ability should be active",
        type: "combo",
        initialValue: "active",
        items: [
          { active: "Active" },
          { inactive: "Inactive" },
        ],
      },
    ],
  },
  function (abilityID, active) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    this._setFlag(ability, 2, active === "active");  // FLAG_ACTIVE = 2
  }
);

// ============================================================================
// ACTIONS - Custom Data
// ============================================================================

action(
  "CustomData",
  "SetAbilityData",
  {
    listName: "Set ability data",
    displayText: "Set [b]{0}[/b] data [b]{1}[/b] to [b]{2}[/b]",
    description: "Store custom data on an ability (for passive bonuses, damage values, etc). Data is stored as strings.",
    isAsync: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "key",
        name: "Key",
        desc: "Data key/name",
        type: "string",
        initialValue: '""',
      },
      {
        id: "value",
        name: "Value",
        desc: "Data value (will be converted to string)",
        type: "any",
        initialValue: '""',
      },
    ],
  },
  function (abilityID, key, value) {
    if (!key) return;
    
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return;
    
    // Lazy Map creation - only create when first needed
    if (!ability.data) {
      ability.data = new Map();
    }
    
    ability.data.set(key, String(value));
  }
);

// ============================================================================
// CONDITIONS - Query
// ============================================================================

condition(
  "Query",
  "HasAbility",
  {
    listName: "Has ability",
    displayText: "Has ability [b]{0}[/b]",
    description: "Check if the object has been granted a specific ability.",
    isTrigger: false,
    isInvertible: true,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability to check",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return false;
    
    return this._abilities.has(abilityID);
  }
);

condition(
  "Query",
  "IsAbilityReady",
  {
    listName: "Is ability ready",
    displayText: "Is [b]{0}[/b] ready",
    description: "Check if an ability is off cooldown and enabled (ready to use).",
    isTrigger: false,
    isInvertible: true,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return false;
    
    const enabled = this._hasFlag(ability, 1);  // FLAG_ENABLED
    return ability.cooldown === 0 && enabled;
  }
);

condition(
  "Query",
  "IsAbilityActive",
  {
    listName: "Is ability active",
    displayText: "Is [b]{0}[/b] active",
    description: "Check if an ability is currently active (for channeled/duration abilities).",
    isTrigger: false,
    isInvertible: true,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return false;
    
    return this._hasFlag(ability, 2);  // FLAG_ACTIVE
  }
);

condition(
  "Query",
  "IsAbilityEnabled",
  {
    listName: "Is ability enabled",
    displayText: "Is [b]{0}[/b] enabled",
    description: "Check if an ability is enabled (can be used when off cooldown).",
    isTrigger: false,
    isInvertible: true,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return false;
    
    return this._hasFlag(ability, 1);  // FLAG_ENABLED
  }
);

condition(
  "Query",
  "HasStacks",
  {
    listName: "Has stacks available",
    displayText: "Has [b]{0}[/b] stacks available",
    description: "Check if an ability has at least one charge available.",
    isTrigger: false,
    isInvertible: true,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    return ability && ability.stacks > 0;
  }
);

condition(
  "Query",
  "CompareStacks",
  {
    listName: "Compare stacks",
    displayText: "[b]{0}[/b] stacks [b]{1}[/b] [b]{2}[/b]",
    description: "Compare the current number of charges for an ability.",
    isTrigger: false,
    isInvertible: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "comparison",
        name: "Comparison",
        desc: "How to compare the stacks",
        type: "cmp",
      },
      {
        id: "value",
        name: "Value",
        desc: "Value to compare against",
        type: "number",
        initialValue: "0",
      },
    ],
  },
  function (abilityID, comparison, value) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return false;
    
    return self.C3.compare(ability.stacks, comparison, value);
  }
);

condition(
  "Query",
  "CompareCooldownRemaining",
  {
    listName: "Compare cooldown remaining",
    displayText: "[b]{0}[/b] cooldown [b]{1}[/b] [b]{2}[/b]",
    description: "Compare the remaining cooldown time of an ability.",
    isTrigger: false,
    isInvertible: false,
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
        initialValue: '""',
      },
      {
        id: "comparison",
        name: "Comparison",
        desc: "How to compare the cooldown",
        type: "cmp",
      },
      {
        id: "value",
        name: "Value",
        desc: "Value to compare against (in seconds)",
        type: "number",
        initialValue: "0",
      },
    ],
  },
  function (abilityID, comparison, value) {
    // #10: Simplified conditional check
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return false;
    
    return self.C3.compare(ability.cooldown, comparison, value);
  }
);

// ============================================================================
// CONDITIONS - Triggers
// ============================================================================

condition(
  "Triggers",
  "OnAbilityActivated",
  {
    listName: "On ability activated",
    displayText: "On [b]{0}[/b] activated",
    description: "Triggered when an ability is activated.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnAbilityReady",
  {
    listName: "On ability ready",
    displayText: "On [b]{0}[/b] ready",
    description: "Triggered when an ability's cooldown expires and becomes ready to use.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnAbilityCreated",
  {
    listName: "On ability created",
    displayText: "On [b]{0}[/b] created",
    description: "Triggered when an ability is created for the object.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnAbilityRemoved",
  {
    listName: "On ability removed",
    displayText: "On [b]{0}[/b] removed",
    description: "Triggered when an ability is removed from the object.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnAbilityRemoved",
  {
    listName: "On ability removed",
    displayText: "On [b]{0}[/b] removed",
    description: "Triggered when an ability is removed from the object.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnStackConsumed",
  {
    listName: "On stack consumed",
    displayText: "On [b]{0}[/b] stack consumed",
    description: "Triggered when a charge is consumed from an ability.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

condition(
  "Triggers",
  "OnStackGained",
  {
    listName: "On stack gained",
    displayText: "On [b]{0}[/b] stack gained",
    description: "Triggered when a charge is regenerated or added to an ability.",
    isTrigger: true,
    isInvertible: false,
    highlight: true,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability (empty string for any ability)",
        type: "string",
        initialValue: '""',
      },
    ],
  },
  function (abilityID) {
    if (!abilityID) return true; // Any ability
    
    return this._currentAbilityID === abilityID;
  }
);

// ============================================================================
// EXPRESSIONS - Info
// ============================================================================

expression(
  "Info",
  "GetCooldownRemaining",
  {
    returnType: "number",
    description: "Get the remaining cooldown time in seconds for an ability.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return 0;
    
    return ability.cooldown;
  }
);

expression(
  "Info",
  "GetCooldownProgress",
  {
    returnType: "number",
    description: "Get the cooldown progress from 0 (ready) to 1 (just started). Useful for UI progress bars.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return 0;
    
    if (ability.maxCooldown === 0) return 0;
    
    return ability.cooldown / ability.maxCooldown;
  }
);

expression(
  "Info",
  "GetStacks",
  {
    returnType: "number",
    description: "Get the current number of charges available for an ability.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    return ability ? ability.stacks : 0;
  }
);

expression(
  "Info",
  "GetMaxStacks",
  {
    returnType: "number",
    description: "Get the maximum number of charges for an ability.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    return ability ? ability.maxStacks : 0;
  }
);

expression(
  "Info",
  "GetStackCooldownRemaining",
  {
    returnType: "number",
    description: "Get the time remaining in seconds until the next stack regenerates.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    return ability ? ability.stackCooldown : 0;
  }
);

expression(
  "Info",
  "GetStackProgress",
  {
    returnType: "number",
    description: "Get the stack regeneration progress from 0 (about to regenerate) to 1 (just used). Useful for UI.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability || ability.maxCooldown === 0) return 0;
    
    return ability.stackCooldown / ability.maxCooldown;
  }
);

expression(
  "Info",
  "GetExpirationTime",
  {
    returnType: "number",
    description: "Get the time remaining in seconds before an ability is automatically removed. Returns 0 if no removal scheduled.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
    ],
  },
  function (abilityID) {
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability || !ability.hasRemovalScheduled) return 0;
    
    const timeRemaining = ability.removeAt - this.runtime.gameTime;
    return Math.max(0, timeRemaining);
  }
);

expression(
  "Info",
  "GetAbilityCount",
  {
    returnType: "number",
    description: "Get the total number of abilities currently granted.",
    highlight: false,
    deprecated: false,
    params: [],
  },
  function () {
    // Optimization #8: Fully lazy - don't cache, just return size
    return this._abilities.size;
  }
);

expression(
  "Info",
  "ListActiveAbilities",
  {
    returnType: "string",
    description: "Get a comma-separated list of all ability IDs currently granted.",
    highlight: false,
    deprecated: false,
    params: [],
  },
  function () {
    // Optimization #8: Fully lazy - compute on demand
    return Array.from(this._abilities.keys()).join(",");
  }
);

expression(
  "Info",
  "GetAbilityData",
  {
    returnType: "string",
    description: "Get custom data stored on an ability. Returns empty string if not found.",
    highlight: false,
    deprecated: false,
    params: [
      {
        id: "abilityID",
        name: "Ability ID",
        desc: "Unique identifier for the ability",
        type: "string",
      },
      {
        id: "key",
        name: "Key",
        desc: "Data key to retrieve",
        type: "string",
      },
    ],
  },
  function (abilityID, key) {
    if (!key) return "";
    
    const ability = abilityID && this._abilities.get(abilityID);
    if (!ability) return "";
    
    // Handle lazy Map creation
    if (!ability.data) return "";
    
    return ability.data.get(key) || "";
  }
);

