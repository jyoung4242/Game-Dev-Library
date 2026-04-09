# Fog of War System (`fowSystem.ts`)

![screenhot](./ss.gif)

## Purpose

This file implements a lightweight fog-of-war system for the isometric map in `cell auto isometric`.

It provides:

- `FogExplorerComponent` — a marker component added to actors that should clear fog.
- `FOW` — an Excalibur `System` that scans fog tiles and clears them when an explorer overlaps.

## Key exports

### `FogExplorerComponent`

- Extends Excalibur `Component`.
- Contains a single flag: `isActive`.
- Used to identify entities that can reveal fog.

### `FOW`

- Extends Excalibur `System`.
- Queries entities that contain:
  - `FogExplorerComponent`
  - `TransformComponent`
  - `BodyComponent`
- Maintains an optional reference to the current `ExIsoMetricMap`.
- Uses a tick interval to reduce processing frequency.

## How it works

1. The system is created with a reference to the Excalibur `World`.
2. `registerMap(map)` attaches the upper isometric map used for fog.
3. During `update()`, the system:
   - returns early when no map is registered.
   - increments a global tick counter and only processes every `TIK_INTERVAL` updates.
   - iterates over each explorer entity in the query.
   - fetches the explorer's `graphics.bounds` and compares it against each tile's stored bounds.
   - if an explorer overlaps a fogged tile, and the tile is not already dirty:
     - sets `tile.data.fog` to `false`
     - marks the map as dirty by calling `this._map.addTag("dirty")`
     - pushes the tile onto `this._map.dirtyTiles`

## Map contract

`FOW` depends on the upper map having these properties:

- `tiles`: the isometric tiles to scan.
- each tile must have:
  - `tile.data.get("bounds")` — a rectangle with `top`, `bottom`, `left`, `right`
  - `tile.data.get("fog")` — a boolean indicating if the tile is currently covered.
- `dirtyTiles`: an array of tiles that need redraw.
- `addTag("dirty")` triggers the map redraw logic in `levelGen.ts`.

This contract is implemented by the `ExIsoMetricMap` type from `src/Lib/levelGen.ts`.

## Integration notes

The active fog explorer is created in `src/Actors/walkingPlayer.ts`:

- `FowChildActor` is a transparent child actor with a `FogExplorerComponent(true)`.
- It is added as a child of `WalkingPlayer`.

Typical usage:

- Add the system to the world:
  ```ts
  const fogSystem = new FOW(world);
  world.addSystem(fogSystem);
  ```
- Register the upper map once it is created:
  ```ts
  fogSystem.registerMap(upperMap);
  ```

## Important details

- `TIK_INTERVAL` is currently `5`. This means the fog check only runs every 5 frames.
- The implementation uses a global `TIK` counter shared across the file.
- If `tile.data.get("fog")` is already `false`, the tile is skipped.
- If `this._map.dirtyTiles` is undefined, fog clearing is skipped for safety.

## Potential improvements

- Replace the global `TIK` counter with per-system state.
- Use a spatial index instead of brute-forcing all tiles.
- Store `explorerBounds` and tile bounds in a consistent coordinate space.
- Avoid scanning all map tiles each update for performance on larger maps.

## Related files

- `src/Actors/walkingPlayer.ts` — defines `FowChildActor` and attaches the explorer component.
- `src/Lib/levelGen.ts` — builds the isometric map and handles tile redraw via dirty updates.
