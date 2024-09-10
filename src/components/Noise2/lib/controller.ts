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
    mouse: {
      startX: 0,
      startY: 0,
      dragging: false,
      currentX: 0,
      currentY: 0,
    },
    touch: {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startDistance: 0,
      zooming: false,
      dragging: false,
    },
    initialPinchDistance: 0,
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
      bindElement.addEventListener("mousedown", onMouseDown);
      bindElement.addEventListener("mousemove", onMouseMove);
      bindElement.addEventListener("mouseup", onMouseUp);
      bindElement.addEventListener("wheel", onWheel);
      bindElement.addEventListener("touchstart", onTouchStart);
      bindElement.addEventListener("touchmove", onTouchMove);
      bindElement.addEventListener("touchend", onTouchEnd);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindElement.removeEventListener("mousedown", onMouseDown);
      bindElement.removeEventListener("mousemove", onMouseMove);
      bindElement.removeEventListener("mouseup", onMouseUp);
      bindElement.removeEventListener("wheel", onWheel);
      bindElement.removeEventListener("touchstart", onTouchStart);
      bindElement.removeEventListener("touchmove", onTouchMove);
      bindElement.removeEventListener("touchend", onTouchEnd);
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

      if (states.mouse.dragging) {
        const deltaX =
          (states.mouse.startX - states.mouse.currentX) * controller.value.zoom;
        const deltaY =
          (states.mouse.startY - states.mouse.currentY) * controller.value.zoom;
        controller.value.x += deltaX;
        controller.value.y += deltaY;
        states.mouse.startX = states.mouse.currentX;
        states.mouse.startY = states.mouse.currentY;
      }

      if (states.touch.dragging) {
        const deltaX =
          (states.touch.startX - states.touch.currentX) * controller.value.zoom;
        const deltaY =
          (states.touch.startY - states.touch.currentY) * controller.value.zoom;
        controller.value.x += deltaX;
        controller.value.y += deltaY;
        states.touch.startX = states.touch.currentX;
        states.touch.startY = states.touch.currentY;
      }

      if (states.touch.zooming) {
        const distance = Math.sqrt(
          Math.pow(states.touch.currentX - states.touch.startX, 2) +
            Math.pow(states.touch.currentY - states.touch.startY, 2)
        );
        const scale = distance / states.touch.startDistance;
        controller.value.zoom *= scale;
        states.touch.startDistance = distance;
        states.touch.startX = states.touch.currentX;
        states.touch.startY = states.touch.currentY;
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

  function onMouseDown(event: MouseEvent) {
    states.mouse.currentX = states.mouse.startX = event.clientX;
    states.mouse.currentY = states.mouse.startY = event.clientY;
    states.mouse.dragging = true;
    event.preventDefault();
  }

  function onMouseMove(event: MouseEvent) {
    if (states.mouse.dragging) {
      states.mouse.currentX = event.clientX;
      states.mouse.currentY = event.clientY;
      event.preventDefault();
    }
  }

  function onMouseUp() {
    states.mouse.dragging = false;
    
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      states.touch.currentX = states.touch.startX = event.touches[0].clientX;
      states.touch.currentY = states.touch.startY = event.touches[0].clientY;
      states.touch.dragging = true;
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      states.initialPinchDistance = getDistance(touch1, touch2);
      states.touch.dragging = false; // Disable dragging during pinch
    }
    event.preventDefault();
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && states.touch.dragging) {
      states.touch.currentX = event.touches[0].clientX;
      states.touch.currentY = event.touches[0].clientY;
      event.preventDefault();
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      const currentPinchDistance = getDistance(touch1, touch2);
      const pinchRatio = states.initialPinchDistance / currentPinchDistance; // Invert the ratio
      controller.value.zoom *= pinchRatio;
      states.initialPinchDistance = currentPinchDistance; // Update for continuous zooming
      event.preventDefault();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length === 0) {
      states.touch.dragging = false;
    } else if (event.touches.length === 1) {
      states.touch.dragging = true; // Resume dragging if one finger is left
    }
    event.preventDefault();
  }

  function onWheel(event: WheelEvent) {
    const zoomChange = event.deltaY;
    states.buttons.zoom.speed = Math.max(
      Math.min(states.buttons.zoom.speed - zoomChange, options.zoom.maxSpeed),
      -options.zoom.maxSpeed
    );

    event.preventDefault();
  }

  function getDistance(touch1: Touch, touch2: Touch): number {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }
};
