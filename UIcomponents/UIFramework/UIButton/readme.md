# UIButton Developer Guide

## Overview

![screenshot](./ss.png)

The `UIButton` module provides two main button implementations for the Excalibur UI Framework:

1. **`UIButton`** - A procedurally rendered button with customizable colors, gradients, and 3D depth effects
2. **`UISpriteButton`** - A sprite-based button that uses pre-rendered images for each state

Both classes extend `InteractiveUIComponent` and implement `IFocusable`, `IHoverable`, and `IClickable` interfaces.

## Architecture

### Class Hierarchy

```
UIComponent (base)
├── InteractiveUIComponent
    ├── UIButton
    │   └── UIButtonGraphic (rendering)
    └── UISpriteButton
        └── UISpriteButtonGraphic (rendering)
```

### Key Components

- **UIButton/ UISpriteButton**: Main component classes handling interaction logic
- **UIButtonGraphic/ UISpriteButtonGraphic**: Rendering implementations
- **UIButtonEvents**: Type-safe event definitions
- **UIButtonState**: Visual state enumeration

## UIButton Class

### Configuration

```typescript
type UIButtonConfig = BaseUIConfig & {
  // Interaction
  callback?: () => void;

  // Appearance
  buttonRadius?: number;
  colors?: UIButtonColors;
  pressDepth?: number;
  buttonDepthOffset?: number;

  // Text
  idleText?: string;
  activeText?: string;
  hoveredText?: string;
  disabledText?: string;
  textOptions?: Omit<TextOptions, "text">;

  // Focus
  focusIndicator?: Vector;
  tabStopIndex?: number;
  customFocus?(ctx: CanvasRenderingContext2D, width: number, height: number): void;
};
```

### State Management

The button maintains four visual states:

```typescript
type UIButtonState = "idle" | "hovered" | "pressed" | "disabled";
```

State transitions are handled by `updateState()`:

```typescript
updateState() {
  if (!this.isEnabled) {
    this.state = "disabled";
    return;
  }

  if (this.isPressed) {
    this.state = "pressed";
  } else if (this._isHovered) {
    this.state = "hovered";
  } else {
    this.state = "idle";
  }
}
```

### Event System

Buttons emit the following events through their `emitter` property:

```typescript
type UIButtonEvents = {
  UIButtonClicked: UIButtonClicked;
  UIButtonDown: UIButtonDown;
  UIButtonUp: UIButtonUp;
  UIButtonHovered: UIButtonHovered;
  UIButtonUnhovered: UIButtonUnhovered;
  UIButtonDisabled: UIButtonDisabled;
  UIButtonEnabled: UIButtonEnabled;
  UIButtonFocused: UIButtonFocused;
  UIButtonUnfocused: UIButtonUnfocused;
};
```

### Input Handling

#### Mouse/Pointer Events

- `pointerenter` → `onHover()` → `UIButtonHovered` event
- `pointerleave` → `onUnhover()` → `UIButtonUnhovered` event
- `pointerdown` → `onPointerDown()` → `UIButtonDown` event
- `pointerup` → `onClick()` → `UIButtonUp` + `UIButtonClicked` events

#### Keyboard Events

- `keydown` (Space/Enter when focused) → `onKeyDown()` → `UIButtonDown` event
- `keyup` (Space/Enter when focused) → `onKeyUp()` → `UIButtonUp` + `UIButtonClicked` events

### Focus Management

Buttons integrate with `UIFocusManager` for keyboard navigation:

```typescript
// Set focus programmatically
button.focus();
button.loseFocus();

// Check focus state
if (button.isFocused) { ... }

// Custom focus indicator
const button = new UIButton({
  customFocus: (ctx, width, height) => {
    // Draw custom focus ring
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width-4, height-4);
  }
});
```

## UIButtonGraphic Rendering

### Rendering Pipeline

1. **Offscreen Canvas**: Button renders to an HTML5 canvas for performance
2. **Layered Drawing**: Bottom depth layer + top face + text + focus indicator
3. **State-Based Styling**: Colors and effects change based on `UIButtonState`

### Key Rendering Methods

