# Chunked 2D Tilemap - Developer Guide

## Overview

The `ChunkedTilemap` system efficiently manages large 2D tilemaps by splitting them into smaller chunks. This approach leverages
ExcaliburJS's built-in TileMap rendering and culling to automatically hide off-screen chunks, significantly improving performance for
large game worlds.

## Installation & Setup

1. Import the `ChunkedTilemap` class and `ChunkedTilemapSource` interface:

```typescript
import { ChunkedTilemap, ChunkedTilemapSource } from "./Chunked2dTilemap";
```

## Creating a Chunked Tilemap

### Step 1: Prepare Your Tile Data

Create a flat array of tile indices representing your entire map:

```typescript
//prettier-ignore
let myTiles =  [
    0,0,0,1,1, // Row 0: grass, grass, grass, dirt, dirt
    0,2,2,1,1, // Row 1: grass, water, water, dirt, dirt
    0,2,2,3,3, // Row 2: grass, water, water, wall, wall
    0,0,0,3,3, // Row 3: grass, grass, grass, wall, wall
  ];
```

### Step 2: Configure the Tilemap

Define your tilemap configuration using `ChunkedTilemapSource`:

```typescript
const tilemapConfig: ChunkedTilemapSource = {
  tiles: myTiles, // Your flat tile index array
  mapWidth: 6, // Total map width in tiles
  mapHeight: 3, // Total map height in tiles
  tileWidth: 32, // Width of each tile in pixels
  tileHeight: 32, // Height of each tile in pixels
  chunkWidth: 2, // Width of each chunk in tiles
  chunkHeight: 2, // Height of each chunk in tiles
};

const chunkedMap = new ChunkedTilemap(tilemapConfig);
```

### Step 3: Initialize Tiles with Graphics and Collision

The recommended way to set up your tilemap is using `initializeTiles()`:

```typescript
// Assuming you have a SpriteSheet loaded
chunkedMap.initializeTiles((tile, tileIndex, globalX, globalY, localX, localY) => {

  // set Solid rules
  if( tileindex == 3) tile.solid = true;
  else tile.solid = false;

  // layer graphics based on tile type (tileIndex)
  switch(tileIndex){
    case 0:
      tile.addGraphics(GrassTile);
      break;
    case 1:
      tile.addGraphics(WaterTile);
      break;
    ...

  }
});
```

### Step 4: Add to Scene

Add all chunks to your scene at once:

```typescript
chunkedMap.addToScene(scene);
```

The chunks will automatically be culled by ExcaliburJS's rendering engine—only visible chunks are drawn.

## Common Operations

### Query Tile Information

**Get tile index at world position:**

```typescript
const tileIndex = chunkedMap.getTileIndexAtWorld(worldX, worldY);
if (tileIndex === -1) {
  // Out of bounds
}
```

**Get chunk and local position from world coordinates:**

```typescript
const result = chunkedMap.getChunkAtWorld(worldX, worldY);
if (result) {
  const { chunk, localX, localY } = result;
  // Use chunk and local coordinates
}
```

### Modify Individual Tiles

**Set tile graphic at a specific position:**

```typescript
chunkedMap.setTileGraphic(globalX, globalY, newGraphic);
```

**Set tile collision:**

```typescript
chunkedMap.setTileSolid(globalX, globalY, true); // Make solid
chunkedMap.setTileSolid(globalX, globalY, false); // Make passable
```

### Coordinate Conversion

**Convert world pixel coordinates to global tile coordinates:**

```typescript
const globalTile = chunkedMap.worldToGlobalTile(worldX, worldY);
// Returns { x: number, y: number }
```

**Convert global tile coordinates to chunk coordinates and local position:**

```typescript
const location = chunkedMap.globalToChunkCoords(globalX, globalY);
// Returns { chunkX, chunkY, localX, localY, globalX, globalY }
```

## Iteration Methods

### Iterate Over All Tiles

Use this when you need to process every tile in the entire map:

