# Wave Function Collapse (WFC)

A TypeScript implementation of the Wave Function Collapse algorithm for procedural tilemap generation with automatic backtracking and
constraint propagation.

## Overview

Wave Function Collapse is a constraint-solving algorithm that generates tile-based patterns by propagating adjacency rules. This
implementation features:

- ✨ Automatic backtracking on contradictions
- 🎲 Seeded random generation for reproducibility
- 🔄 Step-by-step or automatic generation modes
- 📊 Real-time event dispatching for visualization
- 🎯 Support for manual tile constraints
- 💪 Full TypeScript type safety

## Installation

```typescript
import { WFC, WfcConfig, SpriteSheetMap } from "./wfc";
```

## Quick Start

```typescript
// Define adjacency rules
const rules: SpriteSheetMap = {
  0: { weight: 1, up: [0, 1], down: [0, 2], left: [0, 3], right: [0, 4] },
  1: { weight: 2, up: [1], down: [0], left: [1, 3], right: [1, 4] },
  2: { weight: 1, up: [0], down: [2], left: [2, 3], right: [2, 4] },
  // ... more rules
};

// Configure WFC
const config: WfcConfig = {
  name: "myMap",
  tilemapDims: { width: 20, height: 20 },
  spriteSheetDims: { width: 8, height: 8 },
  rules: rules,
  seed: 12345,
  auto: true,
  collapseDelay: 50, // ms between steps (for visualization)
};

// Create and run
const wfc = new WFC(config);
wfc.initialize();
await wfc.generate();

// Access results
const tiles = wfc.getTiles();
```

## Configuration Options

### WfcConfig

| Property          | Type              | Required | Default      | Description                           |
| ----------------- | ----------------- | -------- | ------------ | ------------------------------------- |
| `name`            | `string`          | ✅       | -            | Identifier for this WFC instance      |
| `tilemapDims`     | `{width, height}` | ✅       | -            | Dimensions of output tilemap          |
| `spriteSheetDims` | `{width, height}` | ✅       | -            | Dimensions of source sprite sheet     |
| `rules`           | `SpriteSheetMap`  | ❌       | `{}`         | Tile adjacency rules                  |
| `seed`            | `number`          | ❌       | `Date.now()` | RNG seed for reproducibility          |
| `auto`            | `boolean`         | ❌       | `false`      | Auto-collapse all tiles               |
| `startingIndex`   | `number`          | ❌       | `-1`         | Fixed starting tile (random if -1)    |
| `collapseDelay`   | `number`          | ❌       | `0`          | Delay in ms between steps             |
| `maxBacktracks`   | `number`          | ❌       | `100`        | Max backtrack attempts before failure |

## Rule Definition

Rules define which tiles can be adjacent to each other:

```typescript
type Rule = {
  weight: number; // Probability weight (higher = more common)
  up: number[]; // Allowed sprite indices above this tile
  down: number[]; // Allowed sprite indices below this tile
  left: number[]; // Allowed sprite indices left of this tile
  right: number[]; // Allowed sprite indices right of this tile
};

type SpriteSheetMap = Record<number, Rule>;
```

### Example Rules

```typescript
const rules: SpriteSheetMap = {
  // Grass tile (sprite 0)
  0: {
    weight: 10,
    up: [0, 1], // Can have grass or dirt above
    down: [0, 1],
    left: [0, 1],
    right: [0, 1],
  },
  // Water tile (sprite 1)
  1: {
    weight: 5,
    up: [1], // Water only connects to water
    down: [1],
    left: [1],
    right: [1],
  },
  // Shore tile (sprite 2)
  2: {
    weight: 3,
    up: [0, 2], // Shore connects grass and itself
    down: [1, 2], // Shore connects water and itself
    left: [0, 1, 2],
    right: [0, 1, 2],
  },
};
```

## API Reference

### Methods

#### `initialize()`

Initialize the tilemap with uncollapsed tiles. Must be called before `generate()`.

```typescript
wfc.initialize();
```

#### `generate()`

Generate the complete tilemap using WFC algorithm.

```typescript
await wfc.generate();
```

#### `step()`

Manually advance generation by one tile (when `auto: false`).

```typescript
const isDone = await wfc.step();
if (isDone) {
  console.log("Generation complete!");
}
```

#### `loadRules(rules)`

Load or update adjacency rules.

```typescript
wfc.loadRules(newRules);
```

#### `setWeight(spriteIndex, weight)`

Adjust probability weight for a specific sprite.

```typescript
wfc.setWeight(0, 20); // Make sprite 0 twice as common
```

#### `setTile(index, spriteIndex)`

Manually set a tile to a specific sprite (useful for constraints).

```typescript
wfc.setTile(0, 5); // Force top-left tile to sprite 5
```

#### `getTile(index)`

Get read-only copy of a specific tile's data.

```typescript
const tile = wfc.getTile(42);
console.log(tile?.spriteIndex, tile?.entropy);
```

#### `getTiles()`

Get read-only copy of all tiles.

```typescript
const allTiles = wfc.getTiles();
```

#### `getSpriteCoords(index)`

Get sprite sheet coordinates for a tile.

```typescript
const { x, y } = wfc.getSpriteCoords(10);
// x, y are positions in the sprite sheet
```

#### `getState()`

Get current generation state.