```typescript
protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
  // 1. Clear canvas
  // 2. Apply disabled filter if needed
  // 3. Draw bottom depth layer
  // 4. Draw top face with state-based gradient
  // 5. Draw text using canvas-txt
  // 6. Draw focus indicator
  // 7. Upload to Excalibur context
}
```

### Gradient System

```typescript
private topGradient(ctx: CanvasRenderingContext2D, state: UIButtonState): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, this.size.y);

  switch (state) {
    case "hovered":
      gradient.addColorStop(0, this.colors.hoverStarting.toString());
      // ... add ending color
      break;
    case "disabled":
      // ... grayscale effect applied via CSS filter
      break;
    default: // idle/pressed
      gradient.addColorStop(0, this.colors.mainStarting.toString());
      // ... add ending color
  }

  return gradient;
}
```

### 3D Depth Effect

The button creates a "pressed" effect using layered rendering:

```typescript
const pressOffset = isPressed ? this.depthPressed : 0;

// Bottom layer (shadow/depth)
this.drawRoundedRect(ctx, 0, depth + depthOffset, width, height, radius, bottomGradient);

// Top layer (face) - offset when pressed
this.drawRoundedRect(ctx, 0, pressOffset, width, height, radius, topGradient);
```

## UISpriteButton Class

### Configuration

```typescript
type UISpriteButtonConfig = BaseUIConfig & {
  sprites?: {
    idle?: Sprite;
    hovered?: Sprite;
    pressed?: Sprite;
    disabled?: Sprite;
  };
  // ... same text and interaction options as UIButton
};
```

### Sprite Rendering

Unlike `UIButton`, `UISpriteButton` uses pre-rendered sprites:

```typescript
class UISpriteButtonGraphic extends Graphic {
  // Renders the appropriate sprite based on current state
  // Overlays text and focus indicator on top of sprite
}
```

## Usage Examples

### Basic Button

```typescript
const button = new UIButton({
  name: "myButton",
  width: 100,
  height: 50,
  pos: vec(100, 100),
  idleText: "Click Me!",
  callback: () => console.log("Clicked!"),
});

engine.add(button);
```

### Advanced Configuration

```typescript
const advancedButton = new UIButton({
  name: "advanced",
  width: 150,
  height: 60,
  pos: vec(200, 200),
  z: 10,

  // Custom colors
  colors: {
    mainStarting: Color.Blue,
    mainEnding: Color.DarkBlue,
    hoverStarting: Color.LightBlue,
    bottomStarting: Color.DarkGray,
  },

  // Text per state
  idleText: "Normal",
  hoveredText: "Hovering!",
  activeText: "Pressed!",

  // 3D effect
  pressDepth: 6,
  buttonRadius: 20,

  // Keyboard navigation
  tabStopIndex: 1,

  // Custom focus indicator
  focusIndicator: vec(20, 20),
});

// Event handling
advancedButton.emitter.on("UIButtonClicked", event => {
  console.log("Advanced button clicked!");
});
```

### Sprite Button

```typescript
const spriteButton = new UISpriteButton({
  name: "spriteBtn",
  width: 64,
  height: 32,
  pos: vec(300, 100),
  sprites: {
    idle: idleSprite,
    hovered: hoverSprite,
    pressed: pressedSprite,
    disabled: disabledSprite,
  },
  idleText: "Sprite Button",
});
```

## API Reference

### UIButton Properties

- `buttonState: UIButtonState` - Current visual state
- `isHovered: boolean` - Mouse hover status
- `isFocused: boolean` - Keyboard focus status
- `isEnabled: boolean` - Interaction enabled status
- `eventEmitter: EventEmitter<UIButtonEvents>` - Event system access

### UIButton Methods

- `focus()` - Give keyboard focus
- `loseFocus()` - Remove keyboard focus
- `setEnabled(enabled: boolean)` - Enable/disable interaction
- `updateState()` - Force state recalculation

### Configuration Options

See `UIButtonConfig` and `UISpriteButtonConfig` type definitions for complete API.

## Dependencies

- `excalibur`: Core game engine
- `canvas-txt`: Text rendering utility
- Base UI framework components (`UIComponent`, `InteractiveUIComponent`, etc.)
