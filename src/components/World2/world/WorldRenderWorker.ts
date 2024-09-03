import { MultiThreadedRender } from "../lib/MultiThreadedRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

const threadCount = 4;

const singletonWorkers = Array.from({ length: threadCount }).map(
  (_) => new WorldRenderThreadWorker()
);
class WorldRenderWorker extends MultiThreadedRender {
  getRenderThreadWorkers(): Worker[] {
    console.log("get RenderThreadWorkers!");
    return singletonWorkers;
  }
}

new WorldRenderWorker();
