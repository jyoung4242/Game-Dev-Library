export type Rule = {
  weight: number;
  up: number[];
  down: number[];
  left: number[];
  right: number[];
};

export type SpriteSheetMap = Record<number, Rule>;

/** Custom event fired when a single tile is collapsed */
export const WFC_TILE_COLLAPSED = "wfc-tile-collapsed";

/** Custom event fired when the entire tilemap generation is complete */
export const WFC_COLLAPSE_COMPLETE = "wfc-collapse-complete";

type TileData = {
  tileIndex: number;
  spriteIndex: number;
  entropy: number;
  availableTiles: number[];
};

export interface WfcConfig {
  name: string;
  tilemapDims: { width: number; height: number };
  seed?: number;
  rules?: SpriteSheetMap;
  auto?: boolean;
  spriteSheetDims: { width: number; height: number };
  startingIndex?: number;
  collapseDelay?: number;
  maxBacktracks?: number;
}

enum WfcBufferState {
  Unknown = "unknown",
  Ready = "ready",
  Collapsing = "collapsing",
  Collapsed = "collapsed",
}

type StepData = {
  collapsedIndex: number;
  previousSpriteIndex: number;
  previousEntropy: number;
  previousAvailableTiles: number[];
};

type Neighbors = {
  up: number;
  right: number;
  down: number;
  left: number;
};

export class WFC {
  private readonly name: string;
  private state: WfcBufferState = WfcBufferState.Unknown;
  private readonly tilemapDims: { width: number; height: number };
  private rules: SpriteSheetMap = {};
  private steps: StepData[] = [];
  private readonly rng: Random;
  private tiles: TileData[] = [];
  private readonly auto: boolean;
  private readonly spriteSheetDims: { width: number; height: number };
  private generator: Generator<void, void, unknown> | null = null;
  private readonly startingIndex: number;
  private readonly delay: number;
  private readonly maxBacktracks: number;
  private backtrackCount: number = 0;

  constructor(config: WfcConfig) {
    this.name = config.name;
    this.rng = new Random(config.seed ?? Date.now());
    this.tilemapDims = config.tilemapDims;
    this.rules = config.rules ?? {};
    this.delay = config.collapseDelay ?? 0;
    this.auto = config.auto ?? false;
    this.spriteSheetDims = config.spriteSheetDims;
    this.startingIndex = config.startingIndex ?? -1;
    this.maxBacktracks = config.maxBacktracks ?? 100;
  }

  /**
   * Initialize the WFC algorithm with an empty tilemap
   */
  initialize(): void {
    if (Object.keys(this.rules).length === 0) {
      throw new Error("No rules found. Load rules before initializing.");
    }

    const numTiles = this.tilemapDims.width * this.tilemapDims.height;
    this.tiles = [];

    for (let i = 0; i < numTiles; i++) {
      this.tiles.push({
        tileIndex: i,
        spriteIndex: -1,
        entropy: Infinity,
        availableTiles: [],
      });
    }

    this.steps = [];
    this.backtrackCount = 0;
    this.state = WfcBufferState.Ready;
  }

  /**
   * Load tile adjacency rules
   */
  loadRules(rules: SpriteSheetMap): void {
    this.rules = rules;
  }

  /**
   * Set the weight for a specific sprite (affects probability of selection)
   */
  setWeight(spriteIndex: number, weight: number): void {
    if (!this.rules[spriteIndex]) {
      throw new Error(`Sprite index ${spriteIndex} not found in rules`);
    }
    this.rules[spriteIndex].weight = weight;
  }

  /**
   * Reset the WFC instance to uninitialized state
   */
  reset(): void {
    this.rules = {};
    this.tiles = [];
    this.steps = [];
    this.generator = null;
    this.backtrackCount = 0;
    this.state = WfcBufferState.Unknown;
  }

  /**
   * Manually set a tile to a specific sprite (useful for constraints)
   */
  setTile(index: number, spriteIndex: number): void {
    if (index < 0 || index >= this.tiles.length) {
      throw new Error(`Tile index ${index} out of bounds`);
    }
    if (!this.rules[spriteIndex]) {
      throw new Error(`Sprite index ${spriteIndex} not found in rules`);
    }

    this.tiles[index].spriteIndex = spriteIndex;
    this.tiles[index].availableTiles = [];
    this.tiles[index].entropy = 0;
    this.updateEntropy();
  }

  /**
   * Update tilemap dimensions (requires re-initialization)
   */
  setDims(dims: { width: number; height: number }): void {
    this.tilemapDims.width = dims.width;
    this.tilemapDims.height = dims.height;
  }

