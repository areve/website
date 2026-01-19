import noiseWgsl from "./Flowfield2/noise.wgsl?raw";
import openSimplexWgsl from "./Flowfield2/openSimplex3d.wgsl?raw";
import { setupSharedResources } from "./Flowfield2/shared";
import { setupWebGpu } from "./Flowfield2/webgpu";

export async function setupFlowfield2Renderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  canvas.width = options.width;
  canvas.height = options.height;

  const webGpu = await setupWebGpu(canvas);
  const { device, context, presentationFormat } = webGpu;
  const { dataBuffer, sharedData } = setupSharedResources(device, options);

  const shaderPrelude = `struct Uniforms {
    width: f32,
    height: f32,
    seed: f32,
    scale: f32,
    x: f32,
    y: f32,
    z: f32,
    zoom: f32,
    rotation: f32
  };

  @group(0) @binding(0) var<uniform> data: Uniforms;
  `;

  const shaderTail = `
  @vertex fn vs(
    @builtin(vertex_index) vertexIndex : u32
  ) -> @builtin(position) vec4f {
    let pos = array(
      vec2f(-1.0, -1.0),
      vec2f(1.0, 1.0),
      vec2f(-1.0, 1.0) ,
      vec2f(-1.0, -1.0),
      vec2f(1.0, 1.0),
      vec2f(1.0, -1.0)
    );

    return vec4f(pos[vertexIndex], 0.0, 1.0);
  }

  @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
    // Calculate center in world coordinates
    let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
    let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
    
    // Convert pixel to world coordinates
    let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
    let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
    
    // Translate to origin (relative to center)
    let relX = baseX - centerX;
    let relY = baseY - centerY;
    
    // Apply rotation around center
    let cos_r = cos(data.rotation);
    let sin_r = sin(data.rotation);
    let rotX = relX * cos_r - relY * sin_r;
    let rotY = relX * sin_r + relY * cos_r;
    
    // Translate back
    let x = rotX + centerX;
    let y = rotY + centerY;
    
    let n = openSimplex3d(x, y, data.z);
    
    return vec4<f32>(n, n, n, 1.0);
  }
  `;

  const shaderCode =
    shaderPrelude +
    "\n" +
    noiseWgsl +
    "\n" +
    openSimplexWgsl +
    "\n" +
    shaderTail;

  const module = device.createShaderModule({
    label: "flowfield2 shader",
    code: shaderCode,
  });

  const pipeline = device.createRenderPipeline({
    label: "flowfield2 pipeline",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: dataBuffer } }],
  });

  const colorAttachment: GPURenderPassColorAttachment = {
    view: undefined! as GPUTextureView,
    clearValue: [0.0, 0.0, 0.0, 1],
    loadOp: "clear",
    storeOp: "store",
  };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "flowfield2 renderPass",
    colorAttachments: [colorAttachment],
  };

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      Object.assign(sharedData, data);
      sharedData.z = time * 0.0;
      device.queue.writeBuffer(dataBuffer, 0, sharedData.asBuffer());
      colorAttachment.view = context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: "flowfield2 encoder",
      });
      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
      return device.queue.onSubmittedWorkDone();
    },
  };
}
