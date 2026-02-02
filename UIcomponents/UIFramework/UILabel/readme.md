# UILabel Developer Guide

## Overview

The `UILabel` module provides a display component for rendering styled text in Excalibur UI. It supports customizable fonts, colors,
backgrounds, and optional hover effects with event-driven state management.

## Architecture

### Class Hierarchy

```
UIComponent (base)
├── DisplayUIComponent
    └── UILabel
        └── UILabelGraphic (rendering)
```

### Key Components

- **UILabel**: Main component class handling text display and configuration
- **UILabelGraphic**: Rendering implementation with canvas-based text drawing
- **UILabelState**: Type defining visual states
- **UILabelEvents**: Type-safe event definitions

## UILabel Class

### Configuration

```typescript
type UILabelConfig = BaseUIConfig & {
  // Text
  text?: string;
  textOptions?: Omit<TextOptions, "text">;

  // Styling
  colors?: UILabelColors;
  labelRadius?: number;
  padding?: Vector;

  // Interaction
  enableHover?: boolean;
};
```

### Visual States

The label supports three visual states:

```typescript
type UILabelState = "idle" | "hovered" | "disabled";
```

State transitions are handled by `updateState()`:

```typescript
private updateState(): void {
  if (!this.isEnabled) {
    this.state = "disabled";
  } else if (this._isHovered) {
    this.state = "hovered";
  } else {
    this.state = "idle";
  }
}
```

### Text Management

Labels provide getter/setter methods for text content:

```typescript
// Get current text
const currentText = label.getText();

// Set new text (emits event if changed)
label.setText("New text content");
```

### Hover Support

Labels can optionally respond to hover events:

```typescript
const hoverableLabel = new UILabel({
  enableHover: true, // Enable hover detection
  colors: {
    hoverStarting: Color.LightBlue,
    textHoverColor: Color.White,
  },
});

// Check hover state
if (label.isHovered) {
  console.log("Label is being hovered");
}
```

### Event System

UILabel emits events for state and content changes:

```typescript
type UILabelEvents = {
  UILabelTextChanged: UILabelTextChanged;
  UILabelHovered: UILabelHovered;
  UILabelUnhovered: UILabelUnhovered;
  UILabelEnabled: UILabelEnabled;
  UILabelDisabled: UILabelDisabled;
};
```

## UILabelGraphic Rendering

### Rendering Pipeline

1. **Canvas Creation**: Offscreen HTML5 canvas for rendering
2. **Background**: Optional gradient background with rounded corners
3. **Text Rendering**: Uses `canvas-txt` library for advanced text layout
4. **State-Based Styling**: Colors and effects change based on `UILabelState`

### Key Rendering Methods

```typescript
protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
  // 1. Clear canvas
  // 2. Apply disabled filter if needed
  // 3. Draw background gradient (if configured)
  // 4. Draw text with proper styling and padding
  // 5. Upload to Excalibur context
}
```

### Text Rendering

Labels use the `canvas-txt` library for advanced text layout:

```typescript
drawText(ctx, this.owner.getText(), {
  x: this.padding.x,
  y: this.padding.y,
  width: this.size.x - this.padding.x * 2,
  height: this.size.y - this.padding.y * 2,
  fontSize: font?.size ?? 20,
  font: font?.family ?? "Arial",
  align: "left",
  vAlign: "top",
});
```

### Background Gradients

The graphic creates state-based gradients:

```typescript
private backgroundGradient(ctx: CanvasRenderingContext2D, state: UILabelState): CanvasGradient | null {
  const gradient = ctx.createLinearGradient(0, 0, 0, this.size.y);

  switch (state) {
    case "hovered":
      if (this.colors.hoverStarting) {
        gradient.addColorStop(0, this.colors.hoverStarting.toString());
        gradient.addColorStop(1, (this.colors.hoverEnding ?? this.colors.hoverStarting).toString());
      }
      break;
    case "disabled":
      // Apply grayscale filter + optional disabled colors
      break;
    default: // idle
      if (this.colors.backgroundStarting && !this.colors.backgroundStarting.equal(Color.Transparent)) {
        gradient.addColorStop(0, this.colors.backgroundStarting.toString());
        gradient.addColorStop(1, (this.colors.backgroundEnding ?? this.colors.backgroundStarting).toString());
      }
  }

  return gradient;
}
```

## Usage Examples

### Basic Text Label

