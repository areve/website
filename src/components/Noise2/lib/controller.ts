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
    moveX: { increasing: false, decreasing: false, speed: 0 },
    moveY: { increasing: false, decreasing: false, speed: 0 },
    zoom: { increasing: false, decreasing: false, speed: 0 },
  };

  let element: HTMLElement;
  const start = performance.now() / 1000;
  let prevTime = start;
  const controller = ref({
    mount(element?: HTMLElement) {
      element = element ?? document.body;
      element.addEventListener("keydown", onKeydown);
      element.addEventListener("keyup", onKeyup);
    },
    unmount() {
      element.removeEventListener("keydown", onKeydown);
      element.removeEventListener("keyup", onKeyup);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      states.moveX.speed = updateSpeed(options.moveX, states.moveX, diffTime);
      states.moveY.speed = updateSpeed(options.moveY, states.moveY, diffTime);
      states.zoom.speed = updateSpeed(options.zoom, states.zoom, diffTime);

      controller.value.x += states.moveX.speed * diffTime;
      controller.value.y -= states.moveY.speed * diffTime;
      controller.value.zoom *= 1 - states.zoom.speed * diffTime;

      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    // pitch: 0, // reserved for future
    // yaw: 0, // reserved for future
    // roll: 0, // reserved for future
    zoom: 1,
  });
  return controller;

  function updateSpeed(
    options: { accel: number; decel: number; maxSpeed: number },
    state: {
      speed: number;
      increasing: boolean;
      decreasing: boolean;
    },
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

  function onKeydown(event: KeyboardEvent) {
    updateButtonState(event.key, true);
  }

  function onKeyup(event: KeyboardEvent) {
    updateButtonState(event.key, false);
  }

  function updateButtonState(key: string, pressed: boolean) {
    for (const k in options) {
      const { increaseKeys, decreaseKeys } = options[k as keyof typeof options];
      const state = states[k as keyof typeof states];
      const lowerCaseKey = key.toLowerCase();
      if (increaseKeys.indexOf(lowerCaseKey) !== -1) state.increasing = pressed;
      if (decreaseKeys.indexOf(lowerCaseKey) !== -1) state.decreasing = pressed;
    }
  }
};
