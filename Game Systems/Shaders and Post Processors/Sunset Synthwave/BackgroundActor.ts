import * as ex from "excalibur";
// import { NonogramGame } from "../Game";
// import { Resources } from "../Resources";
import { shader } from "../Shaders/shader";

export default class Background extends ex.Actor {
  // private resolutions = new Float32Array([
  //     1920, 1080, 1.0,  // Channel 0
  //     512,  512,  1.0,  // Channel 1
  //     0,    0,    0.0,  // Channel 2 (empty)
  //     0,    0,    0.0   // Channel 3 (empty)
  //     ]);
  private resolutions = new Float32Array([
    0.0,
    0.0,
    0.0, // Channel 0
    0.0,
    0.0,
    0.0, // Channel 1
    0.0,
    0.0,
    0.0, // Channel 2 (empty)
    0.0,
    0.0,
    0.0, // Channel 3 (empty)
  ]);
  private engine: ex.Engine;
  private material: ex.Material;
  // private sprite: ex.Sprite;
  constructor(engine: ex.Engine) {
    super({
      x: 0,
      y: 0,
      width: engine.screen.resolution.width,
      height: engine.screen.resolution.height,
      color: ex.Color.Black,
      anchor: ex.vec(0, 0),
    });
    this.name = "Background";
    this.z = -1;
    this.engine = engine;
    // this.sprite = Resources.transparent.toSprite();
    // this.sprite.destSize.height = this.height;
    // this.sprite.destSize.width = this.width;
    // this.graphics.use(this.sprite);
    this.material = this.engine.graphicsContext.createMaterial({
      name: "BackgroundMaterial",
      fragmentSource: shader, // Resources.anotherSynthwaveSunsetShader.data as string,
      // images: {
      //   iChannel0: Resources.transparent,
      // },
    });
    this.graphics.material = this.material;
  }

  override onPreUpdate(engine: ex.Engine, elapsed: number): void {
    super.onPreUpdate(engine, elapsed);
    this.material.update(shader => {
      let uniforms = shader.getUniformDefinitions();

      if (uniforms.some(u => u.name === "iResolution")) {
        shader.trySetUniformFloatVector("iResolution", ex.vec(engine.screen.resolution.width, engine.screen.resolution.height));
        //shader.trySetUniformFloatVector('iResolution', ex.vec(1024, 1024));
      }
      if (uniforms.some(u => u.name === "iTime")) {
        shader.trySetUniformFloat("iTime", engine.clock.now() / 1000);
      }
      if (uniforms.some(u => u.name === "iChannelResolution")) {
        shader.trySetUniformBuffer("iChannelResolution", this.resolutions);
      }
      if (uniforms.some(u => u.name === "iChannel0")) {
        //shader.try('iChannel0', Resources.transparent.toTexture());
      }
      if (uniforms.some(u => u.name === "iTimeDelta")) {
        shader.trySetUniformFloat("iTimeDelta", elapsed / 1000);
      }
      if (uniforms.some(u => u.name === "iMouse")) {
        shader.trySetUniformFloatVector(
          "iMouse",
          ex.vec(engine.input.pointers.primary.lastScreenPos.x, engine.input.pointers.primary.lastScreenPos.y),
        );
      }
    });
  }
}
