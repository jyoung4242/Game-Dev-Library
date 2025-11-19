import { Sprite, TileMap, TileMapOptions, Vector } from "excalibur";

export interface mapConfigOptions {
  levelData: string;
  tilesize: Vector;
  mapsize: Vector;
  mapPosition: Vector;
}

export class LevelEditor {
  constructor() {}

  createLevel(
    mapOptions: Record<string, mapConfigOptions>,
    sprites: Record<string, { sprite: Sprite | null; solid: boolean }>
  ): TileMap[] {
    let mapArray: TileMap[] = [];

    let incomingDataArray = Object.values(mapOptions);

    incomingDataArray.forEach((data: mapConfigOptions) => {
      let { levelData, tilesize, mapsize, mapPosition } = data;
      let parsedMap = parseAsciiMap(levelData);
      let options: TileMapOptions = {
        pos: mapPosition.clone(),
        tileWidth: tilesize.x,
        tileHeight: tilesize.y,
        columns: mapsize.x,
        rows: mapsize.y,
      };
      let map = new TileMap(options);

      let tileIndex = 0;
      for (const tile of map.tiles) {
        let char = getCharAt(parsedMap, tileIndex % options.columns, Math.floor(tileIndex / options.columns));

        let charcode = char ? char.charCodeAt(0) : 0;
        //debugger;
        if (charcode != 32 && char) {
          tile.addGraphic(sprites[char].sprite as Sprite);
          tile.solid = sprites[char].solid;
        }
        tileIndex++;
      }
      console.log(map);

      mapArray.push(map);
    });

    return mapArray;
  }
}

function parseAsciiMap(mapString: string): string[][] {
  if (mapString.startsWith("\n")) {
    mapString = mapString.slice(1);
  }

  return mapString

    .split("\n") // Split into lines
    .map(line => line.split("")); // Convert each line into an array of characters
}

function getCharAt(map: string[][], x: number, y: number): string | null {
  if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) {
    return null; // Return null if out of bounds
  }
  return map[y][x];
}
