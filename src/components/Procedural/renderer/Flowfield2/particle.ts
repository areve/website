import commonWgsl from "./common.wgsl?raw";

// console.log(particleWgsl)
const NUM_PARTICLES = 256;

export function setupParticleResources(
  device: GPUDevice,
  width: number,
  height: number,
  dataBuffer: GPUBuffer
) {
  // create offscreen texture for particles
  const texture = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  // place particles on a grid across the viewport
  const positions = new Float32Array(NUM_PARTICLES * 2);
  const cols = Math.ceil(Math.sqrt(NUM_PARTICLES));
  const rows = Math.ceil(NUM_PARTICLES / cols);
  const spacingX = width / cols;
  const spacingY = height / rows;
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[i * 2 + 0] = (col + 0.5) * spacingX;
    positions[i * 2 + 1] = (row + 0.5) * spacingY;
  }

  const posBuffer = device.createBuffer({
    size: positions.byteLength,
    usage:
      GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });
  device.queue.writeBuffer(
    posBuffer,
    0,
    positions.buffer,
    positions.byteOffset,
    positions.byteLength
  );

  const particleWgsl = /* wgsl */ `
    ${commonWgsl}
    @vertex fn vs(@location(0) instancePos: vec2<f32>, @builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
      let quad = array<vec2<f32>, 6>(
        vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
        vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
      );
      let q = quad[vi];
      let size = vec2f(4.0, 4.0); // particle quad size in pixels
      let pixelPos = instancePos + q * size;
      let ndc = (pixelPos / vec2f(data.width, data.height)) * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
      return vec4f(ndc, 0.0, 1.0);
    }

    @fragment fn fs() -> @location(0) vec4f {
      // yellow particles
      return vec4f(1.0, 1.0, 0.0, 1.0);
    }
  `;

  const module = device.createShaderModule({ code: particleWgsl });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 8,
          stepMode: "instance",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
    },
    primitive: { topology: "triangle-list" },
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 0.0],
    loadOp: "clear",
    storeOp: "store",
  };
  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "particle renderPass",
    colorAttachments: [colorAttachment],
  };

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  // simulation params uniform
  const simParams = new Float32Array([0.016, 200.0, width, height]); // dt, speed, width, height
  const simBuffer = device.createBuffer({
    size: simParams.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    simBuffer,
    0,
    simParams.buffer,
    simParams.byteOffset,
    simParams.byteLength
  );

  // compute shader to advect particles using normals texture
  const computeWgsl = `
    ${commonWgsl}\n
    struct Sim { dt: f32, speed: f32, width: f32, height: f32 };
    @group(0) @binding(1) var normalsTex: texture_2d<f32>;
    @group(0) @binding(2) var<storage, read_write> positions: array<vec2<f32>>;
    @group(0) @binding(3) var<uniform> sim: Sim;

    @compute @workgroup_size(64)
    fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
      let idx: u32 = gid.x;
      if (idx >= ${NUM_PARTICLES}u) { return; }
      var p = positions[idx];
      let uv = p / vec2f(sim.width, sim.height);
        // sample normals texture via nearest texel in compute shader
        let ix = i32(floor(uv.x * sim.width));
        let iy = i32(floor(uv.y * sim.height));
        let ncol = textureLoad(normalsTex, vec2<i32>(ix, iy), 0).xyz;
      let nx = ncol.x * 2.0 - 1.0;
      let ny = ncol.y * 2.0 - 1.0;
      // normals encode downhill direction in (nx,ny), use that for flow
      let flow = vec2f(nx, ny);
      p = p + flow * sim.speed * sim.dt;
      // wrap around
      if (p.x < 0.0) { p.x = p.x + sim.width; }
      if (p.x >= sim.width) { p.x = p.x - sim.width; }
      if (p.y < 0.0) { p.y = p.y + sim.height; }
      if (p.y >= sim.height) { p.y = p.y - sim.height; }
      positions[idx] = p;
    }
      
  `;

  const computeModule = device.createShaderModule({ code: computeWgsl });
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs" },
  });

  return {
    texture,
    pipeline,
    posBuffer,
    numParticles: NUM_PARTICLES,
    colorAttachment,
    renderPassDescriptor,
    bindGroup,
    computePipeline,
    simBuffer,
  };
}

export function renderParticleTexture(
  encoder: GPUCommandEncoder,
  particle: {
    texture: GPUTexture;
    pipeline: GPURenderPipeline;
    posBuffer: GPUBuffer;
    numParticles: number;
    renderPassDescriptor: GPURenderPassDescriptor;
    colorAttachment: GPURenderPassColorAttachment;
    bindGroup: GPUBindGroup;
  }
) {
  const view = particle.texture.createView();
  (
    particle.renderPassDescriptor
      .colorAttachments as GPURenderPassColorAttachment[]
  )[0].view = view;
  const pass = encoder.beginRenderPass(particle.renderPassDescriptor);
  pass.setBindGroup(0, particle.bindGroup);
  pass.setPipeline(particle.pipeline);
  pass.setVertexBuffer(0, particle.posBuffer);
  pass.draw(6, particle.numParticles);
  pass.end();
}

export function dispatchParticleCompute(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  particle: {
    computePipeline: GPUComputePipeline;
    posBuffer: GPUBuffer;
    numParticles: number;
    simBuffer: GPUBuffer;
  },
  normals: {
    texture: GPUTexture;
    // width: number;
    // height: number;
  },
  deltaTime: number
) {
  const particleSpeed = 2000.0;
  const simArray = new Float32Array([
    deltaTime,
    particleSpeed,
    normals.width,
    normals.height,
  ]);
  device.queue.writeBuffer(
    particle.simBuffer,
    0,
    simArray.buffer,
    simArray.byteOffset,
    simArray.byteLength
  );

  const bindGroup = device.createBindGroup({
    layout: particle.computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 1, resource: normals.texture.createView() },
      { binding: 2, resource: { buffer: particle.posBuffer } },
      { binding: 3, resource: { buffer: particle.simBuffer } },
    ],
  });

  const pass = encoder.beginComputePass();
  pass.setPipeline(particle.computePipeline);
  pass.setBindGroup(0, bindGroup);
  const groups = Math.ceil(particle.numParticles / 64);
  pass.dispatchWorkgroups(groups);
  pass.end();
}