```typescript
import { UILabel } from "excalibur-ui";

const label = new UILabel({
  name: "title",
  width: 200,
  height: 50,
  pos: vec(100, 100),
  text: "Hello World!",
  textOptions: {
    font: new Font({ size: 24, family: "Arial" }),
    color: Color.Black,
  },
});

engine.add(label);
```

### Styled Label with Background

```typescript
const styledLabel = new UILabel({
  name: "styled",
  width: 300,
  height: 60,
  pos: vec(50, 50),
  text: "Styled Label",
  textOptions: {
    font: new Font({ size: 18, family: "Arial", bold: true }),
    color: Color.White,
  },

  // Background styling
  colors: {
    backgroundStarting: Color.DarkBlue,
    backgroundEnding: Color.Blue,
  },
  labelRadius: 8,
  padding: vec(12, 12),
});
```

### Interactive Hover Label

```typescript
const interactiveLabel = new UILabel({
  name: "interactive",
  width: 250,
  height: 40,
  pos: vec(100, 200),
  text: "Hover over me!",
  enableHover: true,

  // Hover effects
  colors: {
    backgroundStarting: Color.LightGray,
    hoverStarting: Color.Orange,
    hoverEnding: Color.DarkOrange,
    textHoverColor: Color.White,
  },

  labelRadius: 20,
  padding: vec(10, 10),
});

// Listen to hover events
interactiveLabel.emitter.on("UILabelHovered", () => {
  console.log("Label hovered!");
});

interactiveLabel.emitter.on("UILabelUnhovered", () => {
  console.log("Label unhovered!");
});
```

### Dynamic Text Updates

```typescript
const scoreLabel = new UILabel({
  name: "score",
  width: 200,
  height: 40,
  pos: vec(20, 20),
  text: "Score: 0",
  textOptions: {
    font: new Font({ size: 16, family: "Arial" }),
    color: Color.Black,
  },
});

let score = 0;

// Update score and label
function updateScore(points: number) {
  score += points;
  scoreLabel.setText(`Score: ${score}`);
}

// Listen for text changes
scoreLabel.emitter.on("UILabelTextChanged", event => {
  console.log("Score updated to:", event.text);
});
```

### Multi-line Text with Custom Alignment

```typescript
const multilineLabel = new UILabel({
  name: "description",
  width: 400,
  height: 100,
  pos: vec(50, 300),
  text: "This is a long description\nthat spans multiple lines\nwith custom formatting.",
  textOptions: {
    font: new Font({ size: 14, family: "Arial" }),
    color: Color.DarkGray,
    // Note: canvas-txt handles alignment within the text bounds
  },
  padding: vec(15, 15),
});
```

### Status Indicator Labels

```typescript
class StatusIndicator {
  private label: UILabel;

  constructor() {
    this.label = new UILabel({
      name: "status",
      width: 150,
      height: 30,
      pos: vec(20, 400),
      text: "Ready",
      textOptions: {
        font: new Font({ size: 12, family: "Arial", bold: true }),
        color: Color.White,
      },
      colors: {
        backgroundStarting: Color.Green,
      },
      labelRadius: 15,
      padding: vec(8, 8),
    });
  }

  setStatus(status: "ready" | "busy" | "error") {
    switch (status) {
      case "ready":
        this.label.setText("Ready");
        this.label._config.colors = {
          backgroundStarting: Color.Green,
          textColor: Color.White,
        };
        break;
      case "busy":
        this.label.setText("Processing...");
        this.label._config.colors = {
          backgroundStarting: Color.Yellow,
          textColor: Color.Black,
        };
        break;
      case "error":
        this.label.setText("Error!");
        this.label._config.colors = {
          backgroundStarting: Color.Red,
          textColor: Color.White,
        };
        break;
    }
  }
}
```

## API Reference

### UILabel Properties

- `isHovered: boolean` - Current hover state (getter)
- `labelState: UILabelState` - Current visual state (getter)
- `eventEmitter: EventEmitter<UILabelEvents>` - Event system access

### UILabel Methods

- `getText(): string` - Get current text content
- `setText(text: string)` - Set new text content
- `setEnabled(enabled: boolean)` - Enable/disable label

### Configuration Options

See `UILabelConfig` and `UILabelColors` type definitions for complete API.

### Text Options

Labels support Excalibur `TextOptions` (except `text` property):

- `font: Font` - Font family, size, style
- `color: Color` - Text color
- `bold: boolean` - Bold weight
- `italic: boolean` - Italic style
