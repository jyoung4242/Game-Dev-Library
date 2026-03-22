import { SpriteSheet, Animation, AnimationStrategy } from "excalibur";
import { Resources } from "../resources";

// Create spritesheet using grid-based parsing
const spriteSheet = SpriteSheet.fromImageSource({
  image: Resources.boom,
  grid: {
    rows: 1,
    columns: 10,
    spriteWidth: 64,
    spriteHeight: 64,
  },
});

// Frame graphics (with optional per-frame flipping)

const Animation1_Frame0Graphic = spriteSheet.sprites[0];
const Animation1_Frame1Graphic = spriteSheet.sprites[1];
const Animation1_Frame2Graphic = spriteSheet.sprites[2];
const Animation1_Frame3Graphic = spriteSheet.sprites[3];
const Animation1_Frame4Graphic = spriteSheet.sprites[4];
const Animation1_Frame5Graphic = spriteSheet.sprites[5];
const Animation1_Frame6Graphic = spriteSheet.sprites[6];
const Animation1_Frame7Graphic = spriteSheet.sprites[7];
const Animation1_Frame8Graphic = spriteSheet.sprites[8];
const Animation1_Frame9Graphic = spriteSheet.sprites[9];

// Animation definitions

const Animation1Base = new Animation({
  frames: [
    { graphic: Animation1_Frame0Graphic, duration: 40 },
    { graphic: Animation1_Frame1Graphic, duration: 40 },
    { graphic: Animation1_Frame2Graphic, duration: 40 },
    { graphic: Animation1_Frame3Graphic, duration: 40 },
    { graphic: Animation1_Frame4Graphic, duration: 40 },
    { graphic: Animation1_Frame5Graphic, duration: 40 },
    { graphic: Animation1_Frame6Graphic, duration: 40 },
    { graphic: Animation1_Frame7Graphic, duration: 40 },
    { graphic: Animation1_Frame8Graphic, duration: 40 },
    { graphic: Animation1_Frame9Graphic, duration: 40 },
  ],
  strategy: AnimationStrategy.End,
});

const Animation1 = Animation1Base;

export const PlayerAnimations = {
  Animation1,
};
