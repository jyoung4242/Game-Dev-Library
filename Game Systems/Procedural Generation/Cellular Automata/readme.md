# Cellular Automata Map Generator

A TypeScript module for applying cellular automata rules to procedurally generate cave-like map structures. This implementation uses a
survival/birth rule system to smooth and refine binary maps.

## Overview

This module processes a flat array representing a 2D grid map where cells are either walls (1) or floors (0). It applies cellular
automata rules based on neighbor counting to create organic, natural-looking cave structures.

## Functions

### `applyCellularAutomataRules(map, width, height)`

Applies one iteration of cellular automata rules to transform the map.

**Parameters:**

- `map: number[]` - Flat array representing the 2D map (0 = floor, 1 = wall)
- `width: number` - Map width in cells
- `height: number` - Map height in cells

**Returns:**

- `number[]` - New transformed map array

**Rules:**

- **Walls (1)**: Survive if they have 4+ adjacent walls, otherwise become floor
- **Floors (0)**: Become walls if they have 5+ adjacent walls, otherwise remain floor

### `countAdjacentWalls(map, width, height, index)`

Internal helper function that counts the number of walls in the 8 adjacent cells (Moore neighborhood).

**Boundary Behavior:** Out-of-bounds cells are treated as walls, which helps create natural boundaries.

## Usage Example

```typescript
// Create initial random map
const width = 50;
const height = 50;
let map = new Array(width * height).fill(0).map(() => (Math.random() > 0.55 ? 1 : 0));

// Apply cellular automata rules multiple times for smoother caves
for (let i = 0; i < 4; i++) {
  map = applyCellularAutomataRules(map, width, height);
}

// Use the generated map
console.log(map);
```

## How It Works

1. The algorithm examines each cell in the map
2. For each cell, it counts walls in the 8 surrounding cells (3×3 grid minus center)
3. Based on the current cell state and neighbor count, it applies transformation rules
4. Multiple iterations smooth the map into natural cave formations

## Common Parameters

- **Initial density:** 45-55% walls typically produces good results
- **Iterations:** 3-5 passes usually creates well-formed caves
- **Rule threshold:** The 4/5 rule (survive at 4+, birth at 5+) creates balanced structures

## Notes

- The nested loop `for (let x = 0; x < width; x++)` inside the main loop appears unused and can be removed for optimization
- The module treats map boundaries as solid walls, creating natural cave edges
- This implementation uses synchronous updates (all changes applied after full evaluation)
