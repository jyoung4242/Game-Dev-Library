import { TileMap, Scene, Vector, Graphic, Tile } from "excalibur";

/**
 * Configuration interface for creating a chunked tilemap
 */
export interface ChunkedTilemapSource {
  tiles: any[]; // flat tile index array, fill with whatever data you need
  mapWidth: number; // total map width in tiles
  mapHeight: number; // total map height in tiles
  tileWidth: number; // tile width in pixels
  tileHeight: number; // tile height in pixels
  chunkWidth: number; // chunk width in tiles
  chunkHeight: number; // chunk height in tiles
}

/**
 * Represents a 2D coordinate in chunk space
 */
interface ChunkCoord {
  chunkX: number;
  chunkY: number;
}

/**
 * Represents a 2D coordinate in local tile space (within a chunk)
 */
interface LocalTileCoord {
  localX: number;
  localY: number;
}

/**
 * Combined coordinate information for a tile
 */
interface TileLocation extends ChunkCoord, LocalTileCoord {
  globalX: number;
  globalY: number;
}

/**
 * Represents tile data that can be set on a TileMap
 */
interface TileData {
  graphic?: Graphic;
  solid?: boolean;
}

/**
 * ChunkedTilemap system that splits large tilemaps into smaller chunks
 * for efficient rendering and culling using ExcaliburJS's native TileMap class.
 */
export class ChunkedTilemap {
  private source: ChunkedTilemapSource;
  private chunks: Map<string, TileMap>;
  private chunksX: number;
  private chunksY: number;

  constructor(source: ChunkedTilemapSource) {
    this.source = source;
    this.chunks = new Map();

    // Calculate total number of chunks needed in each dimension
    this.chunksX = Math.ceil(source.mapWidth / source.chunkWidth);
    this.chunksY = Math.ceil(source.mapHeight / source.chunkHeight);

    this.buildChunks();
  }

  /**
   * Builds all chunk TileMaps from the source data
   */
  private buildChunks(): void {
    for (let chunkY = 0; chunkY < this.chunksY; chunkY++) {
      for (let chunkX = 0; chunkX < this.chunksX; chunkX++) {
        const chunk = this.createChunk(chunkX, chunkY);
        const key = this.getChunkKey(chunkX, chunkY);
        this.chunks.set(key, chunk);
      }
    }
  }

  /**
   * Creates a single chunk TileMap at the specified chunk coordinates
   */
  private createChunk(chunkX: number, chunkY: number): TileMap {
    const { chunkWidth, chunkHeight, tileWidth, tileHeight } = this.source;

    // Calculate actual dimensions for this chunk (may be smaller at edges)
    const actualWidth = this.getActualChunkWidth(chunkX);
    const actualHeight = this.getActualChunkHeight(chunkY);

    // Create the Excalibur TileMap for this chunk
    // Note: At this point, the TileMap is empty - no graphics are set
    // Graphics must be set separately after construction
    const tileMap = new TileMap({
      pos: this.calculateChunkWorldPosition(chunkX, chunkY),
      tileWidth,
      tileHeight,
      rows: actualHeight,
      columns: actualWidth,
    });

    return tileMap;
  }

  /**
   * Calculates the world space position for a chunk
   * Each chunk is offset by its chunk coordinates multiplied by chunk dimensions in pixels
   */
  private calculateChunkWorldPosition(chunkX: number, chunkY: number): Vector {
    const { chunkWidth, chunkHeight, tileWidth, tileHeight } = this.source;

    // Convert chunk coordinates to world pixel coordinates
    const worldX = chunkX * chunkWidth * tileWidth;
    const worldY = chunkY * chunkHeight * tileHeight;

    return new Vector(worldX, worldY);
  }

  /**
   * Retrieves a tile index from the global flat tile array
   * Returns -1 if coordinates are out of bounds
   */
  private getTileIndexFromGlobal(globalX: number, globalY: number): any {
    const { mapWidth, mapHeight, tiles } = this.source;

    if (globalX < 0 || globalX >= mapWidth || globalY < 0 || globalY >= mapHeight) {
      return -1;
    }

    // Convert 2D coordinates to 1D array index (row-major order)
    const index = globalY * mapWidth + globalX;
    return tiles[index] ?? -1;
  }

  /**
   * Calculates actual chunk width (handles edge chunks that may be smaller)
   */
  private getActualChunkWidth(chunkX: number): number {
    const { mapWidth, chunkWidth } = this.source;
    const startX = chunkX * chunkWidth;
    return Math.min(chunkWidth, mapWidth - startX);
  }

  /**
   * Calculates actual chunk height (handles edge chunks that may be smaller)
   */
  private getActualChunkHeight(chunkY: number): number {
    const { mapHeight, chunkHeight } = this.source;
    const startY = chunkY * chunkHeight;
    return Math.min(chunkHeight, mapHeight - startY);
  }

