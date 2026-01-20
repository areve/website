import noiseWgsl from "./noise.wgsl?raw";
import openSimplex3dWgsl from "./openSimplex3d.wgsl?raw";
import commonWgsl from "./common.wgsl?raw";
import backgroundWgsl from "./background.wgsl?raw";

const config = {
  showBackgroundShader: true,
};

export function setupBackgroundResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
) {
  const module = device.createShaderModule({
    label: "background shader",
    code: `
      ${commonWgsl}
      ${noiseWgsl}
      ${openSimplex3dWgsl}
      ${backgroundWgsl}`,
  });

  const pipeline = device.createRenderPipeline({
    label: "background pipeline",
    layout: "auto",
    vertex: { module },
    fragment: { module, targets: [{ format: presentationFormat }] },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });


  // Normals pipeline: compute normals from background (height) texture
  const normalsWgsl = `
@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;

@vertex fn vsNorm(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

fn sampleHeight(uv: vec2<f32>) -> f32 {
  return textureSample(bgTex, samp2, uv).r;
}

@fragment fn fsNorm(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let px = vec2f(1.0 / data.width, 1.0 / data.height);
  let hL = sampleHeight(uv - vec2f(px.x, 0.0));
  let hR = sampleHeight(uv + vec2f(px.x, 0.0));
  let hD = sampleHeight(uv - vec2f(0.0, px.y));
  let hU = sampleHeight(uv + vec2f(0.0, px.y));
  let dx = hR - hL;
  let dy = hU - hD;
  // normal in view-space: (-dx, -dy, 1)
  let n = normalize(vec3f(-dx, -dy, 1.0));
  // encode to 0..1
  return vec4f(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0);
}
`;

  const normalsModule = device.createShaderModule({ code: `${commonWgsl}\n${normalsWgsl}` });
  const normalsPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: normalsModule, entryPoint: "vsNorm" },
    fragment: { module: normalsModule, entryPoint: "fsNorm", targets: [{ format: presentationFormat }] },
    primitive: { topology: "triangle-list" },
  });
  // create the background render target and sampler before creating bind groups
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

  const normalsBindGroup = device.createBindGroup({
    layout: normalsPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: texture.createView() },
    ],
  });
  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "background renderPass",
    colorAttachments: [colorAttachment],
  };
  // create a normals texture (initially copy of background)
  const normalsTexture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC,
  });

  return {
    pipeline,
    bindGroup,
    texture,
    normalsPipeline,
    normalsBindGroup,
    normalsTexture,
    colorAttachment,
    renderPassDescriptor,
    width,
    height,
  };
}

export function renderBackgroundToTexture(
  encoder: GPUCommandEncoder,
  background: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;
    renderPassDescriptor: GPURenderPassDescriptor;
    normalsTexture?: GPUTexture;
    width: number;
    height: number;
  }
) {
  const backgroundView = background.texture.createView();
  (
    background.renderPassDescriptor
      .colorAttachments as GPURenderPassColorAttachment[]
  )[0].view = backgroundView;
  const pass = encoder.beginRenderPass(background.renderPassDescriptor);
  pass.setPipeline(background.pipeline);
  pass.setBindGroup(0, background.bindGroup);
  pass.draw(6);
  pass.end();
}

export function renderNormalsToTexture(
  encoder: GPUCommandEncoder,
  background: {
    normalsTexture: GPUTexture;
    normalsPipeline: GPURenderPipeline;
    normalsBindGroup: GPUBindGroup;
    renderPassDescriptor: GPURenderPassDescriptor;
    width: number;
    height: number;
  }
) {
  const view = background.normalsTexture.createView();
  (background.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = view;
  const pass = encoder.beginRenderPass(background.renderPassDescriptor);
  pass.setPipeline(background.normalsPipeline);
  pass.setBindGroup(0, background.normalsBindGroup);
  pass.draw(6);
  pass.end();
}

