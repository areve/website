import { ref } from "vue";
import { DeepPartial, deepAssign } from "./deepAssign";
import { eventNames } from "process";

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
      origin: "pointer" as "pointer" | "baseline" | "center" | (() => "pointer" | "baseline" | "center"),
    },
    rotation: {
      increaseKeys: [","],
      decreaseKeys: ["."],
      accel: 3,
      decel: 3,
      maxSpeed: 1,
    },
  },
  basicKeys: {
    pause: {
      toggleKeys: [" ", "p"],
      startPaused: false,
      eventName: "togglePause",
    },
    mode: {
      changeKeys: ["m"],
      eventName: "changeMode",
    },
    fullscreen: {
      toggleKeys: ["f", "doubletap"],
      eventName: "toggleFullscreen",
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
        rotation: { increasing: false, decreasing: false, speed: 0 },
      },
    },
    pointer: {
      origin: { x: 0, y: 0 },
    },
    clicking: {
      lastTapTime: 0,
      doubleTapThreshold: 300, // Maximum delay (in ms) between taps for a double tap
    },
    dragging: {
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      isDragging: false,
    },
    pinching: {
      origin: { x: 0, y: 0 },
      previousOrigin: { x: 0, y: 0 },
      initialDistance: 0,
      startDistance: 0,
      currentPinchDistance: 0,
      isPinching: false,
      hasMovedSinceStart: false,
      framesSinceFirstMove: 0,
      initialAngle: 0,
      currentAngle: 0,
      // Finger positions in screen space
      finger1Screen: { x: 0, y: 0 },
      finger2Screen: { x: 0, y: 0 },
      // World positions that fingers should track
      finger1World: { x: 0, y: 0 },
      finger2World: { x: 0, y: 0 },
      // Frozen view state at touch start (for consistent coordinate transforms)
      frozenX: 0,
      frozenY: 0,
      frozenZoom: 1,
      frozenRotation: 0,
    },
    viewport: {
      prevCanvasWidth: 0,
      prevCanvasHeight: 0,
      keepCenterOnResize: false,
      targetCenterWorld: { x: 0, y: 0 },
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
      bindGlobalElement.addEventListener("keypress", onKeyPress);
      bindElement.addEventListener("mousedown", onMouseDown);
      bindElement.addEventListener("dblclick", onDoubleClick);
      bindGlobalElement.addEventListener("mousemove", onMouseMove);
      bindGlobalElement.addEventListener("mouseup", onMouseUp);
      bindElement.addEventListener("mouseout", onMouseOut);
      bindElement.addEventListener("mouseover", onMouseOver);
      bindElement.addEventListener("wheel", onWheel);
      bindElement.addEventListener("touchstart", onTouchStart);
      bindElement.addEventListener("touchmove", onTouchMove);
      bindElement.addEventListener("touchend", onTouchEnd);
      // Ensure we keep center stable when fullscreen is entered/exited via Esc or other controls
      bindGlobalElement.addEventListener("fullscreenchange", onFullscreenChange as EventListener);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindGlobalElement.removeEventListener("keypress", onKeyPress);
      bindElement.removeEventListener("mousedown", onMouseDown);
      bindElement.removeEventListener("dblclick", onDoubleClick);
      bindGlobalElement.removeEventListener("mousemove", onMouseMove);
      bindGlobalElement.removeEventListener("mouseup", onMouseUp);
      bindElement.removeEventListener("mouseout", onMouseOut);
      bindElement.removeEventListener("mouseover", onMouseOver);
      bindElement.removeEventListener("wheel", onWheel);
      bindElement.removeEventListener("touchstart", onTouchStart);
      bindElement.removeEventListener("touchmove", onTouchMove);
      bindElement.removeEventListener("touchend", onTouchEnd);
      bindGlobalElement.removeEventListener("fullscreenchange", onFullscreenChange as EventListener);
    },
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      // Detect canvas size change and keep center stable after fullscreen
      const canvasForSize = bindElement as unknown as HTMLCanvasElement;
      if (canvasForSize && typeof canvasForSize.width === 'number') {
        const w = canvasForSize.width;
        const h = canvasForSize.height;
        const sizeChanged =
          w !== states.viewport.prevCanvasWidth || h !== states.viewport.prevCanvasHeight;
        if (states.viewport.keepCenterOnResize && sizeChanged) {
          const scale = 8; // Must match shader
          const centerScreenX = w / 2;
          const centerScreenY = h / 2;
          controller.value.x =
            (states.viewport.targetCenterWorld.x - (centerScreenX / scale) * controller.value.zoom) * scale;
          controller.value.y =
            (states.viewport.targetCenterWorld.y - (centerScreenY / scale) * controller.value.zoom) * scale;
          states.viewport.keepCenterOnResize = false;
        }
        states.viewport.prevCanvasWidth = w;
        states.viewport.prevCanvasHeight = h;
      }

      states.keyboard.buttons.moveX.speed = updateSpeed(
        opt.acceleratorKeys.moveX,
        states.keyboard.buttons.moveX,
        diffTime
      );
      
      states.keyboard.buttons.moveY.speed = updateSpeed(
        opt.acceleratorKeys.moveY,
        states.keyboard.buttons.moveY,
        diffTime
      );
      
      // Apply movement with rotation
      const moveX = states.keyboard.buttons.moveX.speed * diffTime * controller.value.zoom;
      const moveY = states.keyboard.buttons.moveY.speed * diffTime * controller.value.zoom;
      
      // Rotate movement vector by current rotation
      const cos_r = Math.cos(controller.value.rotation);
      const sin_r = Math.sin(controller.value.rotation);
      const rotatedMoveX = moveX * cos_r - moveY * sin_r;
      const rotatedMoveY = moveX * sin_r + moveY * cos_r;
      
      controller.value.x += rotatedMoveX;
      controller.value.y += rotatedMoveY;

      states.keyboard.buttons.zoom.speed = updateSpeed(
        opt.acceleratorKeys.zoom,
        states.keyboard.buttons.zoom,
        diffTime
      );
      zoomBy(
        states.pointer.origin,
        1 - states.keyboard.buttons.zoom.speed * diffTime
      );

      states.keyboard.buttons.rotation.speed = updateSpeed(
        opt.acceleratorKeys.rotation,
        states.keyboard.buttons.rotation,
        diffTime
      );
      controller.value.rotation += states.keyboard.buttons.rotation.speed * diffTime;

      if (states.dragging.isDragging) {
        const deltaX =
          (states.dragging.start.x - states.dragging.current.x) *
          controller.value.zoom;
        const deltaY =
          (states.dragging.start.y - states.dragging.current.y) *
          controller.value.zoom;
        
        // Rotate drag delta by current rotation
        const cos_r = Math.cos(controller.value.rotation);
        const sin_r = Math.sin(controller.value.rotation);
        const rotatedDeltaX = deltaX * cos_r - deltaY * sin_r;
        const rotatedDeltaY = deltaX * sin_r + deltaY * cos_r;
        
        controller.value.x += rotatedDeltaX;
        controller.value.y += rotatedDeltaY;
        states.dragging.start = states.dragging.current;
      }

      // Skip first frame of movement to ensure stable baseline
      if (states.pinching.hasMovedSinceStart) {
        states.pinching.framesSinceFirstMove++;
      }
      
      if (states.pinching.isPinching && states.pinching.hasMovedSinceStart && states.pinching.framesSinceFirstMove > 0) {
        // On first real frame, lock in the current distances as baseline
        if (states.pinching.framesSinceFirstMove === 1) {
          const f1s = states.pinching.finger1Screen;
          const f2s = states.pinching.finger2Screen;
          states.pinching.initialDistance = Math.sqrt(
            Math.pow(f2s.x - f1s.x, 2) + Math.pow(f2s.y - f1s.y, 2)
          );
          states.pinching.initialAngle = Math.atan2(f2s.y - f1s.y, f2s.x - f1s.x);
        }
        
        // Calculate the transform that maps the current finger screen positions
        // back to their original world positions
        
        // Current finger positions in screen space
        const f1s = states.pinching.finger1Screen;
        const f2s = states.pinching.finger2Screen;
        
        // Target world positions (captured at gesture start)
        const f1w = states.pinching.finger1World;
        const f2w = states.pinching.finger2World;
        
        // Calculate new zoom from finger distance change
        const currentDist = Math.sqrt(
          Math.pow(f2s.x - f1s.x, 2) + Math.pow(f2s.y - f1s.y, 2)
        );
        const newZoom = controller.value.zoom * (states.pinching.initialDistance / currentDist);
        
        // Calculate new rotation from finger angle change
        const currentAngle = Math.atan2(f2s.y - f1s.y, f2s.x - f1s.x);
        const newRotation = controller.value.rotation - (currentAngle - states.pinching.initialAngle);
        
        // Now solve for x, y offset that maps f1s to f1w under the new zoom and rotation
        // Using the shader's transformation:
        // 1. screen -> base: baseX = screenX / scale * zoom + x / scale
        // 2. center: centerX = (width/2) / scale * zoom + x / scale
        // 3. relative: relX = baseX - centerX = (screenX - width/2) / scale * zoom
        // 4. rotate: rotX = relX * cos(r) - relY * sin(r)
        // 5. world: worldX = rotX + centerX
        
        const canvas = bindElement as HTMLCanvasElement;
        const scale = 8; // Must match shader
        const centerScreenX = canvas.width / 2;
        const centerScreenY = canvas.height / 2;
        
        // Finger 1 relative to center in screen space
        const f1RelScreenX = f1s.x - centerScreenX;
        const f1RelScreenY = f1s.y - centerScreenY;
        
        // After zoom (in world units)
        const f1RelWorldX = f1RelScreenX / scale * newZoom;
        const f1RelWorldY = f1RelScreenY / scale * newZoom;
        
        // After rotation
        const cos_r = Math.cos(newRotation);
        const sin_r = Math.sin(newRotation);
        const f1RotWorldX = f1RelWorldX * cos_r - f1RelWorldY * sin_r;
        const f1RotWorldY = f1RelWorldX * sin_r + f1RelWorldY * cos_r;
        
        // World position should equal f1w
        // f1w = f1RotWorld + center
        // center = f1w - f1RotWorld
        const newCenterX = f1w.x - f1RotWorldX;
        const newCenterY = f1w.y - f1RotWorldY;
        
        // From center equation: centerX = (width/2) / scale * zoom + x / scale
        // x = (centerX - (width/2) / scale * zoom) * scale
        controller.value.x = (newCenterX - centerScreenX / scale * newZoom) * scale;
        controller.value.y = (newCenterY - centerScreenY / scale * newZoom) * scale;
        controller.value.zoom = newZoom;
        controller.value.rotation = newRotation;
        
        states.pinching.initialDistance = currentDist;
        states.pinching.initialAngle = currentAngle;
      }

      prevTime = now;
    },
    x: 0,
    y: 0,
    z: 0,
    zoom: 1,
    rotation: 0,
    paused: opt.basicKeys.pause.startPaused,
  });
  return controller;

  function zoomBy(origin: { x: number; y: number }, zoomChange: number) {
    const zoomOriginOption = opt.acceleratorKeys.zoom.origin;
    const zoomOrigin = typeof zoomOriginOption === 'function' 
      ? zoomOriginOption() 
      : zoomOriginOption;
    
    let o: { x: number; y: number };
    if (zoomOrigin === "pointer") {
      o = origin;
    } else if (zoomOrigin === "center") {
      // Center of viewport in world coordinates
      const canvasForSize = bindElement as unknown as HTMLCanvasElement;
      o = { 
        x: canvasForSize && typeof canvasForSize.width === 'number' ? canvasForSize.width / 2 : 0,
        y: canvasForSize && typeof canvasForSize.height === 'number' ? canvasForSize.height / 2 : 0
      };
    } else {
      // baseline
      o = { x: getBaselineCenter(), y: 0 };
    }
    
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

  function actionHandler(action: string) {
    if (opt.basicKeys.pause.toggleKeys.includes(action)) {
      controller.value.paused = !controller.value.paused;
      document.dispatchEvent(new CustomEvent(opt.basicKeys.pause.eventName));
      return true;
    }
    if (opt.basicKeys.mode.changeKeys.includes(action)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.mode.eventName));
      return true;
    }
    if (opt.basicKeys.fullscreen.toggleKeys.includes(action)) {
      document.dispatchEvent(
        new CustomEvent(opt.basicKeys.fullscreen.eventName)
      );
      return true;
    }
    return false;
  }

  function onKeyPress(event: KeyboardEvent) {
    if (states.isPointerOver) {
      const lowerCaseKey = event.key.toLowerCase();
      if (actionHandler(lowerCaseKey)) event.preventDefault();
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
    const tapLength = currentTime - states.clicking.lastTapTime;
    if (tapLength < states.clicking.doubleTapThreshold && tapLength > 0) {
      // Capture current center world before toggling fullscreen
      const canvasForSize = bindElement as unknown as HTMLCanvasElement;
      if (canvasForSize && typeof canvasForSize.width === 'number') {
        const centerScreen = { x: canvasForSize.width / 2, y: canvasForSize.height / 2 };
        const centerWorld = screenToWorld(centerScreen);
        states.viewport.targetCenterWorld = centerWorld;
        states.viewport.keepCenterOnResize = true;
      }
      if (actionHandler("doubletap")) event.preventDefault();
    }
    states.clicking.lastTapTime = currentTime;
  }

  function onDoubleClick(event: MouseEvent) {
    // Immediate double-click handler for mouse. Capture center and trigger fullscreen.
    const canvasForSize = bindElement as unknown as HTMLCanvasElement;
    if (canvasForSize && typeof canvasForSize.width === 'number') {
      const centerScreen = { x: canvasForSize.width / 2, y: canvasForSize.height / 2 };
      const centerWorld = screenToWorld(centerScreen);
      states.viewport.targetCenterWorld = centerWorld;
      states.viewport.keepCenterOnResize = true;
    }
    if (actionHandler("doubletap")) event.preventDefault();
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
      
      // Freeze view state at this moment for consistent coordinate transforms
      states.pinching.frozenX = controller.value.x;
      states.pinching.frozenY = controller.value.y;
      states.pinching.frozenZoom = controller.value.zoom;
      states.pinching.frozenRotation = controller.value.rotation;
      
      // Capture finger screen positions
      states.pinching.finger1Screen = getClientCoord(touch1);
      states.pinching.finger2Screen = getClientCoord(touch2);
      
      // Calculate and store world positions for these fingers
      states.pinching.finger1World = screenToWorld(states.pinching.finger1Screen);
      states.pinching.finger2World = screenToWorld(states.pinching.finger2Screen);
      
      states.pinching.initialDistance = getDistance(touch1, touch2);
      states.pinching.initialAngle = getAngle(touch1, touch2);
      states.pinching.hasMovedSinceStart = false;
      states.pinching.framesSinceFirstMove = 0;
      states.pinching.isPinching = true;
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
      
      // Update finger screen positions
      states.pinching.finger1Screen = getClientCoord(touch1);
      states.pinching.finger2Screen = getClientCoord(touch2);
      
      // On first movement, only recalibrate distance and angle to prevent snap/zoom
      if (!states.pinching.hasMovedSinceStart) {
        // Don't recalculate world positions - use the ones from touch start
        // Only update the baseline distance and angle
        states.pinching.initialDistance = getDistance(touch1, touch2);
        states.pinching.initialAngle = getAngle(touch1, touch2);
      }
      
      states.pinching.hasMovedSinceStart = true;
      states.pinching.isPinching = true;
      event.preventDefault();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length === 0) {
      states.dragging.isDragging = false;
      states.pinching.isPinching = false;
      states.pinching.hasMovedSinceStart = false;
      states.pinching.framesSinceFirstMove = 0;
      event.preventDefault();
    } else if (event.touches.length === 1) {
      const [touch1] = event.touches as unknown as [Touch];
      states.dragging.start = states.dragging.current = getClientCoord(touch1);
      states.dragging.isDragging = true;
      states.pinching.isPinching = false;
      // Reset pinch movement gating so next second-finger touch starts fresh
      states.pinching.hasMovedSinceStart = false;
      states.pinching.framesSinceFirstMove = 0;
      event.preventDefault();
    }
  }
  
  function screenToWorld(
    screenPos: { x: number; y: number },
    screenWidth?: number,
    screenHeight?: number
  ): { x: number; y: number } {
    // Converts screen coordinates to world coordinates using current view transform.
    // If screenWidth/screenHeight are provided, use them (useful when calculating
    // transforms across a resize). Otherwise use the current canvas size.
    const canvas = bindElement as HTMLCanvasElement;
    const scale = 8; // Must match shader

    // Current view state
    const { x: offsetX, y: offsetY, zoom, rotation } = controller.value;

    const centerScreenX = (typeof screenWidth === "number" ? screenWidth : canvas.width) / 2;
    const centerScreenY = (typeof screenHeight === "number" ? screenHeight : canvas.height) / 2;

    // Screen to base world coordinates
    const baseWorldX = screenPos.x / scale * zoom + offsetX / scale;
    const baseWorldY = screenPos.y / scale * zoom + offsetY / scale;

    // Center in world coordinates
    const centerWorldX = centerScreenX / scale * zoom + offsetX / scale;
    const centerWorldY = centerScreenY / scale * zoom + offsetY / scale;

    // Relative to center
    const relX = baseWorldX - centerWorldX;
    const relY = baseWorldY - centerWorldY;

    // Apply rotation
    const cos_r = Math.cos(rotation);
    const sin_r = Math.sin(rotation);
    const rotX = relX * cos_r - relY * sin_r;
    const rotY = relX * sin_r + relY * cos_r;

    // Final world position
    const worldX = rotX + centerWorldX;
    const worldY = rotY + centerWorldY;

    return { x: worldX, y: worldY };
  }

  function onFullscreenChange(_: Event) {
    // When fullscreen changes (enter or exit via Esc), capture the previous canvas center
    // using the last known canvas size (prevCanvasWidth/Height) so we can keep that
    // world point centered after the resize.
    const prevW = states.viewport.prevCanvasWidth || (bindElement as HTMLCanvasElement).width || 0;
    const prevH = states.viewport.prevCanvasHeight || (bindElement as HTMLCanvasElement).height || 0;
    if (prevW > 0 && prevH > 0) {
      const centerScreenBefore = { x: prevW / 2, y: prevH / 2 };
      const centerWorldBefore = screenToWorld(centerScreenBefore, prevW, prevH);
      states.viewport.targetCenterWorld = centerWorldBefore;
      states.viewport.keepCenterOnResize = true;
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

function getAngle(touch1: Touch, touch2: Touch): number {
  return Math.atan2(
    touch2.clientY - touch1.clientY,
    touch2.clientX - touch1.clientX
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
