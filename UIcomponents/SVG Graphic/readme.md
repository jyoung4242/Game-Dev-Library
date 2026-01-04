# SVGGraphic for ExcaliburJS

A powerful ExcaliburJS `Graphic` class for loading, manipulating, and rendering SVG graphics with dynamic modification capabilities.

![SVG](./svg.gif)

## Features

- 🎨 **Dynamic SVG Manipulation** - Change colors, stroke width, and attributes on the fly
- 📏 **Flexible Sizing** - Render SVGs at any size, independent of original dimensions
- 🔄 **Reset Capability** - Restore original SVG after modifications
- ⚡ **Performance Optimized** - Dirty flag system ensures efficient GPU uploads
- 🎯 **CSS Selector Support** - Target specific elements using familiar selectors
- 🛠️ **TypeScript Support** - Full type safety and IntelliSense

## Installation

1. Copy `SVGGraphic.ts` into your ExcaliburJS project (e.g., `src/graphics/SVGGraphic.ts`)
2. Ensure you have ExcaliburJS installed:

```bash
npm install excalibur
```

## Basic Usage

### Loading and Displaying an SVG

```typescript
import { Actor, Color } from "excalibur";
import { SVGGraphic } from "./graphics/SVGGraphic";

// Load your SVG content (This bypasses Vite's handling of it)
//@ts-expect-error
import svgText from "./Assets/ex.svg?raw";

// Create the graphic
const graphic = new SVGGraphic(svgText);
await graphic.init();

// Use it with an Actor
const actor = new Actor({
  pos: vec(100, 100),
});
actor.graphics.use(graphic);
```

### Custom Sizing

```typescript
// Render at specific dimensions (scales the SVG)
const graphic = new SVGGraphic(svgContent, 64, 64);
await graphic.init();

// Or change size after initialization
await graphic.setSize(128, 128);
```

## Modification Methods

### Change Fill Color

```typescript
// Change fill color of all path elements (default selector)
await graphic.setFill(Color.Red);

// Change fill color of specific elements
await graphic.setFill(Color.Blue, "circle");
await graphic.setFill(Color.Green, ".my-class");
await graphic.setFill(Color.Yellow, "#my-id");
```

### Change Stroke Properties

```typescript
// Change stroke color only
await graphic.setStroke(Color.Black);

// Change stroke color and width
await graphic.setStroke(Color.Red, 5);

// Target specific elements
await graphic.setStroke(Color.Blue, 3, "line");
```

### Set Custom Attributes

```typescript
// Change stroke width
await graphic.setAttribute("path", "stroke-width", "10");

// Change opacity
await graphic.setAttribute("circle", "opacity", "0.5");

// Add stroke properties
await graphic.setAttribute(".my-line", "stroke-linecap", "round");

// Works with any CSS selector
await graphic.setAttribute("#special-element", "transform", "rotate(45)");
```

### Text Replacement

```typescript
// Simple string replacement
await graphic.replaceText("oldText", "newText");

// Regex replacement
await graphic.replaceText(/stroke-width="\d+"/g, 'stroke-width="5"');
```

### Custom Tweaks

For complex modifications, use the `tweak()` method with a callback:

```typescript
await graphic.tweak(svg => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, "image/svg+xml");

  // Make any DOM manipulations you need
  const paths = svgDoc.querySelectorAll("path");
  paths.forEach(path => {
    path.setAttribute("stroke-width", "5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
  });

  return new XMLSerializer().serializeToString(svgDoc);
});
```

### Reset to Original

```typescript
// Restore the original SVG content
await graphic.reset();
```

## Complete Example

```typescript
import { Engine, Actor, vec, Color, Loader } from "excalibur";
import { SVGGraphic } from "./graphics/SVGGraphic";

class Game extends Engine {
  async start() {
    // Load SVG
    const svgContent = await fetch("/assets/player.svg").then(r => r.text());

    // Create graphic at 64x64 pixels
    const playerGraphic = new SVGGraphic(svgContent, 64, 64);
    await playerGraphic.init();

    // Customize colors
    await playerGraphic.setFill(Color.fromHex("#FF6B6B"), "path.body");
    await playerGraphic.setFill(Color.fromHex("#4ECDC4"), "path.accent");
    await playerGraphic.setStroke(Color.Black, 2);

    // Create actor
    const player = new Actor({
      pos: vec(400, 300),
      width: 64,
      height: 64,
    });

    player.graphics.use(playerGraphic);
    this.add(player);

    await super.start();
  }
}

const game = new Game({
  width: 800,
  height: 600,
});

game.start();
```

## Dynamic Color Changes

Change colors in response to game events:

```typescript
// When player takes damage
player.events.on("damage", async () => {
  await playerGraphic.setFill(Color.Red);

  // Flash effect - reset after delay
  setTimeout(async () => {
    await playerGraphic.reset();
  }, 200);
});

// Power-up collected
player.events.on("powerup", async () => {
  await playerGraphic.setFill(Color.Green, "path.body");
  await playerGraphic.setAttribute("path", "stroke-width", "4");
});
```

## Loading SVGs

### From Public/Assets Folder

```typescript
const svgContent = await fetch("/assets/icon.svg").then(r => r.text());
const graphic = new SVGGraphic(svgContent);
await graphic.init();
```

### With Vite (using `?raw` import)

```typescript
import iconSvg from "./assets/icon.svg?raw";

const graphic = new SVGGraphic(iconSvg);
await graphic.init();
```

### Inline SVG

```typescript
const svgContent = `
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="blue"/>
  </svg>
`;

const graphic = new SVGGraphic(svgContent, 50, 50);
await graphic.init();
```

## Performance Notes

### Dirty Flag System

`SVGGraphic` uses an intelligent dirty flag system to optimize GPU uploads:

- Modifications (`setFill`, `setStroke`, etc.) mark the graphic as "dirty"
- The canvas is only re-uploaded to the GPU when dirty
- After upload, the dirty flag is cleared
- This means multiple draw calls per frame are efficient

```typescript
// First draw triggers upload (dirty flag set)
graphic.draw(ctx, 0, 0);

// Subsequent draws in same frame are cheap (no upload)
graphic.draw(ctx, 100, 100);

// Modification marks dirty again
await graphic.setFill(Color.Red);

// Next draw will upload again
graphic.draw(ctx, 0, 0);
```

## API Reference

### Constructor

```typescript
new SVGGraphic(svgContent: string, renderWidth?: number, renderHeight?: number)
```

### Methods

| Method                                                                   | Description                                    |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| `async init()`                                                           | Initialize the graphic (required before use)   |
| `async setSize(width: number, height: number)`                           | Change render dimensions                       |
| `async setFill(color: Color, selector?: string)`                         | Change fill color of elements                  |
| `async setStroke(color: Color, width?: number, selector?: string)`       | Change stroke color/width                      |
| `async setAttribute(selector: string, attribute: string, value: string)` | Set any SVG attribute                          |
| `async replaceText(search: string \| RegExp, replace: string)`           | Replace text in SVG                            |
| `async tweak(callback: (svg: string) => string)`                         | Custom SVG modifications                       |
| `async reset()`                                                          | Restore original SVG                           |
| `async rerender()`                                                       | Manually trigger re-render                     |
| `isLoaded(): boolean`                                                    | Check if graphic is initialized                |
| `isDirty(): boolean`                                                     | Check if graphic needs GPU upload              |
| `clone(): SVGGraphic`                                                    | Create a copy (must be initialized separately) |

## License

This code is provided as-is for use in your ExcaliburJS projects. Modify as needed!
