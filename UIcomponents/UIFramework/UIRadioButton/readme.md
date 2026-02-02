# UIRadioGroup

A radio group component for the Excalibur UI Framework that manages a collection of checkboxes to behave like radio buttons, ensuring
only one option can be selected at a time.

## Overview

![ss](./ss.png)

The `UIRadioGroup` is not a visual component itself, but a controller that manages multiple `UICheckbox` or `UISpriteCheckbox`
components to provide radio button functionality. It automatically handles selection state synchronization and provides events for
selection changes.

## Quick Start

```typescript
import { UIRadioGroup, UICheckbox, Color } from "excalibur-ui";

// Create radio group
const difficultyGroup = new UIRadioGroup({
  name: "difficulty",
  selectedIndex: 0, // Start with first option selected
});

// Create checkboxes for the options
const easyCheckbox = new UICheckbox({
  text: "Easy",
  pos: vec(100, 100),
  colors: { fill: Color.Green },
});

const mediumCheckbox = new UICheckbox({
  text: "Medium",
  pos: vec(100, 130),
  colors: { fill: Color.Yellow },
});

const hardCheckbox = new UICheckbox({
  text: "Hard",
  pos: vec(100, 160),
  colors: { fill: Color.Red },
});

// Add checkboxes to the group
difficultyGroup.add(easyCheckbox);
difficultyGroup.add(mediumCheckbox);
difficultyGroup.add(hardCheckbox);

// Listen for selection changes
difficultyGroup.emitter.on("UIRadioGroupChanged", event => {
  console.log(`Selected difficulty: ${event.selectedIndex}`);
});

// Add to engine
engine.add(easyCheckbox);
engine.add(mediumCheckbox);
engine.add(hardCheckbox);
```

## Features

- **Mutual Exclusion**: Only one checkbox can be selected at a time
- **Automatic Management**: Handles checkbox state synchronization
- **Flexible Configuration**: Support for both standard and sprite checkboxes
- **Event System**: Comprehensive events for selection changes
- **Deselect Support**: Optional ability to deselect all options
- **Dynamic Management**: Add/remove checkboxes at runtime
- **State Queries**: Get selected item, index, or all items

## Basic Usage

### Creating a Radio Group

```typescript
const radioGroup = new UIRadioGroup({
  name: "myRadioGroup", // Identifier for the group
  allowDeselect: false, // Can user deselect all? (default: false)
  selectedIndex: -1, // Start with none selected (default: -1)
});
```

### Adding Checkboxes

```typescript
// Create checkboxes
const option1 = new UICheckbox({ text: "Option 1", pos: vec(50, 50) });
const option2 = new UICheckbox({ text: "Option 2", pos: vec(50, 80) });
const option3 = new UICheckbox({ text: "Option 3", pos: vec(50, 110) });

// Add to group
radioGroup.add(option1);
radioGroup.add(option2);
radioGroup.add(option3);
```

### Sprite-Based Radio Buttons

```typescript
const spriteGroup = new UIRadioGroup({ name: "spriteRadios" });

// Create sprite checkboxes
const spriteOption1 = new UISpriteCheckbox({
  sprites: { unchecked: uncheckedSprite, checked: checkedSprite },
  pos: vec(200, 50),
});

const spriteOption2 = new UISpriteCheckbox({
  sprites: { unchecked: uncheckedSprite, checked: checkedSprite },
  pos: vec(200, 80),
});

spriteGroup.add(spriteOption1);
spriteGroup.add(spriteOption2);
```

## Selection Management

### Programmatic Selection

```typescript
// Select by index
radioGroup.select(1); // Select second option (0-based)

// Select first option
radioGroup.select(0);

// Deselect all (only if allowDeselect is true)
radioGroup.deselect();
```

### Reading Selection State

```typescript
// Get selected index (-1 if none selected)
const selectedIndex = radioGroup.selectedIndex;

// Get selected checkbox (null if none selected)
const selectedCheckbox = radioGroup.selectedCheckbox;

// Check if anything is selected
if (radioGroup.selectedIndex >= 0) {
  console.log("Selected option:", radioGroup.selectedIndex);
}
```

### Dynamic Management

