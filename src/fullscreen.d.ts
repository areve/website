declare module "fullscreen-types" {
  import { EventEmitter } from "events";

  export type Fullscreen = EventEmitter & {
    dispose: () => void;
    request: () => void;
  };
}

declare module "foo" {
  import { Fullscreen } from "fullscreen-types";
  export function fullscreen(htmlElement: HTMLElement): Fullscreen;
}

declare module "fullscreen" {
  import { fullscreen } from "foo";
  export = fullscreen;
}
