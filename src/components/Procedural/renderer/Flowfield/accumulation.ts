import commonWgsl from "./wgsl/common.wgsl?raw";
import accumulationFadeWgsl from "./wgsl/accumulationFade.wgsl?raw";
import { clearTextureToBlack } from "./texture";
import { renderParticlesIntoPass } from "./particle";

export function setupAccumulationResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
) {
  const textureA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const textureB = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: presentationFormat,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear",
  });

  const wgsl = `${commonWgsl}\n${accumulationFadeWgsl}`;
  const fadeModule = device.createShaderModule({ code: wgsl });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: fadeModule, entryPoint: "vs2" },
    fragment: {
      module: fadeModule,
      entryPoint: "fs2",
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupA = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textureA.createView() },
    ],
  });
  const bindGroupB = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textureB.createView() },
    ],
  });

  clearTextureToBlack(device, textureA);

  return {
    pipeline,
    textureA,
    textureB,
    sampler,
    bindGroupA,
    bindGroupB,
  };
}

export function updateAccumulation(
  encoder: GPUCommandEncoder,
  accumulation: {
    pipeline: GPURenderPipeline;
    textureA: GPUTexture;
    textureB: GPUTexture;
    bindGroupA: GPUBindGroup;
    bindGroupB: GPUBindGroup;
  },
  particle: {
    pipelines: { particle: GPURenderPipeline };
    bindGroups: {
      particleRenderA: GPUBindGroup;
      particleRenderB: GPUBindGroup;
    };
    config: { particleCount: number };
  },
  ping: boolean
) {
  // --- Accumulation pass: fade previous accumulation into target and draw particles onto it ---
  // choose which acc textures are src/dst based on accPing
  const accumulationDstView = ping
    ? accumulation.textureB.createView()
    : accumulation.textureA.createView();
  const accumulationPassDesc: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: accumulationDstView,
        clearValue: [0, 0, 0, 0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  const pass = encoder.beginRenderPass(accumulationPassDesc);
  // fade previous accumulation into dst
  pass.setPipeline(accumulation.pipeline);
  pass.setBindGroup(
    0,
    ping ? accumulation.bindGroupA : accumulation.bindGroupB
  );
  pass.draw(6);

  renderParticlesIntoPass(pass, particle, ping);
  pass.end();
}
