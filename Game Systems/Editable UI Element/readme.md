# EditableUI Module

A powerful Excalibur.js component for creating resizable and draggable UI elements with an intuitive design mode.

## Overview

The EditableUI module provides a `ScreenElement` that can be dynamically resized and repositioned during development. It features a
toggleable design mode that allows developers to visually adjust UI layouts and log the final dimensions for production use.

## Features

- **Design Mode**: Toggle between editable and locked states
- **Drag and Drop**: Reposition elements by dragging
- **8-Point Resize**: Resize from corners and edges using intuitive resize handles
- **Visual Feedback**: Semi-transparent overlay shows element name, position, and dimensions
- **Console Logging**: Automatically log final dimensions when exiting design mode
- **Hover States**: Visual indicators for interactive elements
- **Confirmation Dialog**: Right-click confirmation before exiting design mode

## Installation

This module depends on:

- `excalibur` - The Excalibur.js game engine
- `canvas-txt` - For text rendering on canvas

```bash
npm install excalibur canvas-txt
```

## Basic Usage

```typescript
import { EditableUI } from "./path/to/module";
import { Engine } from "excalibur";

const game = new Engine({
  /* config */
});

// Create an editable UI element in design mode
const myElement = new EditableUI({
  name: "MyButton",
  width: 200,
  height: 100,
  x: 100,
  y: 100,
  designMode: true,
  consoleLog: true,
});

game.add(myElement);
```

## Configuration Options

### EditableUIArgs

| Property           | Type                            | Default        | Description                                         |
| ------------------ | ------------------------------- | -------------- | --------------------------------------------------- |
| `designMode`       | `boolean`                       | `false`        | Enable/disable design mode                          |
| `consoleLog`       | `boolean`                       | `false`        | Log dimensions to console when exiting design mode  |
| `fallbackCallback` | `(element: EditableUI) => void` | `undefined`    | Callback function executed when exiting design mode |
| `name`             | `string`                        | `'EditableUI'` | Element identifier displayed in design mode         |
| `width`            | `number`                        | `100`          | Initial width                                       |
| `height`           | `number`                        | `100`          | Initial height                                      |
| `x`                | `number`                        | `0`            | Initial x position                                  |
| `y`                | `number`                        | `0`            | Initial y position                                  |

## Design Mode Controls

### Mouse Interactions

- **Left Click + Drag**: Move the element
- **Right Click**: Open confirmation dialog to exit design mode
- **Resize Handles**: Eight white boxes appear around the element for resizing
  - Corner handles: Resize both width and height
  - Edge handles: Resize single dimension

### Visual States

- **Default**: Semi-transparent gray background with black border
- **Hover**: Border changes to red
- **Dragging**: Cursor changes to "grabbing"
- **Resize Hover**: Cursor changes to appropriate resize direction

## Example with Callback

```typescript
const editableButton = new EditableUI({
  name: "StartButton",
  width: 150,
  height: 50,
  x: 400,
  y: 300,
  designMode: true,
  consoleLog: true,
  fallbackCallback: element => {
    // Replace design graphic with actual button graphic
    const buttonGraphic = new MyCustomGraphic();
    element.graphics.use(buttonGraphic);

    console.log(`Final button position: ${element.pos.x}, ${element.pos.y}`);
  },
});
```

## Workflow

1. **Development Phase**: Create elements with `designMode: true`
2. **Adjust Layout**: Drag and resize elements to desired positions
3. **Finalize**: Right-click element and confirm to exit design mode
4. **Production**: Use logged coordinates to create fixed UI elements

## Advanced Usage

### Programmatically Toggle Design Mode

```typescript
const element = new EditableUI({
  name: "MyElement",
  width: 200,
  height: 100,
  designMode: false,
});

// Later in your code
element.designMode = true; // Enable design mode
element.designMode = false; // Disable design mode
```

### Custom Graphics After Design

```typescript
const element = new EditableUI({
  name: "HealthBar",
  designMode: true,
  fallbackCallback: el => {
    // Create your custom graphic based on final dimensions
    const width = el.graphics.current.width;
    const height = el.graphics.current.height;

    const healthBarGraphic = new CustomHealthBar(width, height);
    el.graphics.use(healthBarGraphic);
  },
});
```

## Components

### EditableUI

Main class extending `ScreenElement` with drag and resize capabilities.

### Resizable

Component that manages the eight resize handles and their behavior.

### ResizeBox

Individual resize handle actors positioned around the parent element.

### TextCanvasGraphic

Custom graphic that displays element information during design mode.

### ConfirmPopup

Modal dialog for confirming design mode exit.

## API Reference

### EditableUI Methods

- `isMouseHovering()`: Returns whether the mouse is currently over the element
- `designMode` (getter/setter): Get or set the current design mode state

### TextCanvasGraphic Methods

- `updateData(position: Vector, size: Vector)`: Update element dimensions
- `getSizePos()`: Get current position and size
- `setHover(hoverstate: boolean)`: Set hover visual state

## Notes

- Elements must be added to a scene with an engine for design mode to function
- Console logging only occurs if `consoleLog` option is enabled
- The module automatically manages cursor styles during interactions
- Resize handles are automatically repositioned when element dimensions change

## License

This module is provided as-is for use with Excalibur.js projects.