  /**
   * Generates a unique string key for chunk lookup
   */
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  /**
   * Converts global tile coordinates to chunk coordinates and local tile coordinates
   */
  public globalToChunkCoords(globalX: number, globalY: number): TileLocation {
    const { chunkWidth, chunkHeight } = this.source;

    // Determine which chunk contains this global tile
    const chunkX = Math.floor(globalX / chunkWidth);
    const chunkY = Math.floor(globalY / chunkHeight);

    // Calculate local position within the chunk
    const localX = globalX % chunkWidth;
    const localY = globalY % chunkHeight;

    return { chunkX, chunkY, localX, localY, globalX, globalY };
  }

  /**
   * Converts world pixel coordinates to global tile coordinates
   */
  public worldToGlobalTile(worldX: number, worldY: number): { x: number; y: number } {
    const { tileWidth, tileHeight } = this.source;

    return {
      x: Math.floor(worldX / tileWidth),
      y: Math.floor(worldY / tileHeight),
    };
  }

  /**
   * Gets the tile index at world pixel coordinates
   * Returns -1 if out of bounds
   */
  public getTileIndexAtWorld(worldX: number, worldY: number): number {
    const globalTile = this.worldToGlobalTile(worldX, worldY);

    // Validate bounds
    if (globalTile.x < 0 || globalTile.x >= this.source.mapWidth || globalTile.y < 0 || globalTile.y >= this.source.mapHeight) {
      return -1;
    }

    return this.getTileIndexFromGlobal(globalTile.x, globalTile.y);
  }

  /**
   * Gets the chunk and local coordinates for a world position
   * Returns null if out of bounds
   */
  public getChunkAtWorld(
    worldX: number,
    worldY: number
  ): {
    chunk: TileMap;
    localX: number;
    localY: number;
  } | null {
    const globalTile = this.worldToGlobalTile(worldX, worldY);

    if (globalTile.x < 0 || globalTile.x >= this.source.mapWidth || globalTile.y < 0 || globalTile.y >= this.source.mapHeight) {
      return null;
    }

    const location = this.globalToChunkCoords(globalTile.x, globalTile.y);
    const chunk = this.getChunk(location.chunkX, location.chunkY);

    if (!chunk) {
      return null;
    }

    return {
      chunk,
      localX: location.localX,
      localY: location.localY,
    };
  }

  /**
   * Adds all chunk TileMaps to the specified Excalibur Scene
   * Excalibur's built-in culling will automatically skip off-screen chunks
   */
  public addToScene(scene: Scene): void {
    this.chunks.forEach(chunk => {
      scene.add(chunk);
    });
  }

  /**
   * Removes all chunk TileMaps from the specified Excalibur Scene
   */
  public removeFromScene(scene: Scene): void {
    this.chunks.forEach(chunk => {
      scene.remove(chunk);
    });
  }

  /**
   * Gets a specific chunk by chunk coordinates
   */
  public getChunk(chunkX: number, chunkY: number): TileMap | undefined {
    const key = this.getChunkKey(chunkX, chunkY);
    return this.chunks.get(key);
  }

