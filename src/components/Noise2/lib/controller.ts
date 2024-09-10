import { ref } from "vue";

export const makeController = function () {
  const buttons = {
    moveX: {
      increase: {
        key: "d",
        pressed: false,
      },
      decrease: {
        key: "a",
        pressed: false,
      },
      speed: 0,
      accel: 2000,
      decel: 2000,
      maxSpeed: 300,
    },
    moveY: {
      increase: {
        key: "w",
        pressed: false,
      },
      decrease: {
        key: "s",
        pressed: false,
      },
      speed: 0,
      accel: 2000,
      decel: 2000,
      maxSpeed: 300,
    },
    zoom: {
      increase: {
        key: "'",
        pressed: false,
      },
      decrease: {
        key: "/",
        pressed: false,
      },
      speed: 0,
      accel: 20,
      decel: 20,
      maxSpeed: 2,
    },
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

      buttons.moveX.speed = updateSpeed(buttons.moveX, diffTime);
      buttons.moveY.speed = updateSpeed(buttons.moveY, diffTime);
      buttons.zoom.speed = updateSpeed(buttons.zoom, diffTime);

      controller.value.x += buttons.moveX.speed * diffTime;
      controller.value.y -= buttons.moveY.speed * diffTime;
      controller.value.zoom *= 1 - buttons.zoom.speed * diffTime;

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

  function updateSpeed(buttonConfig: any, diffTime: number): number {
    const { speed, increase, decrease, accel, decel, maxSpeed } =
      buttonConfig;

    let newSpeed = speed;

    if (increase.pressed === decrease.pressed) {
      // No movement or both buttons pressed
      if (newSpeed > 0) {
        newSpeed = Math.max(newSpeed - decel * diffTime, 0);
      } else if (newSpeed < 0) {
        newSpeed = Math.min(newSpeed + decel * diffTime, 0);
      }
    } else if (increase.pressed) {
      newSpeed = Math.min(newSpeed + accel * diffTime, maxSpeed);
    } else if (decrease.pressed) {
      newSpeed = Math.max(newSpeed - accel * diffTime, -maxSpeed);
    }

    return newSpeed;
  }

  function onKeydown(event: KeyboardEvent) {
    updateButtonState(event.key, true);
  }

  function onKeyup(event: KeyboardEvent) {
    updateButtonState(event.key, false);
  }

  function updateButtonState(key: string, pressed: boolean) {
    for (const k in buttons) {
      const { increase, decrease } = buttons[k as keyof typeof buttons];
      if (key.toLowerCase() === increase.key) increase.pressed = pressed;
      if (key.toLowerCase() === decrease.key) decrease.pressed = pressed;
    }
  }
};
