import { ref } from "vue";

export const makeController = function () {
  let moveSpeedX = 0;
  let moveSpeedY = 0;
  let zoomSpeed = 0;
  let _element: HTMLElement;
  const start = performance.now() / 1000;
  let prevTime = start;
  const controller = ref({
    mount(element?: HTMLElement) {
      _element = element ?? document.body;
      _element.addEventListener("keydown", onKeydown);
      _element.addEventListener("keyup", onKeyup);
    },
    unmount(element?: HTMLElement) {
      _element.removeEventListener("keydown", onKeydown);
      _element.removeEventListener("keyup", onKeyup);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;
      controller.value.x += moveSpeedX * diffTime;
      controller.value.y += moveSpeedY * diffTime;
      controller.value.zoom *= 1 - zoomSpeed * diffTime;
      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    pitch: 0,
    yaw: 0,
    roll: 0,
    zoom: 1,
  });
  return controller;

  function onKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "a") moveSpeedX = -100;
    if (key === "d") moveSpeedX = 100;
    if (key === "w") moveSpeedY = -100;
    if (key === "s") moveSpeedY = 100;
    if (key === "'") zoomSpeed = 1;
    if (key === "/") zoomSpeed = -1;
  }

  function onKeyup(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "a") moveSpeedX = 0;
    if (key === "d") moveSpeedX = 0;
    if (key === "w") moveSpeedY = 0;
    if (key === "s") moveSpeedY = 0;
    if (key === "'") zoomSpeed = 0;
    if (key === "/") zoomSpeed = 0;
  }
};
