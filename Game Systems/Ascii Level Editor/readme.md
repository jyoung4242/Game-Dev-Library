# LevelEditor Module

A TypeScript module for creating tile-based game levels from ASCII map data using the Excalibur game engine.

## Overview

The LevelEditor class provides functionality to convert ASCII-formatted level data into Excalibur TileMap objects. This allows game
developers to design levels using simple text representations and automatically generate the corresponding game maps with sprites and
collision data.

## Installation

This module requires Excalibur as a dependency:

```sh
npm install excalibur
```

## Usage

### Basic Example

```ts
import { LevelEditor } from "./LevelEditor";
import { vec } from "excalibur";
import { Resources } from "./resources";

// Define your sprite mappings
const levelSprites = {
  "#": { sprite: Resources.block.toSprite(), solid: true },
  ".": { sprite: Resources.floor.toSprite(), solid: false },
  P: { sprite: Resources.player.toSprite(), solid: false },
};

// Create ASCII map data
const mapString = `
#####################
#                   #
#  P                #
#       ###         #
#                   #
#####################
`;

// Configure your map
const mapConfig = {
  level1: {
    levelData: mapString,
    tilesize: vec(32, 32),
    mapsize: vec(21, 6),
    mapPosition: vec(0, 0),
  },
};

// Create the level
const editor = new LevelEditor();
const maps = editor.createLevel(mapConfig, levelSprites);

// Add maps to your scene
maps.forEach(map => scene.add(map));
```

### Multi-Section Level Example

Create levels with multiple connected sections:

```ts
import { vec } from "excalibur";
import { mapConfigOptions } from "./LevelEditor";
import { Resources } from "./resources";

// Define sprite mappings
export const levelSprites = {
  "#": { sprite: Resources.block.toSprite(), solid: true },
};

// Define map sections
const mapString1 = `
#                    
#                    
#                    
#                     
#            ###     
#                    
#####################
`;

const mapString2 = `
                   #
                   #
                   #
                   #
                   #
                   #
       #           #
####################
`;

// Configure level sections
export const level1: Record<string, mapConfigOptions> = {};
level1[1] = {
  levelData: mapString1,
  tilesize: vec(20, 15),
  mapsize: vec(21, 7),
  mapPosition: vec(0, 15),
};
level1[2] = {
  levelData: mapString2,
  tilesize: vec(20, 15),
  mapsize: vec(20, 8),
  mapPosition: vec(20 * 21, 0),
};

// Create the level
const editor = new LevelEditor();
const maps = editor.createLevel(level1, levelSprites);
```

## API Reference

LevelEditor

### Constructor

```ts
new LevelEditor();
```

Creates a new instance of the LevelEditor.

### Methods

`createLevel(mapOptions, sprites)`

Converts ASCII map data into Excalibur TileMaps.

#### Parameters:

mapOptions: Record<string, mapConfigOptions> - Object containing one or more map configurations (can use numeric or string keys)

sprites: Record<string, { sprite: Sprite | null; solid: boolean }> - Character-to-sprite mappings

Returns: TileMap[] - Array ofgenerated Excalibur TileMaps

### Interfaces

`mapConfigOptions`

```ts
interface mapConfigOptions {
  levelData: string; // ASCII representation of the level
  tilesize: Vector; // Size of each tile (width, height)
  mapsize: Vector; // Map dimensions (columns, rows)
  mapPosition: Vector; // World position of the map
}
```

### Sprite Configuration

```ts
{
  sprite: Sprite | null; // Excalibur Sprite to render
  solid: boolean; // Whether the tile has collision
}
```

## How It Works

1. **ASCII Parsing**: The module parses multi-line ASCII strings into a 2D character array
2. **Tile Mapping**: Each character in the ASCII map is mapped to its corresponding sprite and collision properties
3. **TileMap Generation**: Excalibur TileMap objects are created with the specified dimensions and position
4. **Sprite Assignment**: Each tile is assigned its graphic and collision properties based on the character mapping

### ASCII Map Format

- Each character represents one tile
- Newlines separate rows
- Space characters (ASCII 32) create empty tiles
- Any other character can be mapped to a sprite
- Leading newlines are automatically stripped

## Design Patterns

### Organizing Level Data

**Recommended structure:**

```
/levels
  ├── level1.ts
  ├── level2.ts
  └── levelSprites.ts
```

### levelSprites.ts

```ts
import { Resources } from "../resources";

export const levelSprites = {
  "#": { sprite: Resources.wall.toSprite(), solid: true },
  "=": { sprite: Resources.platform.toSprite(), solid: true },
  ".": { sprite: Resources.floor.toSprite(), solid: false },
  S: { sprite: Resources.spikes.toSprite(), solid: false },
};
```

### level1.ts

```ts
import { vec } from "excalibur";
import { mapConfigOptions } from "../LevelEditor";

export const level1: Record<string, mapConfigOptions> = {};

level1["section1"] = {
  levelData: `...`,
  tilesize: vec(32, 32),
  mapsize: vec(20, 10),
  mapPosition: vec(0, 0),
};
```

## Tips

### Map Positioning

Use mapPosition to place map sections side-by-side or create scrolling levels Calculate positions: vec(tileWidth _ columns, 0) for
horizontal continuation Stack vertically: vec(0, tileHeight _ rows) for vertical levels

### Tile Sizing

Keep tilesize consistent across map sections for seamless transitions Ensure mapsize matches your actual ASCII map dimensions (columns
× rows)

### Character Mapping

Only define sprites for characters you use in your ASCII maps Unmapped characters or spaces create empty tiles Use distinct characters
for different tile types

### Performance

The module creates all TileMaps at once - ideal for smaller levels For large worlds, consider loading/unloading map sections
dynamically

### Common Pitfalls

Dimension Mismatch: Ensure mapsize matches your ASCII string dimensions Position Overlap: Check that multiple map sections don't occupy
the same space unless intended Missing Sprites: Verify all characters in your ASCII map have corresponding sprite definitions

## License

MIT — use it freely in commercial or hobby projects.

## Contributing

Hit me up on discord if you want to contribute
