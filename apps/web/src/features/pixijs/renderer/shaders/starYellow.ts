import { Filter, GlProgram, GpuProgram, UniformGroup } from "pixi.js";

const STAR_YELLOW_FRAGMENT = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;

void main() {
  vec2 uv = vTextureCoord;
  float bands = sin(uv.y * 26.0 + uTime * 2.1) + sin(uv.y * 11.0 - uTime * 1.4);
  float ripples = sin(uv.x * 19.0 - uTime * 1.7);
  vec2 shimmer = vec2(bands, ripples) * 0.0014;
  vec4 color = texture(uTexture, uv + shimmer);

  // The change is strongest in the warm, semi-transparent flame—not the solid core.
  float flame = smoothstep(0.08, 0.8, color.r - color.b);
  float pulse = 0.965 + 0.035 * sin(uTime * 2.4 + uv.y * 9.0 + uv.x * 4.0);
  color.rgb *= mix(1.0, pulse, flame);
  finalColor = color;
}`;

const STAR_YELLOW_WGSL = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

struct StarUniforms { uTime: f32, };

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> starUniforms: StarUniforms;

struct VSOutput { @builtin(position) position: vec4<f32>, @location(0) uv: vec2<f32>, };

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32> {
  var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
  position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32> {
  return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
  return VSOutput(filterVertexPosition(aPosition), filterTextureCoord(aPosition));
}

@fragment
fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let bands = sin(uv.y * 26.0 + starUniforms.uTime * 2.1) + sin(uv.y * 11.0 - starUniforms.uTime * 1.4);
  let ripples = sin(uv.x * 19.0 - starUniforms.uTime * 1.7);
  let shimmer = vec2<f32>(bands, ripples) * 0.0014;
  var color = textureSample(uTexture, uSampler, uv + shimmer);
  let flame = smoothstep(0.08, 0.8, color.r - color.b);
  let pulse = 0.965 + 0.035 * sin(starUniforms.uTime * 2.4 + uv.y * 9.0 + uv.x * 4.0);
  color.rgb *= mix(1.0, pulse, flame);
  return color;
}`;

const STAR_YELLOW_VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}`;

/** A restrained animated filter for the painted star texture. */
export function createStarYellowFilter(): Filter {
  return new Filter({
    glProgram: GlProgram.from({
      name: "star-yellow-alive",
      vertex: STAR_YELLOW_VERTEX,
      fragment: STAR_YELLOW_FRAGMENT,
    }),
    gpuProgram: GpuProgram.from({
      vertex: { source: STAR_YELLOW_WGSL, entryPoint: "mainVertex" },
      fragment: { source: STAR_YELLOW_WGSL, entryPoint: "mainFragment" },
    }),
    resources: {
      starUniforms: new UniformGroup({
        uTime: { value: 0, type: "f32" },
      }),
    },
  });
}

export function setStarYellowFilterTime(filter: Filter, elapsedMs: number) {
  filter.resources.starUniforms.uniforms.uTime = elapsedMs / 1000;
}
