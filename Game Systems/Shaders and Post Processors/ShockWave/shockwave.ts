import { PostProcessor, Scene, ScreenShader, Shader, vec, Vector, VertexLayout } from "excalibur";

const shockwaveShader = `#version 300 es
    precision mediump float;

    // our texture
    uniform sampler2D u_image;
    // the texCoords passed in from the vertex shader.
    in vec2 v_uv;
    out vec4 fragColor;

    // uniform arrays
    uniform float u_t[20];
    uniform float u_centerX[20];
    uniform float u_centerY[20];
    uniform float u_maxRadius[20];
    uniform float u_thickness[20];

    //fixed uniforms
    uniform vec2 u_aspectRatio;
    uniform int u_numShockwaves;

    float getOffsetStrength(float t, vec2 dir, float maxRadius, float thickness) {
      float dist = length(dir/u_aspectRatio) - t * maxRadius;
      dist *= 1.0 - smoothstep(0.0, thickness, abs(dist));

      dist *= smoothstep(0.0, 0.05, t);  // early fade
      dist *= 1.0 - smoothstep(0.5, 1., t); // late fade
      return dist;
    }
    
    void main() {
      vec2 totalDir = vec2(0.0);
      vec3 totalOffsets = vec3(0.0);

      

      for (int i = 0; i < u_numShockwaves; i++) {
        vec2 center = vec2(u_centerX[i], 1.0 - u_centerY[i]);  //invert y
        vec2 dir = center - v_uv;
        float rD = getOffsetStrength(u_t[i]+0.02, dir, u_maxRadius[i], u_thickness[i]);
        float gD = getOffsetStrength(u_t[i], dir, u_maxRadius[i], u_thickness[i]);
        float bD = getOffsetStrength(u_t[i]-0.02, dir, u_maxRadius[i], u_thickness[i]);
        dir = normalize(dir);
        totalDir += dir;
        totalOffsets += vec3(rD, gD, bD);
      }

      float r = texture(u_image, v_uv + totalDir * totalOffsets.r).r; 
      float g = texture(u_image, v_uv + totalDir * totalOffsets.g).g;
      float b = texture(u_image, v_uv + totalDir * totalOffsets.b).b;
      
      float shading = totalOffsets.g * 8.0;
      fragColor += vec4(r, g, b, 1.0);
      fragColor.rgb += shading;
    }
`;

type ShockWave = {
  t: number;
  speed: number;
  maxRadius: number;
  duration: number;
  location: Vector;
  thickness: number;
};

const MAX_SHOCKWAVES = 20;

export class ShockWavePostProcessor implements PostProcessor {
  private _shader: ScreenShader | null = null;
  private _pos: Vector | null = vec(0.5, 0.5);
  private _t: number = 0;
  private _speed: number = 10;
  private _maxRadius: number = 0.5;
  private _scene: Scene | null = null;
  private _duration: number = 0; // in milliseconds

  private _shockwaves: ShockWave[] = [];

  initialize(gl: WebGL2RenderingContext): void {
    this._shader = new ScreenShader(gl, shockwaveShader);
  }

  init(scene: Scene) {
    this._scene = scene;
  }

  getLayout(): VertexLayout {
    return this._shader!.getLayout();
  }

  getShader(): Shader {
    return this._shader!.getShader();
  }

  triggerShockWave(location: Vector, duration: number, speed: number, u_maxRadius: number, thickness: number): void {
    this._pos = location;
    this._speed = speed;
    this._t = 0;
    this._duration = duration;
    this._maxRadius = u_maxRadius;

    this._shockwaves.push({
      t: 0,
      speed: speed,
      maxRadius: u_maxRadius,
      duration: duration,
      location: location,
      thickness: thickness,
    });
  }

  onUpdate(elapsed: number): void {
    if (!this._scene) {
      return;
    }

    // setup uniform arrays
    let tArray: number[] = [];
    let maxRadiusArray: number[] = [];
    let locationArrayX: number[] = [];
    let locationArrayY: number[] = [];
    let thicknessArray: number[] = [];

    if (this._shockwaves.length > MAX_SHOCKWAVES) {
      this._shockwaves = this._shockwaves.slice(-MAX_SHOCKWAVES);
    }

    for (const swave of this._shockwaves) {
      // iterate through the shockwaves
      // and update their t value
      swave.t += swave.speed / swave.duration;

      if (swave.t > 1 || swave.duration === 0) {
        // remove the shockwave
        this._shockwaves.splice(this._shockwaves.indexOf(swave), 1);
      } else {
        tArray.push(Math.pow(swave.t, 1 / 1.5));
        maxRadiusArray.push(swave.maxRadius);
        locationArrayX.push(swave.location.x);
        locationArrayY.push(swave.location.y);
        thicknessArray.push(swave.thickness);
      }
    }

    this._t += this._speed / this._duration;

    if (this._t > 1 || this._duration === 0) {
      this._t = 1;
    }

    let myShader = this.getShader();
    let screenWidth = this._scene?.engine.screen.width;
    let screenHeight = this._scene?.engine.screen.height;
    let aRatio = vec(1.0, screenWidth! / screenHeight!);
    let numShockwaves = this._shockwaves.length;

    if (myShader) {
      if (tArray.length === 0) {
        return;
      }

      myShader.trySetUniformInt("u_numShockwaves", numShockwaves);
      myShader.trySetUniformFloatVector("u_aspectRatio", aRatio);
      myShader.trySetUniformFloatArray("u_t", tArray);
      myShader.trySetUniformFloatArray("u_maxRadius", maxRadiusArray);
      myShader.trySetUniformFloatArray("u_centerX", locationArrayX);
      myShader.trySetUniformFloatArray("u_centerY", locationArrayY);
      myShader.trySetUniformFloatArray("u_thickness", thicknessArray);
    }
  }
}
