import commonWgsl from "./common.wgsl?raw";
export function setupCompositeResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer,
  background: {
    texture: GPUTexture;
  }
) {
  const blitWgsl = /* wgsl */ `
    @group(0) @binding(1) var samp2: sampler;
    @group(0) @binding(2) var bgTex: texture_2d<f32>;

    @vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment fn fsBlit(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
      let uv = coord.xy / vec2f(data.width, data.height);
      return textureSample(bgTex, samp2, uv);
    }
`;

  const blitModule = device.createShaderModule({
    code: `${commonWgsl}\n${blitWgsl}`,
  });
  const blitPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: blitModule, entryPoint: "vsBlit" },
    fragment: {
      module: blitModule,
      entryPoint: "fsBlit",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const blitBindGroup = device.createBindGroup({
    layout: blitPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: background.texture.createView() },
    ],
  });

  return {
    sampler,
    blitPipeline,
    blitBindGroup,
  };
}
export function renderComposite(
  encoder: GPUCommandEncoder,
  context: GPUCanvasContext,
  composite: {
    blitPipeline: GPURenderPipeline;
    blitBindGroup: GPUBindGroup;
  }
) {
  const swapView = context.getCurrentTexture().createView();
  const compDesc: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: swapView,
        loadOp: "clear",
        storeOp: "store",
        clearValue: [0, 0, 0, 1],
      },
    ],
  };
  const compPass = encoder.beginRenderPass(compDesc);
  compPass.setPipeline(composite.blitPipeline);
  compPass.setBindGroup(0, composite.blitBindGroup);
  compPass.draw(6);
  compPass.end();
}
