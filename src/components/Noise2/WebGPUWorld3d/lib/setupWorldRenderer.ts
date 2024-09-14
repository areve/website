import { vec3 } from "wgpu-matrix";
import { getDeviceContext } from "./webgpu";
import { createRenderer } from "./createRenderer";
import { createCube } from "../models/createCube";
import { createPlane } from "../models/createPlane";
import { createCamera } from "./camera";

export async function setupWorldRenderer(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    seed?: number;
    scale?: number;
  }
) {
  const { device, context } = await getDeviceContext(
    canvas,
    options.width,
    options.height
  );

  const worldMapUniforms = {
    width: options.width,
    height: options.height,
    seed: options.seed ?? 12345,
    scale: options.scale ?? 1,
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    toBuffer() {
      return new Float32Array([
        this.width,
        this.height,
        this.seed,
        this.scale,
        this.x,
        this.y,
        this.z,
        this.zoom,
      ]);
    },
  };

  const camera = createCamera(options.width, options.height);

  const cube = createCube(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera
  );

  const plane = createPlane(
    device,
    () => worldMapUniforms.toBuffer(),
    () => camera
  );

  const renderer = createRenderer(device, options.width, options.height);

  return {
    async init() {},
    async update(
      time: DOMHighResTimeStamp,
      data?: {
        x?: number;
        y?: number;
      }
    ) {
      const t = time * 0.001;
      if (data?.x !== undefined) worldMapUniforms.x = data.x;
      if (data?.y !== undefined) worldMapUniforms.y = data.y;
      worldMapUniforms.z = t;
      cube.transform.rotation = vec3.create(Math.sin(t), Math.cos(t), 0);

      cube.updateBuffers();
      plane.updateBuffers();

      const renderPass = renderer.start(context);
      cube.render(renderPass);
      plane.render(renderPass);
      return renderer.end();
    },
  };
}
