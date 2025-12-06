import { ExcaliburGraphicsContextWebGL, PostProcessor, ScreenShader, Shader, VertexLayout } from "excalibur";

const shader = `#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_uv;
out vec4 fragColor;

// CRT Parameters
const float SCANLINE_INTENSITY = 0.15;
const float CURVATURE = 4.0; // Higher = less curve
const float VIGNETTE_INTENSITY = 0.3;
const float CHROMATIC_ABERRATION = 0.001;
const float BRIGHTNESS = 1.05;
const float FLICKER_AMOUNT = 0.01;

// Apply barrel distortion to simulate curved CRT screen
vec2 curveScreen(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = uv.xy / CURVATURE;
    uv += uv * (offset.x * offset.x + offset.y * offset.y);
    uv = uv * 0.5 + 0.5;
    return uv;
}

// Scanline effect
float scanline(vec2 uv) {
    float line = sin(uv.y * u_resolution.y * 2.0);
    return 1.0 - SCANLINE_INTENSITY + line * SCANLINE_INTENSITY;
}

// Vignette effect
float vignette(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    return 1.0 - dot(uv, uv) * VIGNETTE_INTENSITY;
}

// Random flicker
float flicker(float time) {
    return 1.0 - FLICKER_AMOUNT + FLICKER_AMOUNT * sin(time * 100.0);
}

void main() {
    vec2 uv = v_uv;
    
    // Apply CRT curvature
    vec2 curvedUV = curveScreen(uv);
    
    // Check if we're outside the curved screen bounds
    if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Chromatic aberration (RGB color separation)
    float r = texture(u_image, curvedUV + vec2(CHROMATIC_ABERRATION, 0.0)).r;
    float g = texture(u_image, curvedUV).g;
    float b = texture(u_image, curvedUV - vec2(CHROMATIC_ABERRATION, 0.0)).b;
    
    vec3 color = vec3(r, g, b);
    
    // Apply scanlines
    color *= scanline(curvedUV);
    
    // Apply vignette
    color *= vignette(curvedUV);
    
    // Apply brightness and flicker
    color *= BRIGHTNESS * flicker(u_time);
    
    fragColor = vec4(color, 1.0);
}`;

export class CRTPostProcessor implements PostProcessor {
  private _shader!: ScreenShader;

  initialize(gl: ExcaliburGraphicsContextWebGL): void {
    this._shader = new ScreenShader(gl, shader);
  }

  getLayout(): VertexLayout {
    return this._shader.getLayout();
  }

  getShader(): Shader {
    return this._shader.getShader();
  }
}

// Usage example:
// const game = new Engine({...});
// game.graphicsContext.addPostProcessor(new CRTPostProcessor());
