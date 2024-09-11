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
      wheelZoomSpeed: 6,
    },
  };

  const states = {
    keyboard: {
      buttons: {
        moveX: { increasing: false, decreasing: false, speed: 0 },
        moveY: { increasing: false, decreasing: false, speed: 0 },
        zoom: { increasing: false, decreasing: false, speed: 0 },
      },
      mouseover: false,
    },
    zooming: {
      originX: 0,
      originY: 0,
    },
    panning: {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dragging: false,
    },
    pinching: {
      initialDistance: 0,
      startDistance: 0,
      pinchRatio: 1,
      currentPinchDistance: 0,
      zooming: false,
    },
  };

  let bindElement: HTMLElement;
  let bindGlobalElement: Document;
  const start = performance.now() / 1000;
  let prevTime = start;
  const controller = ref({
    mount(element: HTMLElement) {
      bindGlobalElement = document;
      bindElement = element;
      bindGlobalElement.addEventListener("keydown", onKeyDown);
      bindGlobalElement.addEventListener("keyup", onKeyUp);
      bindElement.addEventListener("mousedown", onMouseDown);
      bindGlobalElement.addEventListener("mousemove", onMouseMove);
      bindGlobalElement.addEventListener("mouseup", onMouseUp);
      bindElement.addEventListener("mouseout", onMouseOut);
      bindElement.addEventListener("wheel", onWheel);
      bindElement.addEventListener("touchstart", onTouchStart);
      bindElement.addEventListener("touchmove", onTouchMove);
      bindElement.addEventListener("touchend", onTouchEnd);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindElement.removeEventListener("mousedown", onMouseDown);
      bindGlobalElement.removeEventListener("mousemove", onMouseMove);
      bindGlobalElement.removeEventListener("mouseup", onMouseUp);
      bindElement.removeEventListener("mouseout", onMouseOut);
      bindElement.removeEventListener("wheel", onWheel);
      bindElement.removeEventListener("touchstart", onTouchStart);
      bindElement.removeEventListener("touchmove", onTouchMove);
      bindElement.removeEventListener("touchend", onTouchEnd);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      if (states.keyboard.mouseover) {
        states.keyboard.buttons.moveX.speed = updateSpeed(
          options.moveX,
          states.keyboard.buttons.moveX,
          diffTime
        );
        states.keyboard.buttons.moveY.speed = updateSpeed(
          options.moveY,
          states.keyboard.buttons.moveY,
          diffTime
        );
        states.keyboard.buttons.zoom.speed = updateSpeed(
          options.zoom,
          states.keyboard.buttons.zoom,
          diffTime
        );

        controller.value.x += states.keyboard.buttons.moveX.speed * diffTime;
        controller.value.y -= states.keyboard.buttons.moveY.speed * diffTime;

        const zoomChange = 1 - states.keyboard.buttons.zoom.speed * diffTime;

        controller.value.x +=
          states.zooming.originX *
          (controller.value.zoom - controller.value.zoom * zoomChange);
        controller.value.y +=
          states.zooming.originY *
          (controller.value.zoom - controller.value.zoom * zoomChange);
        controller.value.zoom *= zoomChange;
      }

      if (states.panning.dragging) {
        const deltaX =
          (states.panning.startX - states.panning.currentX) *
          controller.value.zoom;
        const deltaY =
          (states.panning.startY - states.panning.currentY) *
          controller.value.zoom;
        controller.value.x += deltaX;
        controller.value.y += deltaY;
        states.panning.startX = states.panning.currentX;
        states.panning.startY = states.panning.currentY;
      }

      if (states.pinching.zooming) {
        controller.value.zoom *= states.pinching.pinchRatio;
        states.pinching.initialDistance = states.pinching.currentPinchDistance;
        states.pinching.pinchRatio = 1;
      }

      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
  });
  return controller;

  function getScale() {
    return bindElement.nodeName === "CANVAS"
      ? (bindElement as HTMLCanvasElement).width / bindElement.offsetWidth
      : 1;
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
      const state =
        states.keyboard.buttons[k as keyof typeof states.keyboard.buttons];
      const lowerCaseKey = key.toLowerCase();
      if (increaseKeys.includes(lowerCaseKey)) state.increasing = pressed;
      if (decreaseKeys.includes(lowerCaseKey)) state.decreasing = pressed;
    }
  }

  function onMouseDown(event: MouseEvent) {
    const scale = getScale();
    states.panning.currentX = states.panning.startX = event.clientX * scale;
    states.panning.currentY = states.panning.startY = event.clientY * scale;
    states.panning.dragging = true;
    event.preventDefault();
  }

  function updateZoomingOrigin(event: MouseEvent) {
    const canvasRect = bindElement.getBoundingClientRect();
    states.zooming.originX = event.clientX - canvasRect.left;
    states.zooming.originY = event.clientY - canvasRect.top;
  }

  function onMouseMove(event: MouseEvent) {
    states.keyboard.mouseover = true;
    updateZoomingOrigin(event);
    if (states.panning.dragging) {
      const scale = getScale();
      states.panning.currentX = event.clientX * scale;
      states.panning.currentY = event.clientY * scale;
      event.preventDefault();
    }
  }

  function onMouseUp() {
    states.panning.dragging = false;
  }

  function onMouseOut() {
    states.keyboard.mouseover = false;
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const [touch1] = event.touches as unknown as [Touch];
      states.panning.currentX = states.panning.startX = touch1.clientX;
      states.panning.currentY = states.panning.startY = touch1.clientY;
      states.panning.dragging = true;
      event.preventDefault();
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      states.pinching.initialDistance = getDistance(touch1, touch2);
      states.panning.dragging = false;
      event.preventDefault();
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && states.panning.dragging) {
      const [touch1] = event.touches as unknown as [Touch];
      states.panning.currentX = touch1.clientX;
      states.panning.currentY = touch1.clientY;
      event.preventDefault();
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      const currentPinchDistance = getDistance(touch1, touch2);
      states.pinching.currentPinchDistance = currentPinchDistance;
      const pinchRatio = states.pinching.initialDistance / currentPinchDistance;
      states.pinching.pinchRatio = pinchRatio;
      states.pinching.zooming = true;
      event.preventDefault();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length === 0) {
      states.panning.dragging = false;
      states.pinching.zooming = false;
      event.preventDefault();
    } else if (event.touches.length === 1) {
      const [touch1] = event.touches as unknown as [Touch];
      states.panning.currentX = states.panning.startX = touch1.clientX;
      states.panning.currentY = states.panning.startY = touch1.clientY;
      states.panning.dragging = true;
      states.pinching.zooming = false;
      event.preventDefault();
    }
  }

  function onWheel(event: WheelEvent) {
    updateZoomingOrigin(event);
    const maxSpeed = options.zoom.wheelZoomSpeed;
    const zoomChange = event.deltaY * maxSpeed;
    const zoomDiff = states.keyboard.buttons.zoom.speed - zoomChange;
    states.keyboard.buttons.zoom.speed = clamp(zoomDiff, -maxSpeed, maxSpeed);
    event.preventDefault();
  }
};

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

function getDistance(touch1: Touch, touch2: Touch): number {
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
