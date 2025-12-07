import {Actor, Engine, Shader} from "excalibur";
import { createGleamMaterial } from "./gleamMaterial";

class GleamActor extends Actor {
  private lastGlintTime = 0;
  private glintInterval = 5000; // milliseconds between glints
  constructor() {
    super({
      x: 0,
      y: 0,
      width: 48,
      height: 48,
    });
    ... // set your sprite graphic
  }

  onInitialize(engine: Engine): void {

    // call the setup function to create and assign the gleam material
    this.graphics.material = createGleamMaterial(engine);
    
    // Initialize glint parameters
    this.graphics.material?.update((s: Shader) => {
      s.trySetUniformFloat("u_glint_speed", 2.0);
      s.trySetUniformFloat("u_glint_trigger", -999.0); // Start with no glint
    });
  }

  onPreUpdate(engine: Engine): void {
    const currentTime = engine.clock.now();

    // Trigger glint at intervals
    if (currentTime - this.lastGlintTime > this.glintInterval) {
      this.lastGlintTime = currentTime;

      this.graphics.material?.update((s: Shader) => {
        s.trySetUniformFloat("u_glint_trigger", currentTime / 1000.0);
      });
    }
  }

  public triggerGlint(engine: Engine): void {
    const currentTime = engine.clock.now();
    this.graphics.material?.update((s: Shader) => {
      s.trySetUniformFloat("u_glint_trigger", currentTime / 1000.0);
    });
  }
}