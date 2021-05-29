declare module "fullscreen-types" {
  import { EventEmitter } from "events";

  export type Fullscreen = EventEmitter & {
    dispose: () => void;
    request: () => void;
  };
}

declare module "fullscreen" {
  import { Fullscreen } from "fullscreen-types";

  function fullscreen(htmlElement: HTMLElement): Fullscreen;
  export = fullscreen;
}
