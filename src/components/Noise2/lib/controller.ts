import { ref } from "vue";
import { DeepPartial, deepAssign } from "./deepAssign";

const defaultOptions = {
  acceleratorKeys: {
    moveX: {
      increaseKeys: ["d"],
      decreaseKeys: ["a"],
      accel: 2000,
      decel: 2000,
      maxSpeed: 300,
    },
    moveY: {
      increaseKeys: ["s"],
      decreaseKeys: ["w"],
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
      origin: "pointer" as "pointer" | "baseline",
    },
  },
  basicKeys: {
    pause: {
      toggleKeys: [" ", "p"],
      startPaused: false,
    },
  },
};

type Options = typeof defaultOptions;
export const makeController = function (options: DeepPartial<Options> = {}) {
  const opt = deepAssign({} as Options, defaultOptions, options);
  const states = {
    isPointerOver: false,
    keyboard: {
      buttons: {
        moveX: { increasing: false, decreasing: false, speed: 0 },
        moveY: { increasing: false, decreasing: false, speed: 0 },
        zoom: { increasing: false, decreasing: false, speed: 0 },
      },
    },
    pointer: {
      origin: { x: 0, y: 0 },
    },
    dragging: {
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      isDragging: false,
    },
    pinching: {
      origin: { x: 0, y: 0 },
      initialDistance: 0,
      startDistance: 0,
      currentPinchDistance: 0,
      isPinching: false,
    },
  };

  let lastTapTime = 0;
  const doubleTapThreshold = 300; // Maximum delay (in ms) between taps for a double tap

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
      bindGlobalElement.addEventListener("keypress", onKeyPress);
      bindElement.addEventListener("mousedown", onMouseDown);
      bindGlobalElement.addEventListener("mousemove", onMouseMove);
      bindGlobalElement.addEventListener("mouseup", onMouseUp);
      bindElement.addEventListener("mouseout", onMouseOut);
      bindElement.addEventListener("mouseover", onMouseOver);
      bindElement.addEventListener("wheel", onWheel);
      bindElement.addEventListener("touchstart", onTouchStart);
      bindElement.addEventListener("touchmove", onTouchMove);
      bindElement.addEventListener("touchend", onTouchEnd);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindGlobalElement.removeEventListener("keypress", onKeyPress);
      bindElement.removeEventListener("mousedown", onMouseDown);
      bindGlobalElement.removeEventListener("mousemove", onMouseMove);
      bindGlobalElement.removeEventListener("mouseup", onMouseUp);
      bindElement.removeEventListener("mouseout", onMouseOut);
      bindElement.removeEventListener("mouseover", onMouseOver);
      bindElement.removeEventListener("wheel", onWheel);
      bindElement.removeEventListener("touchstart", onTouchStart);
      bindElement.removeEventListener("touchmove", onTouchMove);
      bindElement.removeEventListener("touchend", onTouchEnd);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      states.keyboard.buttons.moveX.speed = updateSpeed(
        opt.acceleratorKeys.moveX,
        states.keyboard.buttons.moveX,
        diffTime
      );
      controller.value.x += states.keyboard.buttons.moveX.speed * diffTime;

      states.keyboard.buttons.moveY.speed = updateSpeed(
        opt.acceleratorKeys.moveY,
        states.keyboard.buttons.moveY,
        diffTime
      );
      controller.value.y += states.keyboard.buttons.moveY.speed * diffTime;

      states.keyboard.buttons.zoom.speed = updateSpeed(
        opt.acceleratorKeys.zoom,
        states.keyboard.buttons.zoom,
        diffTime
      );
      zoomBy(
        states.pointer.origin,
        1 - states.keyboard.buttons.zoom.speed * diffTime
      );

      if (states.dragging.isDragging) {
        const delta = {
          x:
            (states.dragging.start.x - states.dragging.current.x) *
            controller.value.zoom,
          y:
            (states.dragging.start.y - states.dragging.current.y) *
            controller.value.zoom,
        };
        controller.value.x += delta.x;
        controller.value.y += delta.y;
        states.dragging.start = states.dragging.current;
      }

      if (states.pinching.isPinching) {
        const pinchRatio =
          states.pinching.initialDistance /
          states.pinching.currentPinchDistance;
        zoomBy(states.pinching.origin, pinchRatio);
        states.pinching.initialDistance = states.pinching.currentPinchDistance;
      }

      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    paused: opt.basicKeys.pause.startPaused,
  });
  return controller;

  function zoomBy(origin: { x: number; y: number }, zoomChange: number) {
    const o =
      opt.acceleratorKeys.zoom.origin === "pointer"
        ? origin
        : { x: getBaselineCenter(), y: 0 };
    controller.value.x +=
      o.x * (controller.value.zoom - controller.value.zoom * zoomChange);
    controller.value.y +=
      o.y * (controller.value.zoom - controller.value.zoom * zoomChange);
    controller.value.zoom *= zoomChange;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (states.isPointerOver) {
      handleAcceleratorKeys(event.key, true);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    handleAcceleratorKeys(event.key, false);
  }

  function onKeyPress(event: KeyboardEvent) {
    if (states.isPointerOver) {
      const lowerCaseKey = event.key.toLowerCase();
      if (opt.basicKeys.pause.toggleKeys.includes(lowerCaseKey)) {
        controller.value.paused = !controller.value.paused;
        event.preventDefault();
      }
    }
  }

  function handleAcceleratorKeys(key: string, pressed: boolean) {
    for (const k in opt.acceleratorKeys) {
      const { increaseKeys, decreaseKeys } =
        opt.acceleratorKeys[k as keyof typeof opt.acceleratorKeys];
      const state =
        states.keyboard.buttons[k as keyof typeof states.keyboard.buttons];
      const lowerCaseKey = key.toLowerCase();
      if (increaseKeys.includes(lowerCaseKey)) state.increasing = pressed;
      if (decreaseKeys.includes(lowerCaseKey)) state.decreasing = pressed;
    }
  }

  function onMouseDown(event: MouseEvent) {
    handleDoubleTap(event);
    states.dragging.start = states.dragging.current = getClientCoord(event);
    states.dragging.isDragging = true;
    event.preventDefault();
  }

  function getScale(bindElement: HTMLElement) {
    return bindElement.nodeName === "CANVAS"
      ? (bindElement as HTMLCanvasElement).width / bindElement.offsetWidth
      : 1;
  }

  function getBaselineCenter() {
    const scale = getScale(bindElement);
    const canvasRect = bindElement.getBoundingClientRect();
    return (canvasRect.width * scale) / 2;
  }

  function getClientCoord(event: MouseEvent | Touch, touch2?: Touch) {
    const scale = getScale(bindElement);
    const canvasRect = bindElement.getBoundingClientRect();
    const x =
      ((touch2?.clientX
        ? (touch2?.clientX + event.clientX) / 2
        : event.clientX) -
        canvasRect.left) *
      scale;
    const y =
      ((touch2?.clientY
        ? (touch2?.clientY + event.clientY) / 2
        : event.clientY) -
        canvasRect.top) *
      scale;

    return { x, y };
  }

  function onMouseMove(event: MouseEvent) {
    states.pointer.origin = getClientCoord(event);
    if (states.dragging.isDragging) {
      states.dragging.current = getClientCoord(event);
      event.preventDefault();
    }
  }

  function onMouseUp() {
    states.dragging.isDragging = false;
  }

  function onMouseOver() {
    states.isPointerOver = true;
  }

  function onMouseOut() {
    states.isPointerOver = false;
  }

  function onWheel(event: WheelEvent) {
    states.pointer.origin = getClientCoord(event);
    const maxSpeed = opt.acceleratorKeys.zoom.maxSpeed;
    const zoomChange = event.deltaY * maxSpeed;
    const zoomDiff = states.keyboard.buttons.zoom.speed - zoomChange;
    states.keyboard.buttons.zoom.speed = clamp(zoomDiff, -maxSpeed, maxSpeed);
    event.preventDefault();
  }

  function handleDoubleTap(event: TouchEvent | MouseEvent) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    if (tapLength < doubleTapThreshold && tapLength > 0) {
      controller.value.paused = !controller.value.paused; // TODO move action elsewhere
      event.preventDefault();
    }
    lastTapTime = currentTime;
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      handleDoubleTap(event);
      const [touch1] = event.touches as unknown as [Touch];
      states.dragging.start = states.dragging.current = getClientCoord(touch1);
      states.dragging.isDragging = true;
      event.preventDefault();
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      states.pinching.initialDistance = getDistance(touch1, touch2);
      states.dragging.isDragging = false;
      event.preventDefault();
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && states.dragging.isDragging) {
      const [touch1] = event.touches as unknown as [Touch];
      states.dragging.current = getClientCoord(touch1);
      event.preventDefault();
    } else if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches as unknown as [Touch, Touch];
      states.pinching.origin = getClientCoord(touch1, touch2);
      states.pinching.currentPinchDistance = getDistance(touch1, touch2);
      states.pinching.isPinching = true;
      event.preventDefault();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length === 0) {
      states.dragging.isDragging = false;
      states.pinching.isPinching = false;
      event.preventDefault();
    } else if (event.touches.length === 1) {
      const [touch1] = event.touches as unknown as [Touch];
      states.dragging.start = states.dragging.current = getClientCoord(touch1);
      states.dragging.isDragging = true;
      states.pinching.isPinching = false;
      event.preventDefault();
    }
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
