import { RenderModel, WorldRenderModel } from "./WorldRender";
import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { RenderThread } from "./MultiThreadedRender";
import { Rgb } from "../lib/color";

console.log("WorldRenderThreadWorker");

class WorldRenderThread extends RenderThread {
  private model?: WorldRenderModel;
  private world?: WorldGenerator;

  update(model: RenderModel) {
    if (!this.world || model.seed !== this.model?.seed)
      this.world = makeWorldGenerator(model.seed);
    this.model = model;
  }
  pixel(x: number, y: number): Rgb {
    if (!this.world) return [0, 0, 0];
    const z = this.model?.frame ?? 0;
    return pixel(this.world(x, y, z));
  }
}

new WorldRenderThread();
