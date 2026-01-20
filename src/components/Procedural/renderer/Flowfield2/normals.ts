import commonWgsl from "./common.wgsl?raw";

export function setupNormalsResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer,
  srcTexture: GPUTexture,
  srcSampler: GPUSampler
) {
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
  let n = normalize(vec3f(-dx, -dy, 1.0));
  return vec4f(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0);
}
`;

  const module = device.createShaderModule({ code: `${commonWgsl}\n${normalsWgsl}` });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vsNorm" },
    fragment: { module, entryPoint: "fsNorm", targets: [{ format: presentationFormat }] },
    primitive: { topology: "triangle-list" },
  });

  const normalsTexture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: srcSampler },
      { binding: 2, resource: srcTexture.createView() },
    ],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.5, 0.5, 1.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "normals renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    pipeline,
    bindGroup,
    normalsTexture,
    renderPassDescriptor,
    width,
    height,
  };
}

export function renderNormalsToTexture(
  encoder: GPUCommandEncoder,
  normals: {
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    normalsTexture: GPUTexture;
    renderPassDescriptor: GPURenderPassDescriptor;
  }
) {
  const view = normals.normalsTexture.createView();
  (normals.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = view;
  const pass = encoder.beginRenderPass(normals.renderPassDescriptor);
  pass.setPipeline(normals.pipeline);
  pass.setBindGroup(0, normals.bindGroup);
  pass.draw(6);
  pass.end();
}