```typescript
// Add new option
const newOption = new UICheckbox({ text: "New Option" });
radioGroup.add(newOption);

// Remove option
radioGroup.remove(option2);

// Get all checkboxes
const allCheckboxes = radioGroup.items;

// Get count
const totalOptions = radioGroup.count;

// Clear all
radioGroup.clear();
```

## Event Handling

### Selection Change Events

```typescript
radioGroup.emitter.on("UIRadioGroupChanged", event => {
  console.log("Selection changed:");
  console.log("  From:", event.previousIndex);
  console.log("  To:", event.selectedIndex);
  console.log("  Selected checkbox:", event.selectedCheckbox?.name);
});
```

### Complete Example with Events

```typescript
class SettingsMenu {
  private difficultyGroup: UIRadioGroup;
  private checkboxes: UICheckbox[] = [];

  constructor() {
    this.difficultyGroup = new UIRadioGroup({
      name: "difficulty",
      selectedIndex: 1, // Default to medium
    });

    // Create difficulty options
    const difficulties = ["Easy", "Medium", "Hard", "Expert"];
    difficulties.forEach((label, index) => {
      const checkbox = new UICheckbox({
        text: label,
        pos: vec(100, 100 + index * 30),
        colors: this.getDifficultyColor(index),
      });

      this.checkboxes.push(checkbox);
      this.difficultyGroup.add(checkbox);
    });

    // Handle difficulty changes
    this.difficultyGroup.emitter.on("UIRadioGroupChanged", event => {
      this.onDifficultyChanged(event.selectedIndex);
    });
  }

  private getDifficultyColor(index: number): any {
    const colors = [{ fill: Color.Green }, { fill: Color.Yellow }, { fill: Color.Orange }, { fill: Color.Red }];
    return colors[index] || { fill: Color.Gray };
  }

  private onDifficultyChanged(selectedIndex: number) {
    const difficulties = ["Easy", "Medium", "Hard", "Expert"];
    const selectedDifficulty = difficulties[selectedIndex];

    console.log(`Difficulty changed to: ${selectedDifficulty}`);

    // Apply game settings based on difficulty
    switch (selectedIndex) {
      case 0: // Easy
        this.setEasySettings();
        break;
      case 1: // Medium
        this.setMediumSettings();
        break;
      case 2: // Hard
        this.setHardSettings();
        break;
      case 3: // Expert
        this.setExpertSettings();
        break;
    }
  }

  private setEasySettings() {
    /* ... */
  }
  private setMediumSettings() {
    /* ... */
  }
  private setHardSettings() {
    /* ... */
  }
  private setExpertSettings() {
    /* ... */
  }

  show() {
    this.checkboxes.forEach(checkbox => engine.add(checkbox));
  }

  hide() {
    this.checkboxes.forEach(checkbox => engine.remove(checkbox));
  }
}
```

## Configuration Options

### UIRadioGroupConfig

- `name?: string` - Identifier for the radio group
- `allowDeselect?: boolean` - Allow deselection of selected items (default: false)
- `selectedIndex?: number` - Initial selected index (-1 for none)

## API Reference

### Properties

- `name: string` - Group identifier
- `selectedIndex: number` - Currently selected index (-1 if none)
- `selectedCheckbox: UICheckbox | UISpriteCheckbox | null` - Currently selected checkbox
- `items: (UICheckbox | UISpriteCheckbox)[]` - All checkboxes in group
- `count: number` - Number of checkboxes in group
- `eventEmitter: EventEmitter<UIRadioGroupEvents>` - Event system access

### Methods

- `add(checkbox: UICheckbox | UISpriteCheckbox)` - Add checkbox to group
- `remove(checkbox: UICheckbox | UISpriteCheckbox)` - Remove checkbox from group
- `select(index: number)` - Select checkbox by index
- `deselect()` - Deselect all (if allowed)
- `clear()` - Remove all checkboxes
- `setEnabled(enabled: boolean)` - Enable/disable all checkboxes
- `getCheckbox(index: number): UICheckbox | UISpriteCheckbox | null` - Get checkbox by index

### Events

- `UIRadioGroupChanged` - Emitted when selection changes
  - `selectedIndex: number` - New selected index
  - `selectedCheckbox: UICheckbox | UISpriteCheckbox | null` - Selected checkbox
  - `previousIndex: number` - Previously selected index