  /**
   * Get the sprite sheet coordinates for a tile
   */
  getSpriteCoords(index: number): { x: number; y: number } {
    if (index < 0 || index >= this.tiles.length) {
      return { x: -1, y: -1 };
    }

    const spriteIndex = this.tiles[index].spriteIndex;
    if (spriteIndex === -1) {
      return { x: -1, y: -1 };
    }

    const x = spriteIndex % this.spriteSheetDims.width;
    const y = Math.floor(spriteIndex / this.spriteSheetDims.width);
    return { x, y };
  }

  /**
   * Get a copy of a tile's data
   */
  getTile(index: number): Readonly<TileData> | null {
    if (index < 0 || index >= this.tiles.length) {
      return null;
    }
    return { ...this.tiles[index] };
  }

  /**
   * Get all tiles (read-only copy)
   */
  getTiles(): ReadonlyArray<Readonly<TileData>> {
    return this.tiles.map(t => ({ ...t }));
  }

  /**
   * Get current state
   */
  getState(): WfcBufferState {
    return this.state;
  }

  /**
   * Generate the tilemap using Wave Function Collapse
   */
  async generate(): Promise<void> {
    if (this.state !== WfcBufferState.Ready) {
      throw new Error(`Cannot generate: current state is ${this.state}`);
    }

    // Select starting tile
    const startTile = this.startingIndex === -1 ? this.rng.getRandomInteger(0, this.tiles.length - 1) : this.startingIndex;

    // Collapse first tile
    const firstTile = this.tiles[startTile];
    const numSprites = Object.keys(this.rules).length;

    const firstSpriteIndex =
      firstTile.entropy === Infinity
        ? parseInt(Object.keys(this.rules)[this.rng.getRandomInteger(0, numSprites - 1)])
        : this.rng.pickOneWeighted(firstTile.availableTiles, this.rules);

    this.collapseTile(startTile, firstSpriteIndex);

    // Create generator and run
    this.generator = this.collapseNext();
    this.state = WfcBufferState.Collapsing;

    if (this.auto) {
      let result = await this.generator.next();
      while (!result.done) {
        if (this.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        result = await this.generator.next();
      }
    } else {
      await this.generator.next();
    }

    this.state = WfcBufferState.Collapsed;
  }

  /**
   * Manually step through generation (when auto is false)
   */
  async step(): Promise<boolean> {
    if (!this.generator) {
      throw new Error("Generator not initialized. Call generate() first.");
    }

    const result = await this.generator.next();
    return result.done ?? false;
  }

  /**
   * Core collapse algorithm generator
   */
  private *collapseNext(): Generator<void, void, unknown> {
    while (true) {
      const lowestEntropyTiles = this.getLowestEntropyTiles();

      if (lowestEntropyTiles.length === 0) {
        this.dispatchCompleteEvent();
        return;
      }

      const randomTile = this.rng.pickOne(lowestEntropyTiles);

      try {
        const selectedSprite = this.rng.pickOneWeighted(randomTile.availableTiles, this.rules);

        this.collapseTile(randomTile.tileIndex, selectedSprite);
        this.backtrackCount = 0; // Reset on success

        if (this.getRemainingTileCount() === 0) {
          this.dispatchCompleteEvent();
          return;
        }

        this.dispatchTileCollapsedEvent(randomTile);
        yield;
      } catch (error) {
        // Handle contradiction with backtracking
        if (this.backtrackCount >= this.maxBacktracks) {
          throw new Error(`Max backtrack limit (${this.maxBacktracks}) reached. Generation failed.`);
        }

        if (this.steps.length === 0) {
          throw new Error("Cannot backtrack: no steps available. Generation failed.");
        }

        this.backtrack();
        this.backtrackCount++;
        // Don't yield on backtrack, try again immediately
      }
    }
  }

  /**
   * Collapse a specific tile to a sprite index
   */
  private collapseTile(index: number, spriteIndex: number): void {
    const tile = this.tiles[index];

    // Store step for potential backtracking
    this.steps.push({
      collapsedIndex: index,
      previousSpriteIndex: tile.spriteIndex,
      previousEntropy: tile.entropy,
      previousAvailableTiles: [...tile.availableTiles],
    });

    tile.spriteIndex = spriteIndex;
    tile.entropy = 0;
    tile.availableTiles = [];

    this.updateEntropy();
  }

  /**
   * Backtrack one step
   */
  private backtrack(): void {
    const lastStep = this.steps.pop();
    if (!lastStep) {
      throw new Error("No steps to backtrack");
    }

    const tile = this.tiles[lastStep.collapsedIndex];
    tile.spriteIndex = lastStep.previousSpriteIndex;
    tile.entropy = lastStep.previousEntropy;
    tile.availableTiles = lastStep.previousAvailableTiles;

    this.updateEntropy();
  }

  /**
   * Update entropy for all affected tiles
   */
  private updateEntropy(): void {
    for (const tile of this.tiles) {
      if (tile.entropy === 0) continue;

      const neighbors = this.getNeighbors(tile.tileIndex);
      const hasCollapsedNeighbor = Object.values(neighbors).some(idx => idx !== -1 && this.tiles[idx].entropy === 0);

      if (hasCollapsedNeighbor) {
        this.calculateEntropy(tile.tileIndex);
      }
    }
  }

  /**
   * Calculate entropy for a specific tile based on neighbors
   */
  private calculateEntropy(index: number): void {
    const tile = this.tiles[index];

    if (tile.entropy === 0) return;

    const neighbors = this.getNeighbors(index);
    const constraints: number[][] = [];

    // Collect constraints from each collapsed neighbor
    if (neighbors.up !== -1 && this.tiles[neighbors.up].entropy === 0) {
      const upSprite = this.tiles[neighbors.up].spriteIndex;
      constraints.push([...this.rules[upSprite].down]);
    }

    if (neighbors.down !== -1 && this.tiles[neighbors.down].entropy === 0) {
      const downSprite = this.tiles[neighbors.down].spriteIndex;
      constraints.push([...this.rules[downSprite].up]);
    }

    if (neighbors.left !== -1 && this.tiles[neighbors.left].entropy === 0) {
      const leftSprite = this.tiles[neighbors.left].spriteIndex;
      constraints.push([...this.rules[leftSprite].right]);
    }

    if (neighbors.right !== -1 && this.tiles[neighbors.right].entropy === 0) {
      const rightSprite = this.tiles[neighbors.right].spriteIndex;
      constraints.push([...this.rules[rightSprite].left]);
    }

    // If no constraints, tile has infinite entropy
    if (constraints.length === 0) {
      tile.entropy = Infinity;
      tile.availableTiles = [];
      return;
    }

    // Find intersection of all constraints
    const availableTiles = constraints.reduce((intersection, constraint) => intersection.filter(tile => constraint.includes(tile)));

    if (availableTiles.length === 0) {
      throw new Error(`No available tiles for index ${index} - contradiction detected`);
    }

    tile.availableTiles = availableTiles;
    tile.entropy = availableTiles.length;
  }

  /**
   * Get neighboring tile indices
   */
  private getNeighbors(index: number): Neighbors {
    const width = this.tilemapDims.width;
    const totalTiles = this.tiles.length;

    return {
      up: index - width < 0 ? -1 : index - width,
      down: index + width >= totalTiles ? -1 : index + width,
      left: index % width === 0 ? -1 : index - 1,
      right: index % width === width - 1 ? -1 : index + 1,
    };
  }

  /**
   * Get tiles with lowest entropy (candidates for next collapse)
   */
  private getLowestEntropyTiles(): TileData[] {
    const uncollapsedTiles = this.tiles.filter(t => t.entropy > 0 && t.entropy !== Infinity);

    if (uncollapsedTiles.length === 0) return [];

    const minEntropy = Math.min(...uncollapsedTiles.map(t => t.entropy));
    return this.tiles.filter(t => t.entropy === minEntropy);
  }

  /**
   * Count remaining tiles to collapse
   */
  private getRemainingTileCount(): number {
    return this.tiles.filter(t => t.entropy !== 0).length;
  }

  /**
   * Dispatch tile collapsed event
   */
  private dispatchTileCollapsedEvent(tile: TileData): void {
    const event = new CustomEvent(WFC_TILE_COLLAPSED, {
      detail: { name: this.name, tile: { ...tile } },
    });
    window.dispatchEvent(event);
  }

  /**
   * Dispatch collapse complete event
   */
  private dispatchCompleteEvent(): void {
    const event = new CustomEvent(WFC_COLLAPSE_COMPLETE, {
      detail: { name: this.name, tiles: this.getTiles() },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Seeded pseudo-random number generator using Linear Congruential Generator
 */
class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number in [0, 1)
   * Uses LCG algorithm with parameters from Numerical Recipes
   */
  getRandom(): number {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate random float in range [min, max)
   */
  getRandomFloat(min: number, max: number): number {
    return this.getRandom() * (max - min) + min;
  }

  /**
   * Generate random integer in range [min, max] (inclusive)
   */
  getRandomInteger(min: number, max: number): number {
    return Math.floor(this.getRandom() * (max - min + 1)) + min;
  }

  /**
   * Pick one random element from array
   */
  pickOne<T>(set: T[]): T {
    const index = Math.floor(this.getRandom() * set.length);
    return set[index];
  }

  /**
   * Get current seed value
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Pick one element from array with weighted probability
   */
  pickOneWeighted(set: number[], rules: SpriteSheetMap): number {
    const weightedSet: number[] = [];

    for (const item of set) {
      const weight = rules[item].weight;
      for (let i = 0; i < weight; i++) {
        weightedSet.push(item);
      }
    }

    const index = Math.floor(this.getRandom() * weightedSet.length);
    return weightedSet[index];
  }
}
