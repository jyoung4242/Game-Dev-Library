# MiniMap Component

A flexible minimap/radar display system for Excalibur-based games that renders a scaled-down view of your game world with customizable
player indicator and viewport fence indicators.

![ss](./ss.gif)

## Features

- **Dynamic Content Display**: Renders any game content (Actor, ScreenElement, or TileMap) as the map background
- **Player Tracking**: Displays a circular indicator for the tracked actor's position on the minimap
- **Viewport Indicator**: Optional fence/viewport rectangle showing the player's visible area
- **Fully Customizable**: Colors, sizes, opacity, borders - everything can be configured
- **Canvas-Based Rendering**: Uses HTML5 Canvas for efficient offscreen rendering

## Usage

### Basic Setup

```typescript
import { MiniMap } from "./minimap";
import { Actor, Color, Vector } from "excalibur";

// Create a minimap instance
const minimap = new MiniMap({
  mapOptions: {
    pos: new Vector(100, 100), // Position on screen
    dims: new Vector(200, 200), // Minimap dimensions
    opacity: 0.8,
    visible: true,
    content: yourGameWorldActor, // Actor/ScreenElement to display
    borderColor: Color.White,
    borderSize: 2,
    backgroundColor: Color.Black,
  },
  targetOptions: {
    actor: playerActor, // Actor to track
    actorColor: Color.Red,
    actorRadius: 5,
    drawFence: true, // Show viewport indicator
    fenceDims: new Vector(800, 600), // Player's viewport dimensions
    fenceColor: Color.Yellow,
  },
});

// Add to game scene
scene.add(minimap);
```

## API

### MiniMap Class

Extends `ScreenElement` and represents the minimap display element.

#### Constructor

```typescript
constructor(options: MiniMapOptions)
```

#### Methods

- `show()` - Makes the minimap visible
- `hide()` - Hides the minimap

### MiniMapGraphic Class

Internal graphic renderer for the minimap. Handles all canvas drawing logic.

### MiniMapOptions Interface

Configuration object for minimap setup:

```typescript
interface MiniMapOptions {
  mapOptions: {
    pos: Vector; // Screen position
    dims: Vector; // Width and height
    opacity: number; // 0-1 opacity value
    visible: boolean; // Initial visibility
    content: MapType; // Actor | ScreenElement | TileMap
    borderColor: Color;
    borderSize: number;
    backgroundColor: Color;
  };
  targetOptions: {
    actor: Actor; // Actor to track
    actorColor: Color; // Indicator color
    actorRadius: number; // Indicator circle radius
    drawFence: boolean; // Show viewport rectangle
    fenceDims: Vector; // Viewport dimensions
    fenceColor: Color; // Viewport rectangle color
  };
}
```

## Type Definitions

### MapType

```typescript
type MapType = TileMap | Actor | ScreenElement;
```

Defines what content types the minimap can display.

## Implementation Details

- **Canvas Scaling**: Automatically calculates scale factors based on minimap dimensions and content dimensions
- **Sprite Support**: When content is a Sprite-based Actor/ScreenElement, displays the sprite texture on the minimap background
- **Position Tracking**: Calculates normalized positions (0-1) of the tracked actor within the map and scales to canvas coordinates
- **Offscreen Rendering**: Uses an HTML5 Canvas element for efficient rendering before drawing to the Excalibur graphics context

## Known Limitations

- TileMap rendering is not yet implemented (TODO in code)
- Only Sprite graphics are supported for content rendering; other graphic types are not currently handled

## Dependencies

- [Excalibur](https://excaliburjs.com/) game engine
- Excalibur types: `Actor`, `Color`, `ExcaliburGraphicsContext`, `Graphic`, `ScreenElement`, `Sprite`, `TileMap`, `Vector`

## Notes

- The minimap updates every frame based on the tracked actor's current position
- Canvas dimensions are created once during initialization; resizing requires creating a new MiniMap instance
- The fence indicator is useful for showing the player's camera/viewport bounds on the minimap
