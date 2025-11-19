export function applyCellularAutomataRules(map: number[], width: number, height: number): number[] {
  let newMap = new Array(width * height).fill(0);

  for (let i = 0; i < height * width; i++) {
    const wallCount = countAdjacentWalls(map, width, height, i);
    if (map[i] === 1) {
      if (wallCount < 4) {
        newMap[i] = 0; // Change to floor if there are less than 4 adjacent walls
      } else {
        newMap[i] = 1; // Remain wall
      }
    } else {
      if (wallCount >= 5) {
        newMap[i] = 1; // Change to wall if there are 5 or more adjacent walls
      } else {
        newMap[i] = 0; // Remain floor
      }
    }
  }
  return newMap;
}

function countAdjacentWalls(map: number[], width: number, height: number, index: number): number {
  let count = 0;

  const y = Math.floor(index / width);
  const x = index % width;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;

      const newY = y + i;
      const newX = x + j;
      if (newY >= 0 && newY < height && newX >= 0 && newX < width) {
        const adjacentIndex = newY * width + newX;
        if (map[adjacentIndex] === 1) count++;
      } else {
        count++; // Perceive out of bounds as wall
      }
    }
  }
  return count;
}
