import commonWgsl from "./wgsl/common.wgsl?raw";
import computeWgsl from "../Flowfield/wgsl/compute.wgsl?raw";
import particleWgslRaw from "../Flowfield/wgsl/particle.wgsl?raw";

const workgroupSize = 64;
const particleCount = 5000;
const config = {
  particleCount,
  particlePixelSize: 5.0,
  workgroups: Math.ceil(particleCount / workgroupSize),
  eps: 0.25,
  particleSpeed: 2.5,
};

export function setupParticleResources(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  dataBuffer: GPUBuffer
) {
  // create particle-specific buffers here
  const particleBufferSize = config.particleCount * 3 * 4;
  const particleBufferA = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const particleBufferB = device.createBuffer({
    size: particleBufferSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  const paramsBuffer = device.createBuffer({
    size: 5 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const wgsl = `${commonWgsl}\n${computeWgsl.replace(
    /\$\{particleCount\}i/g,
    `${config.particleCount}i`
  )}`;
  const computeModule = device.createShaderModule({ code: wgsl });
  const compute = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs" },
  });
  const computeInit = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "init" },
  });

  const particleWgsl = `${commonWgsl}\n${particleWgslRaw.replace(
    /\$\{particlePixelSize\}/g,
    `${config.particlePixelSize}`
  )}`;
  const particleModule = device.createShaderModule({ code: particleWgsl });
  const particle = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: particleModule, entryPoint: "vs", buffers: [] },
    fragment: {
      module: particleModule,
      entryPoint: "fs",
      targets: [
        {
          format: presentationFormat,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
    multisample: { count: 1 },
  });

  const computeA = device.createBindGroup({
    layout: compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
      { binding: 2, resource: { buffer: particleBufferB } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });
  const computeB = device.createBindGroup({
    layout: compute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
      { binding: 2, resource: { buffer: particleBufferA } },
      { binding: 3, resource: { buffer: paramsBuffer } },
    ],
  });

  const computeInitBindGroup = device.createBindGroup({
    layout: computeInit.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 2, resource: { buffer: particleBufferA } },
    ],
  });

  const particleRenderA = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferB } },
    ],
  });
  const particleRenderB = device.createBindGroup({
    layout: particle.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dataBuffer } },
      { binding: 1, resource: { buffer: particleBufferA } },
    ],
  });

  return {
    config,
    pipelines: { compute, computeInit, particle },
    bindGroups: {
      computeA,
      computeB,
      computeInitBindGroup,
      particleRenderA,
      particleRenderB,
    },
    buffers: { particleBufferA, particleBufferB, paramsBuffer },
  };
}

export function updateParticles(
  device: GPUDevice,
  encoder: GPUCommandEncoder,
  particle: {
    pipelines: any;
    bindGroups: any;
    buffers: {
      particleBufferA: GPUBuffer;
      particleBufferB: GPUBuffer;
      paramsBuffer: GPUBuffer;
    };
    config: {
      particleCount: number;
      eps: any;
      particleSpeed: number;
      workgroups: number;
    };
  },
  deltaTime: number,
  rotateState: number,
  sharedData: {
    width?: number;
    height?: number;
    seed?: number;
    scale?: number;
    x?: number;
    y?: number;
    z?: number;
    zoom?: number;
    rotate: any;
    rotation?: number;
    asBuffer: any;
  },
  dataBuffer: GPUBuffer,
  ping: boolean
) {
  // write compute params: dt, speed, eps, maxStep, rotateAngle
  const maxStep = config.eps * 0.6;
  // accept either numeric `rotation` (radians) or boolean `rotate` (90deg toggle)
  if (typeof sharedData?.rotation === "number") {
    // invert sign so positive rotation in the UI rotates the field the intuitive way
    rotateState = -sharedData.rotation;
  } else if (typeof sharedData?.rotate !== "undefined") {
    // boolean 90deg toggle: true -> -90deg to match UI expectation
    rotateState = sharedData.rotate ? -Math.PI / 2.0 : 0.0;
  }
  // ensure the uniform shared data exposes the same rotate value for fragment shaders
  sharedData.rotate = rotateState;
  // write sharedData again so fragment pipelines/readers see the updated rotation this frame
  device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
  const paramsArray = new Float32Array([
    deltaTime,
    config.particleSpeed,
    config.eps,
    maxStep,
    rotateState,
  ]);
  device.queue.writeBuffer(
    particle.buffers.paramsBuffer,
    0,
    paramsArray.buffer,
    paramsArray.byteOffset,
    paramsArray.byteLength
  );

  const computePass = encoder.beginComputePass();
  computePass.setPipeline(particle.pipelines.compute);
  computePass.setBindGroup(
    0,
    ping ? particle.bindGroups.computeA : particle.bindGroups.computeB
  );
  computePass.dispatchWorkgroups(config.workgroups);
  computePass.end();
}

export function renderParticlesIntoPass(
  pass: GPURenderPassEncoder,
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
  // draw particles additively (semi-transparent) onto accumulation

  pass.setPipeline(particle.pipelines.particle);
  pass.setBindGroup(
    0,
    ping
      ? particle.bindGroups.particleRenderA
      : particle.bindGroups.particleRenderB
  );
  pass.draw(6, particle.config.particleCount);
}
