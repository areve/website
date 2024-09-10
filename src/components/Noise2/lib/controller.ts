import { ref } from "vue";

export const makeController = function () {
  let moveSpeedX = 0;
  let maxSpeedX = 300;
  const acceleration = 1000;
  const deceleration = 2000;
  let moveSpeedY = 0;
  let maxSpeedY = 300;
  let zoomSpeed = 0;
  let maxZoomSpeed = 2;
  const zoomAcceleration = 5;
  const zoomDeceleration = 20;
  
  const buttons = {
    left: false,
    right: false,
    up: false,
    down: false,
    zoomIn: false,
    zoomOut: false,
  };

  let _element: HTMLElement;
  const start = performance.now() / 1000;
  let prevTime = start;
  const controller = ref({
    mount(element?: HTMLElement) {
      _element = element ?? document.body;
      _element.addEventListener("keydown", onKeydown);
      _element.addEventListener("keyup", onKeyup);
    },
    unmount() {
      _element.removeEventListener("keydown", onKeydown);
      _element.removeEventListener("keyup", onKeyup);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      if (buttons.left === buttons.right) {
        if (moveSpeedX > 0)
          moveSpeedX = Math.max(moveSpeedX - deceleration * diffTime, 0);
        else if (moveSpeedX < 0)
          moveSpeedX = Math.min(moveSpeedX + deceleration * diffTime, 0);
      } else if (buttons.left) {
        moveSpeedX = Math.max(moveSpeedX - acceleration * diffTime, -maxSpeedX);
      } else if (buttons.right) {
        moveSpeedX = Math.min(moveSpeedX + acceleration * diffTime, maxSpeedX);
      }

      if (buttons.up === buttons.down) {
        if (moveSpeedY > 0)
          moveSpeedY = Math.max(moveSpeedY - deceleration * diffTime, 0);
        else if (moveSpeedY < 0)
          moveSpeedY = Math.min(moveSpeedY + deceleration * diffTime, 0);
      } else if (buttons.down) {
        moveSpeedY = Math.max(moveSpeedY - acceleration * diffTime, -maxSpeedY);
      } else if (buttons.up) {
        moveSpeedY = Math.min(moveSpeedY + acceleration * diffTime, maxSpeedY);
      }

      if (buttons.zoomIn === buttons.zoomOut) {
        if (zoomSpeed > 0)
          zoomSpeed = Math.max(zoomSpeed - zoomDeceleration * diffTime, 0);
        else if (zoomSpeed < 0)
          zoomSpeed = Math.min(zoomSpeed + zoomDeceleration * diffTime, 0);
      } else if (buttons.zoomIn) {
        zoomSpeed = Math.max(zoomSpeed - zoomAcceleration * diffTime, -maxZoomSpeed);
      } else if (buttons.zoomOut) {
        zoomSpeed = Math.min(zoomSpeed + zoomAcceleration * diffTime, maxZoomSpeed);
      }

      controller.value.x += moveSpeedX * diffTime;
      controller.value.y += moveSpeedY * diffTime;
      controller.value.zoom *= 1 + zoomSpeed * diffTime;
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
    if (key === "a") buttons.left = true;
    if (key === "d") buttons.right = true;
    if (key === "w") buttons.up = true;
    if (key === "s") buttons.down = true;
    if (key === "'") buttons.zoomIn = true;
    if (key === "/") buttons.zoomOut = true;
  }

  function onKeyup(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "a") buttons.left = false;
    if (key === "d") buttons.right = false;
    if (key === "w") buttons.up = false;
    if (key === "s") buttons.down = false;
    if (key === "'") buttons.zoomIn = false;
    if (key === "/") buttons.zoomOut = false;
  }
};
