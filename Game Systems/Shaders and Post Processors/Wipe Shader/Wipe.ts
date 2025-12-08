// Fragment shader source
export const wipeFragShader = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragcolor;

//Excalibur built-in uniforms
uniform sampler2D u_graphic;

//Custom uniforms
uniform float u_progress;
uniform int u_direction;
uniform int u_mode;

void main() {
    vec4 texColor = texture(u_graphic, v_uv);
    
    float position;
    
    if (u_direction == 0) {
        position = v_uv.x;
    } else if (u_direction == 1) {
        position = 1.0 - v_uv.x;
    } else if (u_direction == 2) {
        position = v_uv.y;
    } else {
        position = 1.0 - v_uv.y;
    }
    
    if(u_progress >= 0.95  && u_mode == 0) {
        fragcolor = texColor;
        return;
    } else if(u_progress <= 0.05 && u_mode == 1) {
        fragcolor = texColor;
        return;
    }
    if(u_progress <= 0.05 && u_mode == 0) {
        fragcolor = vec4(0.0);
        return;
    } else if(u_progress >= 0.95 && u_mode == 1) {
        fragcolor = vec4(0.0);
        return;
    }

    float effectiveProgress = u_mode == 1 ? u_progress : 1.0 - u_progress;
    float edgeWidth = 0.1;
    
    float alpha = smoothstep(
        effectiveProgress - edgeWidth,
        effectiveProgress + edgeWidth,
        position
    );
    
    float finalAlpha = texColor.a * alpha;
    fragcolor = vec4(texColor.rgb * finalAlpha, finalAlpha);
}`;