```typescript
chunkedMap.forEachTile((tileIndex, globalX, globalY, chunkX, chunkY, localX, localY) => {
  // Process tile
  if (tileIndex === 3) {
    console.log(`Wall at (${globalX}, ${globalY})`);
  }
});
```

### Iterate Over Tiles in a Specific Chunk

More efficient when you only need to update one chunk:

```typescript
chunkedMap.forEachTileInChunk(chunkX, chunkY, (tileIndex, localX, localY, globalX, globalY) => {
  // Process tile in chunk
});
```

### Iterate Over Chunks

Most efficient for operations that work on entire TileMaps at once:

```typescript
chunkedMap.forEachChunk((chunk, chunkX, chunkY) => {
  // Each chunk is an ExcaliburJS TileMap
  // You can access/modify the chunk directly
  console.log(`Chunk at (${chunkX}, ${chunkY})`);
});
```

## Advanced Usage

### Access Raw Chunks

Get a specific chunk by coordinates:

```typescript
const chunk = chunkedMap.getChunk(chunkX, chunkY);
if (chunk) {
  // Work with ExcaliburJS TileMap directly
  const tile = chunk.getTile(localX, localY);
  // ...
}
```

Get all chunks as an array:

```typescript
const allChunks = chunkedMap.getAllChunks();
allChunks.forEach(chunk => {
  // Process each chunk
});
```

### Get Tilemap Information

Retrieve metadata about the chunked structure:

```typescript
const info = chunkedMap.getInfo();
// Returns:
// {
//   totalChunks: number,
//   chunksX: number,
//   chunksY: number,
//   mapWidth: number,
//   mapHeight: number,
//   chunkWidth: number,
//   chunkHeight: number,
// }
```

### Remove from Scene

Clean up when you're done:

```typescript
chunkedMap.removeFromScene(scene);
```

## Performance Tips

1. **Use `initializeTiles()` for initial setup** - It's optimized to set up all tiles in one pass
2. **Use `forEachTile()` for bulk operations** - More efficient than individual `setTile*()` calls for many tiles
3. **Use `forEachChunk()` for chunk-level operations** - Works directly with TileMaps for maximum efficiency
4. **Chunk size matters** - Balance between too many small chunks (culling overhead) and too few large chunks (rendering overhead).
   16x16 or 32x32 tiles per chunk are common

## Example: Complete Game World Setup

```typescript
// Create tilemap configuration
const mapConfig: ChunkedTilemapSource = {
  tiles: tileIndexArray,
  mapWidth: 100,
  mapHeight: 100,
  tileWidth: 32,
  tileHeight: 32,
  chunkWidth: 8,
  chunkHeight: 8,
};

// Create the chunked tilemap
const gameWorld = new ChunkedTilemap(mapConfig);

// Initialize all tiles
gameWorld.initializeTiles((tile, tileIndex) => {
  // Grass = 0, Water = 1, Tree = 2, Wall = 3
  const graphics = {
    0: grassSprite,
    1: waterSprite,
    2: treeSprite,
    3: wallSprite,
  };

  if (graphics[tileIndex]) {
    tile.addGraphic(graphics[tileIndex]);
  }

  // Collision for water and trees
  tile.solid = [1, 2, 3].includes(tileIndex);
});

// Add to scene
gameWorld.addToScene(scene);

// Later: Query and modify tiles
if (gameWorld.getTileIndexAtWorld(playerX, playerY) === 0) {
  console.log("Player is on grass");
}
```

## Key Design Notes

- **Flat tile array in row-major order** - Arrays are stored as `row 0 complete, row 1 complete, etc.`
- **Automatic edge handling** - Edge chunks are automatically sized correctly even if the map isn't evenly divisible by chunk
  dimensions
- **-1 indicates invalid/out-of-bounds** - Methods return -1 when accessing tiles outside the map bounds
- **Direct Tile access** - Use the `initializeTiles()` callback to directly access and configure Excalibur Tile objects