  /**
   * Returns all chunks for advanced use cases
   */
  public getAllChunks(): TileMap[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Gets information about the chunked tilemap structure
   */
  public getInfo() {
    return {
      totalChunks: this.chunks.size,
      chunksX: this.chunksX,
      chunksY: this.chunksY,
      mapWidth: this.source.mapWidth,
      mapHeight: this.source.mapHeight,
      chunkWidth: this.source.chunkWidth,
      chunkHeight: this.source.chunkHeight,
    };
  }

  /**
   * Iterates over ALL tiles in ALL chunks in a consistent order (row-major)
   * Provides tile indices and coordinates for each position
   *
   * @param callback - Called for each tile with (tileIndex, globalX, globalY, chunkX, chunkY, localX, localY)
   */
  public forEachTile(
    callback: (
      tileIndex: any,
      globalX: number,
      globalY: number,
      chunkX: number,
      chunkY: number,
      localX: number,
      localY: number
    ) => void
  ): void {
    const { mapWidth, mapHeight } = this.source;

    // Iterate in global tile order (row-major)
    for (let globalY = 0; globalY < mapHeight; globalY++) {
      for (let globalX = 0; globalX < mapWidth; globalX++) {
        const location = this.globalToChunkCoords(globalX, globalY);
        const tileIndex = this.getTileIndexFromGlobal(globalX, globalY);

        callback(tileIndex, globalX, globalY, location.chunkX, location.chunkY, location.localX, location.localY);
      }
    }
  }

  /**
   * Iterates over tiles in a specific chunk
   * More efficient than forEachTile when you only need to update one chunk
   *
   * @param chunkX - Chunk X coordinate
   * @param chunkY - Chunk Y coordinate
   * @param callback - Called for each tile with (tileIndex, localX, localY, globalX, globalY)
   */
  public forEachTileInChunk(
    chunkX: number,
    chunkY: number,
    callback: (tileIndex: any, localX: number, localY: number, globalX: number, globalY: number) => void
  ): void {
    const chunk = this.getChunk(chunkX, chunkY);
    if (!chunk) return;

    const actualWidth = this.getActualChunkWidth(chunkX);
    const actualHeight = this.getActualChunkHeight(chunkY);
    const startGlobalX = chunkX * this.source.chunkWidth;
    const startGlobalY = chunkY * this.source.chunkHeight;

    for (let localY = 0; localY < actualHeight; localY++) {
      for (let localX = 0; localX < actualWidth; localX++) {
        const globalX = startGlobalX + localX;
        const globalY = startGlobalY + localY;
        const tileIndex = this.getTileIndexFromGlobal(globalX, globalY);

        callback(tileIndex, localX, localY, globalX, globalY);
      }
    }
  }

  /**
   * Iterates over each chunk TileMap
   * Most efficient for operations that work on entire TileMaps at once
   *
   * @param callback - Called for each chunk with (chunk, chunkX, chunkY)
   */
  public forEachChunk(callback: (chunk: TileMap, chunkX: number, chunkY: number) => void): void {
    for (let chunkY = 0; chunkY < this.chunksY; chunkY++) {
      for (let chunkX = 0; chunkX < this.chunksX; chunkX++) {
        const chunk = this.getChunk(chunkX, chunkY);
        if (chunk) {
          callback(chunk, chunkX, chunkY);
        }
      }
    }
  }

  /**
   * Sets a graphic on a specific tile using global coordinates
   * This is the primary method for setting tile graphics
   *
   * @param globalX - Global X coordinate
   * @param globalY - Global Y coordinate
   * @param graphic - Excalibur Graphic to display
   */
  public setTileGraphic(globalX: number, globalY: number, graphic: Graphic): void {
    const location = this.globalToChunkCoords(globalX, globalY);
    const chunk = this.getChunk(location.chunkX, location.chunkY);

    if (chunk) {
      // Use TileMap.getTile() which returns the Tile at that position
      const tile = chunk.getTile(location.localX, location.localY);
      if (tile) {
        tile.clearGraphics();
        tile.addGraphic(graphic);
      }
    }
  }

  /**
   * Sets whether a tile is solid using global coordinates
   *
   * @param globalX - Global X coordinate
   * @param globalY - Global Y coordinate
   * @param solid - Whether the tile should be solid
   */
  public setTileSolid(globalX: number, globalY: number, solid: boolean): void {
    const location = this.globalToChunkCoords(globalX, globalY);
    const chunk = this.getChunk(location.chunkX, location.chunkY);

    if (chunk) {
      const tile = chunk.getTile(location.localX, location.localY);
      if (tile) {
        tile.solid = solid;
      }
    }
  }

  /**
   * Efficiently initializes all tiles in one pass
   * This is the RECOMMENDED way to set up your tilemap
   *
   * The callback receives the actual Tile object and can mutate it directly:
   * - Set graphics with tile.addGraphic()
   * - Set collision with tile.solid = true/false
   * - Set custom data, multiple graphics layers, etc.
   *
   * @param callback - Called once per tile with (tile, tileIndex, globalX, globalY, localX, localY)
   *
   * @example
   * ```typescript
   * chunkedMap.initializeTiles((tile, tileIndex) => {
   *   // Set graphic based on index
   *   tile.addGraphic(spriteSheet.getSprite(tileIndex, 0));
   *
   *   // Set collision
   *   tile.solid = tileIndex === 3;
   *
   *   // Add multiple layers
   *   if (tileIndex === 5) {
   *     tile.addGraphic(decorationSprite);
   *   }
   * });
   * ```
   */
  public initializeTiles(
    callback: (tile: Tile, tileIndex: any, globalX: number, globalY: number, localX: number, localY: number) => void
  ): void {
    this.forEachChunk((chunk, chunkX, chunkY) => {
      const actualWidth = this.getActualChunkWidth(chunkX);
      const actualHeight = this.getActualChunkHeight(chunkY);
      const startGlobalX = chunkX * this.source.chunkWidth;
      const startGlobalY = chunkY * this.source.chunkHeight;

      // Loop through each tile in this chunk
      for (let localY = 0; localY < actualHeight; localY++) {
        for (let localX = 0; localX < actualWidth; localX++) {
          const globalX = startGlobalX + localX;
          const globalY = startGlobalY + localY;
          const tileIndex = this.getTileIndexFromGlobal(globalX, globalY);

          const tile = chunk.getTile(localX, localY);
          if (tile) {
            callback(tile, tileIndex, globalX, globalY, localX, localY);
          }
        }
      }
    });
  }
}
