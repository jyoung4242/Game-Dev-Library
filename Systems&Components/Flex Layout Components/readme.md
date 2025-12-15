# Excalibur UI Layout System

A flexible and intuitive UI layout system for ExcaliburJS games that provides powerful positioning and alignment strategies similar to
CSS flexbox.

## Overview

This UI layout system extends ExcaliburJS's capabilities with a flexible container-based approach for organizing UI elements. It offers
various positioning strategies to help you create responsive game interfaces with minimal manual positioning.

## Features

- Container-based Layout: Organize UI elements in containers with customizable properties
- Flexible Positioning: Multiple positioning strategies (similar to CSS flexbox)
- Dynamic Alignment: Control how elements align within their containers
- Responsive Design: Layout updates automatically on window resize
- Nested Containers: Create complex layouts through container nesting
- Customizable Spacing: Set padding and gaps between elements

## Installation

> This **_HAS NOT_** BEEN IMPLEMENTED YET

`bash`

` npm install excalibur-ui-layout`

## Basic Usage

```ts
import { Engine } from "excalibur";
import { UILayout, UIContainer } from "excalibur-ui-layout";

// Create your Excalibur engine
const engine = new Engine({ width: 800, height: 600 });

// Create the UI layout system
const uiLayout = new UILayout(engine);

// Create a container for UI elements
const mainContainer = new UIContainer({
  name: "mainContainer",
  width: 300,
  height: 400,
  padding: 10,
  gap: 5,
  layoutDirection: "vertical",
  positionContentStrategy: "center",
  alignmentContentStrategy: "center",
});

// Add the container to the root container
uiLayout.root.addChildContainer(mainContainer);

// Add your UI elements to the container // (buttons, panels, text, etc.)

// Remember to update the layout in your game loop
engine.on("postupdate", () => {
  uiLayout.update();
});

// Start the engine
engine.start();
```

## Positioning Strategies

The module supports multiple positioning strategies for organizing UI elements:

- `fixed`: Elements remain at their manually set positions
- `anchor-start`: Elements are positioned from the start of the container (default)
- `anchor-end`: Elements are positioned from the end of the container
- `center`: Elements are centered within the container
- `space-between`: Elements are evenly distributed with equal space between them
- `space-around`: Elements are evenly distributed with equal
- `space around` them space-evenly: Elements are evenly distributed with equal space between and around them

## Alignment Strategies

Alignment strategies control how elements are positioned on the cross-axis:

- `anchor-start`: Elements are aligned to the start of the container (default)
- `center`: Elements are centered on the cross-axis
- `anchor-end`:Elements are aligned to the end of the container

## Creating a Container

```ts
const container = new UIContainer({
  name: "myContainer",
  width: 300,
  height: 200,
  padding: 10, // uniform padding
  gap: 5, // uniform gap
  layoutDirection: "horizontal",
  positionContentStrategy: "space-between",
  alignmentContentStrategy: "center",
});

// Or with detailed padding and gap
const detailedContainer = new UIContainer({
  name: "detailedContainer",
  width: 300,
  height: 200,
  padding: { leftPadding: 10, rightPadding: 5, topPadding: 20, bottomPadding: 15 },
  gap: { horizontalGap: 10, verticalGap: 5 },
  layoutDirection: "vertical",
  positionContentStrategy: "center",
  alignmentContentStrategy: "anchor-end",
});
```

## Nested Containers

You can create complex layouts using nested containers:

```ts
// Parent container
const parentContainer = new UIContainer({
  name: "parent",
  width: 400,
  height: 300,
  padding: 10,
  layoutDirection: "vertical",
  positionContentStrategy: "center",
});

// Add parent to root
uiLayout.root.addChildContainer(parentContainer);

// Child container
const childContainer = new UIContainer({
  name: "child",
  width: 200,
  height: 100,
  padding: 5,
  layoutDirection: "horizontal",
  positionContentStrategy: "space-between",
});

// Add child to parent
parentContainer.addChildContainer(childContainer);
```

## Example: Creating a Game HUD

```ts
import { Engine, Actor, Color, Text, Font, vec } from "excalibur";
import { UILayout, UIContainer } from "excalibur-ui-layout";

// Create engine
const engine = new Engine({ width: 800, height: 600 });

// Create UI layout
const uiLayout = new UILayout(engine);

// Create top HUD bar
const topHUD = new UIContainer({
  name: "topHUD",
  width: engine.screen.drawWidth,
  height: 50,
  padding: 10,
  gap: 20,
  layoutDirection: "horizontal",
  positionContentStrategy: "space-between",
  alignmentContentStrategy: "center",
});

// Add HUD to root
uiLayout.root.addChildContainer(topHUD);

// Create score display
const scoreText = new Text({ text: "Score: 0", font: new Font({ size: 24, color: Color.White }) });
const scoreContainer = new UIContainer({ name: "score", width: 150, height: 40 });
scoreContainer.graphics.add(scoreText);

// Create health display const healthText = new Text({ text: "Health: 100", font: new Font({ size: 24, color: Color.White }) }); const
healthContainer = new UIContainer({ name: "health", width: 150, height: 40 });
healthContainer.graphics.add(healthText);

// Add elements to HUD
topHUD.addChildContainer(scoreContainer);
topHUD.addChildContainer(healthContainer);

// Update layout on each frame
engine.on("postupdate", () => {
  uiLayout.update();
});

// Start the engine
engine.start();
```

## Best Practices

1. Plan your layout hierarchy before implementation
2. Set appropriate container dimensions to ensure proper child positioning
3. Update the layout in your game loop to handle dynamic changes
4. Use the right positioning strategy for your specific needs
5. Leverage nesting for complex layouts instead of trying to position everything in one container

## API Reference

### UILayout

The main class that manages the layout system.

#### Properties

- `root`: The root container for all UI elements
- `layoutDirtyFlag`: Indicates if the layout needs updating

#### Methods

- `update()`: Updates the layout if necessary

### UIContainer

Represents a container for UI elements.

#### Constructor Options

- `layoutDirection`: "horizontal" | "vertical" (default: "horizontal")
- `positionContentStrategy`: "fixed" | "anchor-start" | "anchor-end" |"center" | "space-between" | "space-around" | "space-evenly"
  (default: "fixed") - `alignmentContentStrategy`: "center" | "anchor-start" | "anchor-end" (default: "anchor-start")
- `padding`: number | { leftPadding, rightPadding, topPadding, bottomPadding }
- `gap`: number | {verticalGap, horizontalGap }

#### Methods

- `addChildContainer(child)`: Adds a child container
- `updateLayout()`: Updates the layout of the container and its children
- `getChildContainer(index)`: Gets a child container by index License MIT

Contributing Contributions are welcome! Please feel free to submit a Pull Request.
