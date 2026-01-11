export const shader = `version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time_ms;
uniform float u_opacity;
uniform vec2 u_graphic_resolution;
uniform vec2 u_resolution;
uniform vec2 u_size;
uniform vec4 u_color;
uniform mat4 u_matrix;
uniform mat4 u_transform;
uniform sampler2D u_graphic;
uniform sampler2D u_screen_texture;

void main(void) {
    fragColor = texture(u_graphic, v_uv);
}
`;
