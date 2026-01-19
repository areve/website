import commonWgsl from "./common.wgsl?raw";

const NUM_PARTICLES = 1000;

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
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });
  device.queue.writeBuffer(posBuffer, 0, positions.buffer, positions.byteOffset, positions.byteLength);

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

      // convert pixel -> world
      let baseX = pixelPos.x / data.scale * data.zoom + data.x / data.scale;
      let baseY = pixelPos.y / data.scale * data.zoom + data.y / data.scale;

      // center in world
      let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
      let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;

      // rotate around center in world space
      let relX = baseX - centerX;
      let relY = baseY - centerY;
      let c = cos(data.rotation);
      let s = sin(data.rotation);
      // invert rotation sign to match background rotation direction
      let rotX = relX * c + relY * s;
      let rotY = -relX * s + relY * c;
      let worldX = rotX + centerX;
      let worldY = rotY + centerY;

      // convert world -> pixel
      let px = (worldX - data.x / data.scale) / data.zoom * data.scale;
      let py = (worldY - data.y / data.scale) / data.zoom * data.scale;

      // to NDC (flip Y)
      let ndc = vec2f(px / data.width * 2.0 - 1.0, 1.0 - py / data.height * 2.0);
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

  return {
    texture,
    pipeline,
    posBuffer,
    numParticles: NUM_PARTICLES,
    colorAttachment,
    renderPassDescriptor,
    bindGroup,
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
  }
) {
  const view = particle.texture.createView();
  (particle.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = view;
  const pass = encoder.beginRenderPass(particle.renderPassDescriptor);
  pass.setBindGroup(0, particle.bindGroup);
  pass.setPipeline(particle.pipeline);
  pass.setVertexBuffer(0, particle.posBuffer);
  pass.draw(6, particle.numParticles);
  pass.end();
}
