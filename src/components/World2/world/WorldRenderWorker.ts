import { MultiThreadedRender } from "./MultiThreadedRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

class WorldRenderWorker extends MultiThreadedRender {
  createRenderThreadWorker(): Worker {
    console.log("create RenderThreadWorker!");
    return new WorldRenderThreadWorker();
  }
}

new WorldRenderWorker();
