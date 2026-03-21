# Poisson Disk Sampling

Poisson Disk Sampling is a procedural generation technique that creates evenly distributed point distributions while maintaining a
minimum distance between points. This implementation uses the Bridson algorithm with grid-based spatial acceleration for efficient
sampling.

## Overview

Poisson Disk Sampling is ideal for generating natural-looking distributions with spacing constraints. Unlike random distributions that
can create clusters and gaps, Poisson Disk creates uniform spacing—useful for placing objects in games while avoiding overlaps.

### Use Cases

- **Tree/vegetation placement** - Evenly distribute foliage across terrain
- **Enemy spawning** - Place enemies with guaranteed spacing
- **Rock/obstacle placement** - Create natural-looking obstacle fields
- **Point cloud generation** - Generate cloud-like structures with spacing
- **Resource placement** - Distribute resources (ore, treasure) throughout a level
- **Particle effects** - Evenly spaced sparkles or effects
- **Noise generation** - Use as basis for other procedural algorithms

## Usage

### Basic Example

```typescript
import { generatePoissonPoints } from "./Poisson";

// Generate points with default settings
const points = generatePoissonPoints({
  width: 800,
  height: 600,
  minDistance: 50,
});

// Draw or use the points
points.forEach(([x, y]) => {
  // Place object at [x, y]
});
```

### Advanced Configuration

```typescript
const points = generatePoissonPoints({
  width: 1024,
  height: 768,
  minDistance: 40,
  maxTries: 50, // More attempts = denser packing
  seedCount: 4, // Number of seeding points to start with
  randomSeed: true, // Random vs grid-based seed placement
});
```

## Parameters

| Parameter     | Type    | Default | Description                                                                                                         |
| ------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `width`       | number  | -       | Width of the sampling area in pixels                                                                                |
| `height`      | number  | -       | Height of the sampling area in pixels                                                                               |
| `minDistance` | number  | -       | Minimum distance between points (enforced constraint)                                                               |
| `maxTries`    | number  | 30      | Number of attempts to place a point before rejecting it. Higher values = denser packing, but slower                 |
| `seedCount`   | number  | 1       | Number of initial seed points. More seeds = faster initial coverage                                                 |
| `randomSeed`  | boolean | true    | If `true`, seeds placed randomly for organic results. If `false`, seeds placed in grid pattern for uniform coverage |

## Algorithm Details

### How It Works

1. **Initialization** - Creates a grid with cell size of `minDistance / √2` for efficient spatial queries
2. **Seeding** - Places initial seed points (either randomly or in a grid pattern)
3. **Sampling Loop** - For each active point:
   - Generates up to `maxTries` candidate points at random angles and distances
   - Checks if candidate satisfies minimum distance constraint
   - Accepts valid candidates and adds them to the active queue
   - Removes from active queue after rejecting all candidates

### Performance Characteristics

- **Time Complexity**: O(n) where n is the number of generated points
- **Space Complexity**: O(n + grid_cells)
- **Grid acceleration** reduces neighbor checks from O(n) to O(1) amortized

### Parameters That Affect Output

```typescript
// Sparse, barely connected points
{ minDistance: 200 }

// Dense, tightly packed points
{ minDistance: 20, maxTries: 50 }

// Random seed placement (organic, irregular)
{ randomSeed: true, seedCount: 1 }

// Grid seed placement (uniform, regular)
{ randomSeed: false, seedCount: 9 }
```

## Examples

### Tree Forest

```typescript
// Spread trees naturally across terrain
const trees = generatePoissonPoints({
  width: 2000,
  height: 2000,
  minDistance: 100,
  maxTries: 30,
  seedCount: 4,
  randomSeed: true,
});

trees.forEach(([x, y]) => spawnTree(x, y));
```

### Enemy Spawn Locations

```typescript
// Distribute enemies while maintaining safe distance
const spawnLocations = generatePoissonPoints({
  width: gameWidth,
  height: gameHeight,
  minDistance: 150, // Enemies at least 150 pixels apart
  maxTries: 25,
});

spawnLocations.forEach(([x, y]) => spawnEnemy(x, y));
```

### Varied Density Regions

```typescript
// Dense sampling in one area, sparse in another
const dense = generatePoissonPoints({
  width: 500,
  height: 500,
  minDistance: 20, // Tight spacing
});

const sparse = generatePoissonPoints({
  width: 500,
  height: 500,
  minDistance: 150, // Wide spacing
});
```

## Tips & Tricks

### Controlling Density

- **Decrease** `minDistance` for denser point clouds
- **Increase** `maxTries` for more relaxed packing
- **Decrease** `maxTries` for faster generation with gaps

### Controlling Coverage

- **Increase** `seedCount` for faster initial coverage
- **Use** `randomSeed: false` for uniform, grid-like coverage
- **Use** `randomSeed: true` for more organic, asymmetrical patterns

### Performance Optimization

- Start with `maxTries: 15-20` and increase if you need denser packing
- Use smaller `minDistance` values carefully—very small values dramatically increase computation time
- For very large areas, consider generating points in chunks and combining results

## Return Value

```typescript
// Returns array of [x, y] coordinate pairs
[
  [125.5, 89.3],
  [250.2, 156.7],
  [89.5, 234.1],
  // ... more points
];
```

## Performance Notes

- Generation is deterministic given the same parameters (except when using `randomSeed: true`)
- For a 1024×768 area with `minDistance: 50`, expect ~60-100 points
- For a 1024×768 area with `minDistance: 20`, expect ~400-500 points
- Typical generation time: milliseconds to tens of milliseconds depending on density

## Common Patterns

### Weighted Density (More points in center)

```typescript
// Generate in circular area for radial distribution
const centerPoints = generatePoissonPoints({
  width: diameter,
  height: diameter,
  minDistance: 30,
}).filter(([x, y]) => {
  // Keep only points within circle
  const dist = Math.hypot(x - diameter / 2, y - diameter / 2);
  return dist < diameter / 2;
});
```

### Blend Multiple Samplings

```typescript
// Combine sparse and dense areas
const sparse = generatePoissonPoints({
  width: 1000,
  height: 1000,
  minDistance: 150,
});

const denseArea = generatePoissonPoints({
  width: 300,
  height: 300,
  minDistance: 20,
  /* ... then offset to specific region ... */
});

const combined = [...sparse, ...denseArea];
```
