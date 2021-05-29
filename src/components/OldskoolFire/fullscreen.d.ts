// fullscreen requires the "events" package but doesn't mention it in it's package.json
declare module "fullscreen" {
  function fullscreen(htmlElement: HTMLElement): void;
  export = fullscreen;
}
