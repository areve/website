import commonWgsl from "./common.wgsl?raw";
import trailsWgsl from "./trails.wgsl?raw";

export function setupTrailsResources(
  device: GPUDevice,
  width: number,
  height: number
) {
  const format = navigator.gpu.getPreferredCanvasFormat();
  const textureA = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });
  const textureB = device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_SRC,
  });

  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

  // Configurable trail parameters (fade life and color RGBA)
  const config = {
    fadeLife: 5.0,
    color: [0.5, 0.6, 0.8, 0.7], 
  };
  const paramsArray = new Float32Array([config.fadeLife, 0.0, 0.0, 0.0]);
  const paramsBuffer = device.createBuffer({ size: paramsArray.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(paramsBuffer, 0, paramsArray.buffer, paramsArray.byteOffset, paramsArray.byteLength);
  const colorArray = new Float32Array(config.color);
  const colorBuffer = device.createBuffer({ size: colorArray.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(colorBuffer, 0, colorArray.buffer, colorArray.byteOffset, colorArray.byteLength);

  function setParams(params: Partial<{ fadeLife: number; color: number[] }>) {
    Object.assign(config, params);
    const arr = new Float32Array([config.fadeLife, 0.0, 0.0, 0.0]);
    device.queue.writeBuffer(paramsBuffer, 0, arr.buffer, arr.byteOffset, arr.byteLength);
    const col = new Float32Array([config.color[0], config.color[1], config.color[2], config.color[3] ?? 1.0]);
    device.queue.writeBuffer(colorBuffer, 0, col.buffer, col.byteOffset, col.byteLength);
  }

  // Ensure both trails textures start fully transparent to avoid uninitialized pixels
  const clearEncoder = device.createCommandEncoder();
  for (const t of [textureA, textureB]) {
    const clearView = t.createView();
    const clearPass = clearEncoder.beginRenderPass({
      colorAttachments: [
        { view: clearView, loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 0] },
      ],
    });
    clearPass.end();
  }
  device.queue.submit([clearEncoder.finish()]);

  // Compose WGSL: common + external trails WGSL
  const trailsModule = device.createShaderModule({ code: `${commonWgsl}\n${trailsWgsl}` });

  const fadePipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: trailsModule, entryPoint: "vsBlit" },
    fragment: { module: trailsModule, entryPoint: "fsFade", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });

  const addPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: trailsModule, entryPoint: "vsBlit" },
    fragment: {
      module: trailsModule,
      entryPoint: "fsAdd",
      targets: [
        {
          format,
          // premultiplied-src blending: src*1 + dst*(1-src.a)
          blend: {
            color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
    });

    const addBindGroupLayout = addPipeline.getBindGroupLayout(0);

    return {
      textures: [textureA, textureB],
      srcIndex: 0,
      sampler,
      fadePipeline,
      addPipeline,
      addBindGroupLayout,
      paramsBuffer,
      colorBuffer,
      setParams,
    };
}

export function renderTrails(
  encoder: GPUCommandEncoder,
  device: GPUDevice,
  trails: { textures: GPUTexture[]; srcIndex: number; sampler: GPUSampler; fadePipeline: GPURenderPipeline; addPipeline: GPURenderPipeline; addBindGroupLayout: GPUBindGroupLayout; paramsBuffer: GPUBuffer; colorBuffer: GPUBuffer; setParams: Function },
  particleTexture: GPUTexture,
  dataBuffer: GPUBuffer,
  prevDataBuffer: GPUBuffer
) {
  const srcIndex = trails.srcIndex;
  const dstIndex = 1 - srcIndex;
  const srcView = trails.textures[srcIndex].createView();
  const dstView = trails.textures[dstIndex].createView();

  // Fade pass: reproject previous trails into current view and apply decay
  const fadeBind = device.createBindGroup({ layout: trails.fadePipeline.getBindGroupLayout(0), entries: [
    { binding: 0, resource: trails.sampler },
    { binding: 1, resource: srcView },
    { binding: 2, resource: { buffer: dataBuffer } },
    { binding: 3, resource: { buffer: prevDataBuffer } },
    { binding: 4, resource: { buffer: trails.paramsBuffer } },
  ] });
  const fadeAttachment: GPURenderPassColorAttachment = { view: dstView, loadOp: "clear", storeOp: "store", clearValue: [0,0,0,0] };
  const fadeDesc: GPURenderPassDescriptor = { colorAttachments: [fadeAttachment] };
  const fadePass = encoder.beginRenderPass(fadeDesc);
  fadePass.setPipeline(trails.fadePipeline);
  fadePass.setBindGroup(0, fadeBind);
  fadePass.draw(6);
  fadePass.end();

  // Add particles into dst using premultiplied blending (load existing dst)
  const addBindGroup = device.createBindGroup({ layout: trails.addBindGroupLayout, entries: [ { binding: 0, resource: trails.sampler }, { binding: 1, resource: particleTexture.createView() }, { binding: 2, resource: { buffer: trails.colorBuffer } }, { binding: 3, resource: { buffer: dataBuffer } } ] });
  const addAttachment: GPURenderPassColorAttachment = { view: dstView, loadOp: "load", storeOp: "store" };
  const addDesc: GPURenderPassDescriptor = { colorAttachments: [addAttachment] };
  const addPass = encoder.beginRenderPass(addDesc);
  addPass.setPipeline(trails.addPipeline);
  addPass.setBindGroup(0, addBindGroup);
  addPass.draw(6);
  addPass.end();

  trails.srcIndex = dstIndex;
}
 
