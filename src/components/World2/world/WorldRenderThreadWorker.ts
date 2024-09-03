import { Camera } from "./../../Curves/lib/render";
import { Coord } from "@/components/World/lib/interfaces";
import { WorldRenderModel } from "./WorldRender";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { Dimensions } from "../lib/render";
import { RenderThread } from "./MultiThreadedRender";
import { buffer, mode } from "d3";

console.log("WorldRenderThreadWorker");

const rt = new RenderThread((x: number, y: number) => {
  const z = worldRenderModel.frame;
  return pixel(world(x, y, z));
});

let worldRenderModel: WorldRenderModel;
let world: WorldGenerator;

self.onmessage = (
  event: MessageEvent<{
    origin: Coord;
    dimensions: Dimensions;
    model: WorldRenderModel;
    buffer: ArrayBuffer;
  }>
) => {
  const { model, origin, dimensions } = event.data;
  worldRenderModel = model;
  if (!world || event.data.model.seed !== worldRenderModel?.seed)
    world = makeWorldGenerator(event.data.model.seed);

  const result = rt.render(
    origin.x,
    origin.y,
    dimensions.width,
    dimensions.height,
    model.camera,
    model.dimensions
  );

  self.postMessage(
    {
      buffer: result.buffer,
    },
    [result.buffer] as any // "any" here because the types are wrong, transferable is supported
  );
};
