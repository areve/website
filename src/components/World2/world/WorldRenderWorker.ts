import { MultiThreadedRender } from "./MultiThreadedRender";
import { WorldRenderModel } from "./WorldRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

class WorldRender extends MultiThreadedRender {
  createWorker(): Worker {
    return new WorldRenderThreadWorker();
  }
}
new WorldRender();
