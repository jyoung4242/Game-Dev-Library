# UICheckbox Developer Guide

## Overview

![ss](./ss.png)

The `UICheckbox` module provides two checkbox implementations for the Excalibur UI Framework:

1. **`UICheckbox`** - A procedurally rendered checkbox with customizable colors, borders, and checkmark styles
2. **`UISpriteCheckbox`** - A sprite-based checkbox that uses pre-rendered images for checked/unchecked states

Both classes extend `InteractiveUIComponent` and implement `IFocusable` and `IClickable` interfaces.

## Architecture

### Class Hierarchy

```
UIComponent (base)
├── InteractiveUIComponent
    ├── UICheckbox
    │   └── UICheckboxGraphic (rendering)
    └── UISpriteCheckbox
        └── UISpriteCheckboxGraphic (rendering)
```

### Key Components

- **UICheckbox/ UISpriteCheckbox**: Main component classes handling interaction logic
- **UICheckboxGraphic/ UISpriteCheckboxGraphic**: Rendering implementations
- **UICheckboxEvents**: Type-safe event definitions
- **Checkmark Styles**: "check", "x", "fill" visual representations

## UICheckbox Class

### Configuration

```typescript
type UICheckboxConfig = BaseUIConfig & {
  // State
  checked?: boolean;

  // Appearance
  borderRadius?: number;
  checkmarkStyle?: "check" | "x" | "fill";
  colors?: UICheckboxColors;

  // Focus
  focusIndicator?: Vector;
  tabStopIndex?: number;
};
```

### State Management

The checkbox maintains a simple boolean checked state:

```typescript
private _checked: boolean;
```

State changes are handled through the `checked` getter/setter:

```typescript
get checked(): boolean {
  return this._checked;
}

set checked(value: boolean) {
  if (value !== this._checked) {
    this._checked = value;
    this.emitter.emit("UICheckboxChanged", {
      name: this.name,
      target: this,
      checked: this._checked
    });
  }
}
```

### Event System

Checkboxes emit the following events through their `emitter` property:

```typescript
type UICheckboxEvents = {
  UICheckboxChanged: UICheckboxChanged;
  UICheckboxFocused: UICheckboxFocused;
  UICheckboxUnfocused: UICheckboxUnfocused;
  UICheckboxUp: UICheckboxUp;
  UICheckboxDown: UICheckboxDown;
  UICheckboxEnabled: UICheckboxEnabled;
  UICheckboxDisabled: UICheckboxDisabled;
};
```

### Input Handling

#### Mouse/Pointer Events

- `pointerdown` → `onPointerDown()` → `UICheckboxDown` event
- `pointerup` → `onClick()` → `UICheckboxUp` event + state toggle

#### Keyboard Events

- `keydown` (Space/Enter when focused) → `onKeyDown()` → state toggle

### Focus Management

Checkboxes integrate with `UIFocusManager` for keyboard navigation:

```typescript
// Set focus programmatically
checkbox.focus();
checkbox.loseFocus();

// Check focus state
if (checkbox.isFocused) { ... }

// Custom focus indicator
const checkbox = new UICheckbox({
  focusIndicator: vec(10, 10)
});
```

## UICheckboxGraphic Rendering

### Rendering Pipeline

1. **Offscreen Canvas**: Checkbox renders to an HTML5 canvas for performance
2. **Padding**: Adds 4px padding around the checkbox for focus indicator space
3. **Layered Drawing**: Background box → checkmark → focus indicator
4. **State-Based Styling**: Colors change based on checked/enabled state

### Key Rendering Methods

```typescript
protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
  // 1. Clear canvas with padding
  // 2. Apply disabled filter if needed
  // 3. Draw background box with border
  // 4. Draw checkmark based on style
  // 5. Draw focus indicator
  // 6. Upload to Excalibur context
}
```

### Checkmark Styles

The checkbox supports three visual checkmark styles:

#### "check" (Default)

```typescript
// Draws a checkmark symbol
ctx.beginPath();
ctx.moveTo(centerX - size * 0.4, centerY);
ctx.lineTo(centerX - size * 0.1, centerY + size * 0.4);
ctx.lineTo(centerX + size * 0.5, centerY - size * 0.3);
ctx.stroke();
```

