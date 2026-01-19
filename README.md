<img src="./src/icon.svg" width="100" /><br>
# Simple Abilities
<i>A lightweight ability system for fast-paced action games. Handles ability granting, cooldowns, activation callbacks, and custom data storage. Perfect for Nuclear Throne-style arcade games with quick ability activations and passive mutations.</i> <br>
### Version 1.3.1.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon-simple_abilities/releases/download/salmanshh_simple_abilities-1.3.1.0.c3addon/salmanshh_simple_abilities-1.3.1.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon-simple_abilities/releases) </sub> <br>

#### What's New in 1.3.1.0
**Fixed:**
- "IsAbilityReady" conditionnow properly includes stack availability

<sub>[View full changelog](#changelog)</sub>

---
<b><u>Author:</u></b> SalmanShh <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Activate ability | Trigger an ability activation callback. Only works if ability is ready (off cooldown and enabled). | Ability ID             *(string)* <br> |
| Clear all abilities | Remove all abilities from the object. Triggers removal event for each ability. |  |
| Create ability | Give the object an ability. Creates a new ability slot if it doesn't exist. | Ability ID             *(string)* <br> |
| Create ability with cooldown | Give the object an ability and set its cooldown in one action. Useful for initial setup. | Ability ID             *(string)* <br>Cooldown             *(number)* <br> |
| Create ability with cooldown and stacks | Give the object an ability and set its cooldown and max stacks in one action. Perfect for charge-based abilities. | Ability ID             *(string)* <br>Cooldown             *(number)* <br>Max stacks             *(number)* <br> |
| Create temporary ability | Create an ability that automatically removes itself after a duration. If ability already exists, just schedules new removal time Perfect for temporary power-ups and time-limited buffs. | Ability ID             *(string)* <br>Duration             *(number)* <br> |
| Remove ability | Remove an ability from the object. Deletes all associated data. | Ability ID             *(string)* <br> |
| Remove ability after duration | Schedule automatic removal of an ability after a duration. Useful for temporary power-ups and time-limited abilities. | Ability ID             *(string)* <br>Duration             *(number)* <br> |
| Set ability active | Set whether an ability is currently active (for channeled/duration abilities). | Ability ID             *(string)* <br>Active             *(combo)* <br> |
| Set ability enabled | Enable or disable an ability. Disabled abilities cannot be activated even if off cooldown. | Ability ID             *(string)* <br>Enabled             *(combo)* <br> |
| Reset cooldown | Instantly reset an ability's cooldown to 0, making it ready to use immediately. | Ability ID             *(string)* <br> |
| Set ability cooldown | Set the cooldown time for an ability. The ability will not be usable until the cooldown expires. | Ability ID             *(string)* <br>Seconds             *(number)* <br> |
| Set ability data | Store custom data on an ability (for passive bonuses, damage values, etc). Data is stored as strings. | Ability ID             *(string)* <br>Key             *(string)* <br>Value             *(any)* <br> |
| Add ability stacks | Add charges to an ability. Will not exceed max stacks. | Ability ID             *(string)* <br>Count             *(number)* <br> |
| Consume ability stack | Manually consume one charge of an ability without triggering activation. Starts stack regeneration. | Ability ID             *(string)* <br> |
| Set ability max stacks | Set the maximum number of charges an ability can have. Current stacks will be clamped to new max. | Ability ID             *(string)* <br>Max stacks             *(number)* <br> |
| Set ability stacks | Set the current number of charges for an ability. Clamped between 0 and max stacks. | Ability ID             *(string)* <br>Stacks             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| Compare cooldown remaining | Compare the remaining cooldown time of an ability. | Ability ID *(string)* <br>Comparison *(cmp)* <br>Value *(number)* <br> |
| Compare stacks | Compare the current number of charges for an ability. | Ability ID *(string)* <br>Comparison *(cmp)* <br>Value *(number)* <br> |
| Has ability | Check if the object has been granted a specific ability. | Ability ID *(string)* <br> |
| Has stacks available | Check if an ability has at least one charge available. | Ability ID *(string)* <br> |
| Is ability active | Check if an ability is currently active (for channeled/duration abilities). | Ability ID *(string)* <br> |
| Is ability enabled | Check if an ability is enabled (can be used when off cooldown). | Ability ID *(string)* <br> |
| Is ability ready | Check if an ability is off cooldown, has stacks available, and is enabled (ready to use). | Ability ID *(string)* <br> |
| On ability activated | Triggered when an ability is activated. | Ability ID *(string)* <br> |
| On ability created | Triggered when an ability is created for the object. | Ability ID *(string)* <br> |
| On ability ready | Triggered when an ability's cooldown expires and becomes ready to use. | Ability ID *(string)* <br> |
| On ability removed | Triggered when an ability is removed from the object. The ability may be removed due to expiration or manual removal. | Ability ID *(string)* <br> |
| On max stacks reached | Triggered when attempting to add charges beyond the maximum stack limit. Useful for UI feedback or sound effects. | Ability ID *(string)* <br> |
| On stack consumed | Triggered when a charge is consumed from an ability. The ability may lose charges due to activation or manual consumption. | Ability ID *(string)* <br> |
| On stack gained | Triggered when a charge is regenerated or added to an ability. The ability may gain charges due to regeneration or manual addition. | Ability ID *(string)* <br> |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| GetAbilityCount | Get the total number of abilities currently granted. | number |  | 
| GetAbilityData | Get custom data stored on an ability. Returns empty string if not found. | string | Ability ID *(string)* <br>Key *(string)* <br> | 
| GetCooldownProgress | Get the cooldown progress from 0 (ready) to 1 (just started). Useful for UI progress bars. | number | Ability ID *(string)* <br> | 
| GetCooldownRemaining | Get the remaining cooldown time in seconds for an ability. | number | Ability ID *(string)* <br> | 
| GetExpirationProgress | Get the expiration progress from 0 (just created) to 1 (about to expire). Useful for countdown UI bars. | number | Ability ID *(string)* <br> | 
| GetExpirationTime | Get the time remaining in seconds before an ability is automatically removed. Returns 0 if no removal scheduled. | number | Ability ID *(string)* <br> | 
| GetMaxExpirationTime | Get the maximum expiration duration in seconds that was set for an ability. Returns 0 if no expiration was set. | number | Ability ID *(string)* <br> | 
| GetMaxStacks | Get the maximum number of charges for an ability. | number | Ability ID *(string)* <br> | 
| GetStackCooldownRemaining | Get the time remaining in seconds until the next stack regenerates. | number | Ability ID *(string)* <br> | 
| GetStackProgress | Get the stack regeneration progress from 0 (about to regenerate) to 1 (just used). Useful for UI. | number | Ability ID *(string)* <br> | 
| GetStacks | Get the current number of charges available for an ability. | number | Ability ID *(string)* <br> | 
| ListActiveAbilities | Get a comma-separated list of all ability IDs currently granted. | string |  | 


---
## Changelog

### Version 1.3.1.0

**Fixed:**
- "IsAbilityReady" conditionnow properly includes stack availability
---

### Version 1.3.0.0

**Added:**
- GetMaxExpirationTime() expression.

**Fixed:**
- performance improvements, the addon will now scale significantly better. With 1000+ instances having mostly idle abilities, only the few with active cooldowns/regeneration will consume CPU time, meaning it only ticks if theres an active timer (expiration/cooldowns)
---

### Version 1.2.0.0

**Added:**
- Expiration TIme for abilities shows up on Debugger.
- GetExpirationProgress(Ability ID) expression 

---

### Version 1.1.1.0

**Added:**
Add trigger for max stacks reached event in ability system

---

### Version 1.1.0.0

**Added:**
Implement temporary ability management and automatic removal features

**Changed:**
Debugger: Abilities retain their behaviour's name so its easier to know which behaviour instance they originate from.

---

### Version 1.0.0.0

**Added:**
Ability Management
- Create/remove abilities with unique IDs
- Enable/disable abilities independently
- Active state tracking for channeled abilities

Cooldown System
- Automatic cooldown tracking per frame
- "On Ready" triggers when cooldowns expire
- Manual cooldown manipulation

Stack/Charge System
- Multi-use abilities (dash 3 times, throw 5 grenades)
- Automatic charge regeneration
- Individual stack consumption with triggers

Custom Data Storage
- Store arbitrary key-value data per ability
- Perfect for damage values, range, passive bonuses
- Lazy-loaded for memory efficiency

Event Triggers
- On Ability Ready/Activated/Created/Removed
- On Stack Consumed/Gained
- Filter by specific ability or catch all

---

### Version 0.0.0.0

**Added:**
Initial release.

---
