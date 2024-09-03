import { makeWorldGenerator, pixel, WorldGenerator } from "./world";
import { RenderModel, RenderThread } from "../lib/MultiThreadedRender";
import { Rgb } from "../lib/color";

class WorldRenderThread extends RenderThread {
  private model?: RenderModel;
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
