import { Engine, Material } from "excalibur";

export function createGleamMaterial(eng: Engine): Material {
  let mat = eng.graphicsContext.createMaterial({
    fragmentSource: gleamShader,
  });
  return mat;
}

const gleamShader = `#version 300 es
precision mediump float;

in vec2 v_uv;
uniform sampler2D u_graphic;
uniform float u_opacity;
uniform float u_time_ms;
uniform float u_glint_speed;      // Speed of travel (e.g., 1.0 = normal)
uniform float u_glint_trigger;    // Set this to current time to trigger a glint

out vec4 color;

void main() {
  // Base texture
  vec4 tex = texture(u_graphic, v_uv);
  
  // Early exit for transparent pixels
  if (tex.a <= 0.0) {
    color = vec4(0.0);
    return;
  }
  
  float alpha = tex.a * u_opacity;
  vec3 baseColor = tex.rgb;
  
  // ---- TRAVELING GLINT ----
  float time_sec = u_time_ms / 1000.0;
  
  // Time since glint was triggered
  float timeSinceTrigger = time_sec - u_glint_trigger;
  
  // Only show glint if we're within the animation duration
  float glintDuration = 2.0; // How long the glint takes to complete
  float glint = 0.0;
  
  if (timeSinceTrigger >= 0.0 && timeSinceTrigger < glintDuration) {
    // Progress from 0 to 1 over the duration
    float progress = timeSinceTrigger / glintDuration;
    float sweep = progress * u_glint_speed;
    
    // Project UV onto diagonal line
    float diagonal = (v_uv.x + v_uv.y) * 0.5;
    
    // Distance from sweep position
    float dist = abs(diagonal - sweep);
    
    // Create narrow bright band
    float glintWidth = 0.15;
    glint = smoothstep(glintWidth, 0.0, dist);
  }
  
  // Add glint to base color
  vec3 finalColor = baseColor + vec3(glint * 0.8);
  
  color = vec4(finalColor, alpha);
}
`;