#### "x"

```typescript
// Draws an X symbol
ctx.beginPath();
ctx.moveTo(centerX - size, centerY - size);
ctx.lineTo(centerX + size, centerY + size);
ctx.moveTo(centerX + size, centerY - size);
ctx.lineTo(centerX - size, centerY + size);
ctx.stroke();
```

#### "fill"

```typescript
// Draws a filled inner rectangle
ctx.beginPath();
ctx.fillStyle = checkmarkColor;
ctx.roundRect(margin, margin, width - margin * 2, height - margin * 2, borderRadius - 2);
ctx.fill();
```

### Color System

```typescript
type UICheckboxColors = {
  border?: Color; // Border color
  background?: Color; // Unchecked background
  backgroundChecked?: Color; // Checked background
  checkmark?: Color; // Checkmark/X/fill color
  disabled?: Color; // Disabled state color
};
```

## UISpriteCheckbox Class

### Configuration

```typescript
type UISpriteCheckboxConfig = BaseUIConfig & {
  checked?: boolean;
  sprites?: {
    unchecked?: Sprite;
    checked?: Sprite;
  };
  focusIndicator?: Vector;
  tabStopIndex?: number;
};
```

### Sprite Rendering

Unlike `UICheckbox`, `UISpriteCheckbox` uses pre-rendered sprites:

```typescript
class UISpriteCheckboxGraphic extends Graphic {
  // Renders the appropriate sprite based on checked state
  // Overlays focus indicator on top of sprite
}
```

The sprite rendering provides a fallback box if no sprites are provided.

## Usage Examples

### Basic Checkbox

```typescript
const checkbox = new UICheckbox({
  name: "myCheckbox",
  width: 24,
  height: 24,
  pos: vec(100, 100),
  checked: false,
});

engine.add(checkbox);
```

### Advanced Configuration

```typescript
const advancedCheckbox = new UICheckbox({
  name: "advanced",
  width: 32,
  height: 32,
  pos: vec(200, 200),
  z: 10,

  // Initial state
  checked: true,

  // Visual style
  checkmarkStyle: "x",
  borderRadius: 8,

  // Custom colors
  colors: {
    border: Color.Blue,
    background: Color.LightGray,
    backgroundChecked: Color.Green,
    checkmark: Color.White,
    disabled: Color.Gray,
  },

  // Keyboard navigation
  tabStopIndex: 2,

  // Custom focus position
  focusIndicator: vec(8, 8),
});

// Event handling
advancedCheckbox.emitter.on("UICheckboxChanged", event => {
  console.log("Checkbox changed:", event.checked);
});
```

### Sprite Checkbox

```typescript
const spriteCheckbox = new UISpriteCheckbox({
  name: "spriteCheckbox",
  width: 32,
  height: 32,
  pos: vec(300, 100),
  checked: false,
  sprites: {
    unchecked: uncheckedSprite,
    checked: checkedSprite,
  },
  tabStopIndex: 3,
});
```

### Programmatic Control

```typescript
// Toggle programmatically
checkbox.toggle();

// Set specific state
checkbox.checked = true;

// Check current state
if (checkbox.checked) {
  console.log("Checkbox is checked");
}
```

## API Reference

### UICheckbox Properties

- `checked: boolean` - Current checked state (getter/setter)
- `isFocused: boolean` - Keyboard focus status
- `isEnabled: boolean` - Interaction enabled status
- `eventEmitter: EventEmitter<UICheckboxEvents>` - Event system access

### UICheckbox Methods

- `toggle()` - Toggle the checked state
- `focus()` - Give keyboard focus
- `loseFocus()` - Remove keyboard focus
- `setEnabled(enabled: boolean)` - Enable/disable interaction

### Configuration Options

See `UICheckboxConfig` and `UISpriteCheckboxConfig` type definitions for complete API.

### Checkmark Styles

- `"check"` - Traditional checkmark symbol (default)
- `"x"` - X symbol
- `"fill"` - Filled inner rectangle

## Dependencies

- `excalibur`: Core game engine
- Base UI framework components (`UIComponent`, `InteractiveUIComponent`, etc.)
