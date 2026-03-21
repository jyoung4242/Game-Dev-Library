export interface PoissonOptions {
  width: number;
  height: number;
  minDistance: number;
  maxTries?: number;
  seedCount?: number;
  randomSeed?: boolean;
}

export function generatePoissonPoints(opts: PoissonOptions): [number, number][] {
  const { width, height, minDistance, maxTries = 30, seedCount = 1, randomSeed = true } = opts;

  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);

  const grid: Array<[number, number] | null> = new Array(gridWidth * gridHeight).fill(null);

  const samples: [number, number][] = [];
  const active: [number, number][] = [];

  function gridIndex(x: number, y: number) {
    return x + y * gridWidth;
  }

  function fits(x: number, y: number) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return false;
    }

    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);

    const sx = Math.max(gx - 2, 0);
    const ex = Math.min(gx + 2, gridWidth - 1);
    const sy = Math.max(gy - 2, 0);
    const ey = Math.min(gy + 2, gridHeight - 1);

    for (let yy = sy; yy <= ey; yy++) {
      for (let xx = sx; xx <= ex; xx++) {
        const s = grid[gridIndex(xx, yy)];
        if (!s) continue;
        const dx = s[0] - x;
        const dy = s[1] - y;
        if (dx * dx + dy * dy < minDistance * minDistance) {
          return false;
        }
      }
    }
    return true;
  }

  function addSample(x: number, y: number) {
    samples.push([x, y]);
    active.push([x, y]);
    grid[gridIndex(Math.floor(x / cellSize), Math.floor(y / cellSize))] = [x, y];
  }

  // Generate initial seeds
  if (randomSeed) {
    // Random seed placement for more organic results
    for (let i = 0; i < seedCount; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        if (fits(x, y)) {
          addSample(x, y);
          placed = true;
          break;
        }
      }
      if (!placed && samples.length === 0) {
        // Fallback: place in center if nothing else worked
        addSample(width / 2, height / 2);
      }
    }
  } else {
    // Grid-based seed placement for more uniform coverage
    const seedsPerRow = Math.ceil(Math.sqrt(seedCount));
    const seedsPerCol = Math.ceil(seedCount / seedsPerRow);

    for (let row = 0; row < seedsPerCol; row++) {
      for (let col = 0; col < seedsPerRow; col++) {
        if (samples.length >= seedCount) break;

        const x = (col + 0.5) * (width / seedsPerRow);
        const y = (row + 0.5) * (height / seedsPerCol);

        if (fits(x, y)) {
          addSample(x, y);
        }
      }
      if (samples.length >= seedCount) break;
    }
  }

  // If no seeds were placed, add one in the center
  if (samples.length === 0) {
    addSample(width / 2, height / 2);
  }

  // Main Poisson disk sampling loop using FIFO (queue-like) behavior
  while (active.length > 0) {
    // Take from the front for breadth-first exploration
    const base = active[0];
    let placed = false;

    for (let i = 0; i < maxTries; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Fixed radius sampling for uniform distribution
      const radius = minDistance * Math.sqrt(Math.random() * 3 + 1);

      const px = base[0] + Math.cos(angle) * radius;
      const py = base[1] + Math.sin(angle) * radius;

      if (fits(px, py)) {
        addSample(px, py);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Remove from the front (FIFO)
      active.shift();
    }
  }

  return samples;
}
