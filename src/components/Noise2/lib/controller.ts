import { ref } from "vue";

export const makeController = function () {
  const options = {
    moveX: {
      increaseKeys: ["d"],
      decreaseKeys: ["a"],
      accel: 2000,
      decel: 2000,
      maxSpeed: 300,
    },
    moveY: {
      increaseKeys: ["w"],
      decreaseKeys: ["s"],
      accel: 2000,
      decel: 2000,
      maxSpeed: 300,
    },
    zoom: {
      increaseKeys: ["'"],
      decreaseKeys: ["/"],
      accel: 20,
      decel: 20,
      maxSpeed: 2,
    },
  };

  const states = {
    buttons: {
      moveX: { increasing: false, decreasing: false, speed: 0 },
      moveY: { increasing: false, decreasing: false, speed: 0 },
      zoom: { increasing: false, decreasing: false, speed: 0 },
    },
    pointer: {
      startX: 0,
      startY: 0,
      dragging: false,
      currentX: 0,
      currentY: 0,
    },
  };

  let bindElement: HTMLElement;
  let bindGlobalElement: HTMLElement;
  const start = performance.now() / 1000;
  let prevTime = start;
  const controller = ref({
    mount(element?: HTMLElement) {
      bindGlobalElement = document.body;
      bindElement = element ?? document.body;
      bindGlobalElement.addEventListener("keydown", onKeyDown);
      bindGlobalElement.addEventListener("keyup", onKeyUp);
      bindElement.addEventListener("pointerdown", onPointerDown);
      bindElement.addEventListener("pointermove", onPointerMove);
      bindElement.addEventListener("pointerup", onPointerEnd);
      bindElement.addEventListener("wheel", onWheel); // Add this line
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindElement.removeEventListener("pointerdown", onPointerDown);
      bindElement.removeEventListener("pointermove", onPointerMove);
      bindElement.removeEventListener("pointerup", onPointerEnd);
      bindElement.removeEventListener("wheel", onWheel); // Add this line
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      states.buttons.moveX.speed = updateSpeed(
        options.moveX,
        states.buttons.moveX,
        diffTime
      );
      states.buttons.moveY.speed = updateSpeed(
        options.moveY,
        states.buttons.moveY,
        diffTime
      );
      states.buttons.zoom.speed = updateSpeed(
        options.zoom,
        states.buttons.zoom,
        diffTime
      );

      controller.value.x += states.buttons.moveX.speed * diffTime;
      controller.value.y -= states.buttons.moveY.speed * diffTime;
      controller.value.zoom *= 1 - states.buttons.zoom.speed * diffTime;

      if (states.pointer.dragging) {
        const deltaX =
          (states.pointer.startX - states.pointer.currentX) *
          controller.value.zoom;
        const deltaY =
          (states.pointer.startY - states.pointer.currentY) *
          controller.value.zoom;
        controller.value.x += deltaX;
        controller.value.y += deltaY;
        states.pointer.startX = states.pointer.currentX;
        states.pointer.startY = states.pointer.currentY;
      }

      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
  });
  return controller;

  function updateSpeed(
    options: { accel: number; decel: number; maxSpeed: number },
    state: { speed: number; increasing: boolean; decreasing: boolean },
    diffTime: number
  ): number {
    const { accel, decel, maxSpeed } = options;
    const { speed, increasing, decreasing } = state;
    const bothOrNone = increasing === decreasing;
    if (bothOrNone && speed > 0) return Math.max(speed - decel * diffTime, 0);
    if (bothOrNone && speed < 0) return Math.min(speed + decel * diffTime, 0);
    if (increasing) return Math.min(speed + accel * diffTime, maxSpeed);
    if (decreasing) return Math.max(speed - accel * diffTime, -maxSpeed);
    return speed;
  }

  function onKeyDown(event: KeyboardEvent) {
    updateButtonState(event.key, true);
  }

  function onKeyUp(event: KeyboardEvent) {
    updateButtonState(event.key, false);
  }

  function updateButtonState(key: string, pressed: boolean) {
    for (const k in options) {
      const { increaseKeys, decreaseKeys } = options[k as keyof typeof options];
      const state = states.buttons[k as keyof typeof states.buttons];
      const lowerCaseKey = key.toLowerCase();
      if (increaseKeys.includes(lowerCaseKey)) state.increasing = pressed;
      if (decreaseKeys.includes(lowerCaseKey)) state.decreasing = pressed;
    }
  }

  function onPointerDown(event: PointerEvent) {
    states.pointer.currentX = states.pointer.startX = event.clientX;
    states.pointer.currentY = states.pointer.startY = event.clientY;
    states.pointer.dragging = true;
  }

  function onPointerMove(event: PointerEvent) {
    if (states.pointer.dragging) {
      states.pointer.currentX = event.clientX;
      states.pointer.currentY = event.clientY;
    }
  }

  function onPointerEnd() {
    states.pointer.dragging = false;
  }

  function onWheel(event: WheelEvent) {
    const zoomChange = event.deltaY;
    states.buttons.zoom.speed = Math.max(
      Math.min(states.buttons.zoom.speed - zoomChange, options.zoom.maxSpeed),
      -options.zoom.maxSpeed
    );

    event.preventDefault();
  }
};
