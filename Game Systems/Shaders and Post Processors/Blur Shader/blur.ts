export const blurShader = `#version 300 es
precision mediump float;

in vec2 v_screenuv;
out vec4 fragColor;

uniform sampler2D u_screen_texture;
uniform sampler2D u_graphic;
uniform vec2 u_resolution;

const float radius = 2.5;
const float darkness = 0.65;

void main() {
    vec2 texel = 1.0 / u_resolution;
    vec2 uv = vec2(v_screenuv.x, 1.0 - v_screenuv.y);
    
    vec4 sum = vec4(0.0);
    float total = 0.0;

    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            vec2 offset = vec2(float(x), float(y)) * texel * radius;
            sum += texture(u_screen_texture, uv + offset);
            //sum += texture(u_graphic, uv + offset); // uncomment to blur graphic instead
            total += 1.0;
        }
    }
    vec4 color = sum / total;

    // darken result
    vec3 darkened = color.rgb * (1.0 - darkness);
    fragColor = vec4(darkened, color.a);
}`;
