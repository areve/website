import { ref } from "vue";

export const makeController = function () {
  let moveSpeedX = 0;
  let moveSpeedY = 0;
  let zoomSpeed = 0;
  const maxSpeedX = 300;
  const maxSpeedY = 300;
  const maxZoomSpeed = 2;
  const acceleration = 2000;
  const deceleration = 2000;
  const zoomAcceleration = 20;
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

      moveSpeedX = updateSpeed(
        moveSpeedX,
        buttons.left,
        buttons.right,
        acceleration,
        deceleration,
        maxSpeedX,
        diffTime
      );
      moveSpeedY = updateSpeed(
        moveSpeedY,
        buttons.up,
        buttons.down,
        acceleration,
        deceleration,
        maxSpeedY,
        diffTime
      );
      zoomSpeed = updateSpeed(
        zoomSpeed,
        buttons.zoomIn,
        buttons.zoomOut,
        zoomAcceleration,
        zoomDeceleration,
        maxZoomSpeed,
        diffTime
      );

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

  function updateSpeed(
    speed: number,
    positiveButton: boolean,
    negativeButton: boolean,
    accel: number,
    decel: number,
    maxSpeed: number,
    diffTime: number
  ): number {
    if (positiveButton === negativeButton) {
      if (speed > 0) {
        speed = Math.max(speed - decel * diffTime, 0);
      } else if (speed < 0) {
        speed = Math.min(speed + decel * diffTime, 0);
      }
    } else if (positiveButton) {
      speed = Math.min(speed + accel * diffTime, maxSpeed);
    } else if (negativeButton) {
      speed = Math.max(speed - accel * diffTime, -maxSpeed);
    }
    return speed;
  }

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
