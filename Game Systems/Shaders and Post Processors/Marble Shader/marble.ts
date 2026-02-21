export const marbleShader = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform vec4 u_color;
uniform vec4 u_veinColor;
uniform float u_time_ms;
uniform float u_rotationSpeed;
uniform float u_angle;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

// Fractal Brownian Motion — layered noise for organic structure
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    v += noise(p * freq) * amp;
    freq *= 2.13;   // slightly irrational to avoid grid artifacts
    amp *= 0.48;
    // Rotate each octave so layers don't align
    float r = float(i) * 0.37;
    p = mat2(cos(r), -sin(r), sin(r), cos(r)) * p;
  }
  return v;
}

void main() {
  vec2 uv = v_uv - 0.5;

  // Save unrotated uv for lighting — normal should stay fixed
  vec2 uvForLighting = uv;

  float speed = 1.0;
  float angle = u_angle;
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  uv = rot * uv;

  float r = length(uv);
  if (r > 0.5) discard;

  // Use unrotated uv for the sphere normal so lighting stays fixed
  float z = sqrt(max(0.0, 0.25 - r * r));
  vec3 normal = normalize(vec3(uvForLighting, z));
  vec3 lightDir = normalize(vec3(-0.4, 0.6, 1.0));
  float lighting = dot(normal, lightDir) * 0.5 + 0.5;

  vec2 p = uv * u_scale;

  // Seed-derived variation parameters
  float s1 = hash(vec2(u_seed, 1.0));
  float s2 = hash(vec2(u_seed, 2.0));
  float s3 = hash(vec2(u_seed, 3.0));
  float s4 = hash(vec2(u_seed, 4.0));
  float s5 = hash(vec2(u_seed, 5.0));

  // --- Domain warping (this is the key to real swirls) ---
  // Sample fbm twice, offset, use results to warp p before final sample
  vec2 warpOffset = vec2(
    fbm(p + vec2(s1 * 10.0, s2 * 10.0)),
    fbm(p + vec2(s3 * 10.0, s4 * 10.0))
  );

  // Warp strength varies by seed — some marbles are wild, some subtle
  float warpStrength = mix(1.5, 5.0, s5);
  vec2 warped = p + warpStrength * (warpOffset - 0.5);

  // Second warp pass for extra complexity
  vec2 warpOffset2 = vec2(
    fbm(warped + vec2(3.7, 1.3)),
    fbm(warped + vec2(8.1, 5.2))
  );
  float warpStrength2 = mix(0.5, 2.0, hash(vec2(u_seed, 6.0)));
  vec2 finalCoord = warped + warpStrength2 * (warpOffset2 - 0.5);

  // --- Vein generation ---
  // Use fbm on warped coords for the sine input, not just linear projection
  float veinFreq = mix(3.0, 9.0, hash(vec2(u_seed, 7.0)));
  float turbulence = fbm(finalCoord) * 2.0 - 1.0;
  float phase = hash(vec2(u_seed, u_seed + 0.5)) * 6.28;
  float veins = sin(finalCoord.x * veinFreq + turbulence * 8.0 + phase);

  // Add a secondary vein system at a different angle for crossing veins
  float angle2 = s1 * 3.14159;
  vec2 dir2 = vec2(cos(angle2), sin(angle2));
  float veinFreq2 = mix(2.0, 7.0, s2);
  float veins2 = sin(dot(finalCoord, dir2) * veinFreq2 + turbulence * 5.0 + phase * 1.3);

  // Blend two vein systems — weight varies per seed
  float veinBlend = mix(0.0, 0.4, s3);
  float marble = mix(veins, veins2, veinBlend) * 0.5 + 0.5;

  // Variable vein sharpness — thin hairlines to broad bands
  float minEdge = mix(0.06, 0.14, hash(vec2(u_seed, 9.0)));
float maxEdge = mix(0.16, 0.60, hash(vec2(u_seed, 10.0)));
float edgeWidth = mix(minEdge, maxEdge, s4);
  float center = mix(0.3, 0.55, hash(vec2(u_seed, 8.0)));
  marble = smoothstep(center - edgeWidth, center, marble) *
           (1.0 - smoothstep(center, center + edgeWidth, marble));

  // Invert so veins are marks ON the base, not the base itself
  marble = 1.0 - marble;

  // Add subtle color variation in the base using fbm
  float baseVariation = fbm(finalCoord * 0.5) * 0.15;
  vec3 baseColor = u_color.rgb + baseVariation * (u_veinColor.rgb - u_color.rgb);
  vec3 veinColor = u_veinColor.rgb;

  vec3 color = mix(baseColor, veinColor, marble);
  color *= lighting;

  fragColor = vec4(color, 1.0);
fragColor.rgb *= fragColor.a; // premultiply for Excalibur
}
`;
