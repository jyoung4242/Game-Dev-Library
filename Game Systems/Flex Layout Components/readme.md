# Excalibur UI Layout Module

A flexible and powerful UI layout system for [Excalibur.js](https://excaliburjs.com/) that provides CSS Flexbox-like positioning
strategies for game UI elements.

## Features

- **Multiple Positioning Strategies**: `fixed`, `anchor-start`, `anchor-end`, `center`, `space-between`, `space-around`, `space-evenly`
- **Flexible Layout Directions**: Horizontal and vertical layouts
- **Alignment Control**: Start, center, and end alignment for cross-axis positioning
- **Padding & Gap Support**: Configure spacing between elements and container edges
- **Automatic Layout Updates**: Responds to window resize events
- **Nested Containers**: Build complex UI hierarchies with parent-child relationships

> [!WARNING]  
> THIS MODULE DOES NOT MANAGE COMPONENT SIZE, JUST POSITION

## Installation

Copy the module file into your Excalibur.js project and import it:

```typescript
import { UILayout, UIContainer } from "./path-to-module";
```

## Quick Start

```typescript
import { Engine, Scene } from 'excalibur';
import { UILayout } from './ui-layout';

const game = new Engine({...});
const scene = new Scene();

// Create the UI layout system
const uiLayout = new UILayout(scene);

// Add containers to the root
const header = new UIContainer({
  name: 'header',
  width: 800,
  height: 60,
  layoutDirection: 'horizontal',
  positionContentStrategy: 'center',
  alignmentContentStrategy: 'center',
  padding: 10,
  gap: 15
});

uiLayout.root.addChildContainer(header);

// Update layout in your game loop
scene.on('preupdate', () => {
  uiLayout.update();
});
```

## Core Concepts

### UILayout

The main layout manager that handles the root container and layout updates.

```typescript
const uiLayout = new UILayout(scene);
const root = uiLayout.root; // Access the root container
```

### UIContainer

Containers hold and position child UI elements using various strategies.

```typescript
const container = new UIContainer({
  name: "my-container",
  width: 400,
  height: 300,
  layoutDirection: "horizontal", // or 'vertical'
  positionContentStrategy: "center", // see strategies below
  alignmentContentStrategy: "center", // cross-axis alignment
  padding: 20, // uniform padding
  gap: 10, // uniform gap
});
```

## Configuration Options

### Layout Direction

- `horizontal`: Children are positioned left to right
- `vertical`: Children are positioned top to bottom

### Position Strategies (Main Axis)

- **`fixed`**: Children use their manually set positions (no automatic positioning)
- **`anchor-start`**: Children start from the beginning (left/top)
- **`anchor-end`**: Children start from the end (right/bottom)
- **`center`**: Children are centered as a group
- **`space-between`**: Equal space between children, none at edges
- **`space-around`**: Equal space around each child (half-size at edges)
- **`space-evenly`**: Equal space between children and at edges

### Alignment Strategies (Cross Axis)

- **`anchor-start`**: Align to start (top for horizontal, left for vertical)
- **`center`**: Center alignment
- **`anchor-end`**: Align to end (bottom for horizontal, right for vertical)

### Padding

Configure padding as a single number or per-side:

```typescript
// Uniform padding
padding: 20

// Individual sides
padding: {
  leftPadding: 10,
  rightPadding: 10,
  topPadding: 5,
  bottomPadding: 5
}
```

### Gap

Configure gap as a single number or per-direction:

```typescript
// Uniform gap
gap: 15

// Individual directions
gap: {
  horizontalGap: 20,
  verticalGap: 10
}
```

## Examples

### Centered Header with Buttons

```typescript
const header = new UIContainer({
  width: 800,
  height: 60,
  layoutDirection: "horizontal",
  positionContentStrategy: "center",
  alignmentContentStrategy: "center",
  gap: 10,
});

// Add button containers
const button1 = new UIContainer({ width: 100, height: 40 });
const button2 = new UIContainer({ width: 100, height: 40 });

header.addChildContainer(button1);
header.addChildContainer(button2);
uiLayout.root.addChildContainer(header);
```

### Space-Between Navigation

```typescript
const nav = new UIContainer({
  width: 600,
  height: 50,
  layoutDirection: "horizontal",
  positionContentStrategy: "space-between",
  alignmentContentStrategy: "center",
  padding: 10,
});
```

### Vertical Sidebar

```typescript
const sidebar = new UIContainer({
  width: 200,
  height: 600,
  layoutDirection: "vertical",
  positionContentStrategy: "anchor-start",
  alignmentContentStrategy: "anchor-start",
  padding: 15,
  gap: 20,
});
```

## API Reference

### UILayout Methods

- `constructor(scene: Scene)` - Initialize the layout system
- `update()` - Update layout if dirty flag is set
- `root` - Get the root container

### UIContainer Methods

- `addChildContainer(child: UIContainer)` - Add a child container
- `getChildContainer(index: number)` - Get child by index
- `getDimension()` - Get container dimensions as Vector
- `updateLayout()` - Recalculate and apply layout

### Events

The layout system automatically responds to:

- Window resize events
- Manual dirty flag triggers via `uiEvents.emit('setDirty', new UILayoutDirtyFlag())`

## Advanced Usage

### Nested Layouts

```typescript
const mainContainer = new UIContainer({
  layoutDirection: "vertical",
  positionContentStrategy: "space-between",
});

const topRow = new UIContainer({
  layoutDirection: "horizontal",
  positionContentStrategy: "space-around",
});

mainContainer.addChildContainer(topRow);
uiLayout.root.addChildContainer(mainContainer);
```

### Manual Layout Updates

```typescript
// Trigger a layout update manually
uiLayout.layoutDirtyFlag = true;
uiLayout.update();
```

## License

This module is designed for use with Excalibur.js. Please refer to your project's license.

## Contributing

This is a layout system module for Excalibur.js game engine. Contributions and improvements are welcome!