```typescript
const state = wfc.getState();
// Returns: 'unknown' | 'ready' | 'collapsing' | 'collapsed'
```

#### `setDims(dims)`

Update tilemap dimensions (requires re-initialization).

```typescript
wfc.setDims({ width: 30, height: 30 });
wfc.initialize();
```

#### `reset()`

Reset WFC to uninitialized state.

```typescript
wfc.reset();
```

## Events

Listen for generation progress events:

### WFC_TILE_COLLAPSED

Fired when a single tile is collapsed.

```typescript
import { WFC_TILE_COLLAPSED } from "./wfc";

window.addEventListener(WFC_TILE_COLLAPSED, (event: CustomEvent) => {
  const { name, tile } = event.detail;
  console.log(`Collapsed tile ${tile.tileIndex} to sprite ${tile.spriteIndex}`);
});
```

### WFC_COLLAPSE_COMPLETE

Fired when generation is complete.

```typescript
import { WFC_COLLAPSE_COMPLETE } from "./wfc";

window.addEventListener(WFC_COLLAPSE_COMPLETE, (event: CustomEvent) => {
  const { name, tiles } = event.detail;
  console.log(`Generation complete! ${tiles.length} tiles generated`);
});
```

## Usage Patterns

### Automatic Generation

```typescript
const wfc = new WFC({
  name: "autoMap",
  tilemapDims: { width: 10, height: 10 },
  spriteSheetDims: { width: 4, height: 4 },
  rules: myRules,
  auto: true,
});

wfc.initialize();
await wfc.generate();

// Use the result
wfc.getTiles().forEach((tile, index) => {
  const { x, y } = wfc.getSpriteCoords(index);
  drawSprite(x, y, tile.spriteIndex);
});
```

### Step-by-Step Generation with Visualization

```typescript
const wfc = new WFC({
  name: "stepMap",
  tilemapDims: { width: 15, height: 15 },
  spriteSheetDims: { width: 4, height: 4 },
  rules: myRules,
  auto: false,
});

// Listen for updates
window.addEventListener(WFC_TILE_COLLAPSED, (event: CustomEvent) => {
  const { tile } = event.detail;
  updateVisualization(tile);
});

wfc.initialize();
await wfc.generate(); // Starts generation

// Step through manually
while (wfc.getState() === "collapsing") {
  await wfc.step();
  await sleep(100); // Delay for visualization
}
```

### With Constraints

```typescript
const wfc = new WFC(config);
wfc.initialize();

// Force specific tiles
wfc.setTile(0, 5); // Top-left corner
wfc.setTile(99, 7); // Bottom-right corner
wfc.setTile(50, 3); // Center

await wfc.generate();
```

### Reproducible Generation

```typescript
// Same seed produces same result
const seed = 42;

const wfc1 = new WFC({ ...config, seed });
wfc1.initialize();
await wfc1.generate();

const wfc2 = new WFC({ ...config, seed });
wfc2.initialize();
await wfc2.generate();

// wfc1 and wfc2 will produce identical tilemaps
```

## How It Works

1. **Initialization**: All tiles start with infinite entropy (all possibilities available)

2. **First Collapse**: A random tile is selected and collapsed to a specific sprite

3. **Propagation**: Neighboring tiles have their entropy updated based on adjacency rules

4. **Iteration**: The tile with lowest entropy is selected and collapsed

5. **Backtracking**: If a contradiction occurs (no valid tiles available), the algorithm backtracks to try a different choice

6. **Completion**: Process continues until all tiles are collapsed

## Error Handling

The algorithm handles contradictions through automatic backtracking:

```typescript
try {
  await wfc.generate();
} catch (error) {
  if (error.message.includes("Max backtrack limit")) {
    console.error("Rules are too restrictive - cannot generate valid tilemap");
  } else if (error.message.includes("No steps to backtrack")) {
    console.error("Contradiction occurred with no way to backtrack");
  }
}
```

## Performance Tips

- **Use appropriate weights**: Higher weights for common tiles reduce backtracking
- **Avoid overly restrictive rules**: Too few valid adjacencies increase contradictions
- **Start with larger tilemaps**: Small maps are harder to generate without contradictions
- **Increase maxBacktracks**: For complex rule sets, allow more backtracking attempts
- **Disable auto mode for large maps**: Step through manually to avoid blocking

## Common Pitfalls

❌ **Forgetting to initialize**

```typescript
const wfc = new WFC(config);
await wfc.generate(); // Error: Buffer not ready
```

✅ **Correct approach**

```typescript
const wfc = new WFC(config);
wfc.initialize();
await wfc.generate();
```

❌ **Rules with no valid paths**

```typescript
const rules = {
  0: { weight: 1, up: [1], down: [1], left: [1], right: [1] },
  1: { weight: 1, up: [0], down: [0], left: [0], right: [0] },
};
// This creates a checkerboard that can't tile odd-sized maps!
```

✅ **Self-referential rules**

```typescript
const rules = {
  0: { weight: 1, up: [0, 1], down: [0, 1], left: [0, 1], right: [0, 1] },
  1: { weight: 1, up: [0, 1], down: [0, 1], left: [0, 1], right: [0, 1] },
};
```

## License

MIT

## Credits

Based on the Wave Function Collapse algorithm by Maxim Gumin.
