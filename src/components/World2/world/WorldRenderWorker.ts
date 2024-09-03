import { MultiThreadedRender } from "./MultiThreadedRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

class WorldRenderWorker extends MultiThreadedRender {
  createWorker(): Worker {
    console.log('create worker!')
    return new WorldRenderThreadWorker();
  }
}
console.log('new WorldRenderWorker')
new WorldRenderWorker();
