import { Actor, Color, Engine, Material, Shader } from "excalibur";
import wipeFragShader from "./Wipe";

class WipeActor extends Actor {
    
  mat: Material | null = null;
  progress: number = 0.5; // 0.0 to 1.0
  mode: number = 0; // 0=hide, 1=show
  direction: number = 3; // 0=left,1=right,2=up,3=down

  constructor() {
    super({
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      color: Color.Transparent,
    });
    this.graphics.use(...);  // your sprite
  }

  onInitialize(engine: Engine): void {
    this.mat = engine.graphicsContext.createMaterial({
      fragmentSource: wipeFragShader,
    });
    this.graphics.material = this.mat;
  }

  onPreUpdate(): void {
    if (this.mat) {
      this.mat.update((s: Shader) => {
        s.trySetUniformFloat("u_progress", this.progress);
        s.trySetUniformInt("u_direction", this.direction);
        s.trySetUniformInt("u_mode", this.mode);
      });
    }
  }
}
