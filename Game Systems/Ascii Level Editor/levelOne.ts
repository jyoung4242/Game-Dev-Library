import { vec } from "excalibur";
import { mapConfigOptions } from "../Lib/LevelEditor";
import { Resources } from "../resources";

export let levelsprites = {
  "#": { sprite: Resources.block.toSprite(), solid: true },
};

let mapString1 = `
#                    
#                    
#                    
#                     
#            ###     
#                    
#####################
`;

let mapString2 = `
                   #
                   #
                   #
                   #
                   #
                   #
       #           #
####################
`;

export const level1: Record<string, mapConfigOptions> = {};
level1[1] = { levelData: mapString1, tilesize: vec(20, 15), mapsize: vec(21, 7), mapPosition: vec(0, 15) };
level1[2] = { levelData: mapString2, tilesize: vec(20, 15), mapsize: vec(20, 8), mapPosition: vec(20 * 21, 0) };
