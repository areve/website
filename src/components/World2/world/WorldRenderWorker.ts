import { MultiThreadedRender } from "../lib/MultiThreadedRender";
import WorldRenderThreadWorker from "./WorldRenderThreadWorker?worker";

new MultiThreadedRender([
  new WorldRenderThreadWorker(),
  new WorldRenderThreadWorker(),
  new WorldRenderThreadWorker(),
  new WorldRenderThreadWorker(),
]);
