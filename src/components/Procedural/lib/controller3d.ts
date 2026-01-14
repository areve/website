import { ref } from "vue";

interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

const defaultOptions = {
  movementMode: "camera" as "camera" | "texture",
  camera: {
    initialPosition: [0, 80, 80] as [number, number, number],
    initialYaw: 0,
    initialPitch: -Math.PI / 4,
    initialFov: Math.PI / 4, // Default FOV (45 degrees)
    minFov: Math.PI / 12, // Min zoom in (15 degrees)
    maxFov: Math.PI / 2, // Max zoom out (90 degrees)
  },
  acceleratorKeys: {
    moveForward: {
      increaseKeys: ["w"],
      decreaseKeys: ["s"],
      accel: 400,
      decel: 400,
      maxSpeed: 50,
    },
    moveRight: {
      increaseKeys: ["d"],
      decreaseKeys: ["a"],
      accel: 400,
      decel: 400,
      maxSpeed: 50,
    },
    rotation: {
      increaseKeys: ["."],
      decreaseKeys: [","],
      accel: 6,
      decel: 6,
      maxSpeed: 1,
    },
    zoom: {
      increaseKeys: ["'"],
      decreaseKeys: ["/"],
      accel: 6,
      decel: 6,
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
      toggleKeys: ["f"],
      eventName: "toggleFullscreen",
    },
  },
};

type Options = typeof defaultOptions;

export const makeController3d = function (options: Partial<Options> = {}) {
  const opt = { ...defaultOptions, ...options };

  const states = {
    keyboard: {
      buttons: {
        moveForward: { increasing: false, decreasing: false, speed: 0 },
        moveRight: { increasing: false, decreasing: false, speed: 0 },
        rotation: { increasing: false, decreasing: false, speed: 0 },
        zoom: { increasing: false, decreasing: false, speed: 0 },
      },
    },
    dragging: {
      isDragging: false,
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    },
    touchRotate: {
      isRotating: false,
      lastAngle: 0,
    },
    pinch: {
      isPinching: false,
      startDistance: 0,
    },
  };

  let bindElement: HTMLElement;
  let bindGlobalElement: Document;
  let lastTime = performance.now() / 1000;

  const controller = ref({
    position: [...opt.camera.initialPosition] as [number, number, number],
    yaw: opt.camera.initialYaw,
    pitch: opt.camera.initialPitch,
    fov: opt.camera.initialFov,
    textureOffset: [0, 0] as [number, number],

    mount(element: HTMLElement) {
      bindGlobalElement = document;
      bindElement = element;
      bindGlobalElement.addEventListener("keydown", onKeyDown);
      bindGlobalElement.addEventListener("keyup", onKeyUp);
      bindElement.addEventListener("mousedown", onMouseDown);
      bindGlobalElement.addEventListener("mousemove", onMouseMove);
      bindGlobalElement.addEventListener("mouseup", onMouseUp);
      bindElement.addEventListener("touchstart", onTouchStart);
      bindGlobalElement.addEventListener("touchmove", onTouchMove);
      bindGlobalElement.addEventListener("touchend", onTouchEnd);
      bindElement.addEventListener("wheel", onWheel);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
      bindElement.removeEventListener("mousedown", onMouseDown);
      bindGlobalElement.removeEventListener("mousemove", onMouseMove);
      bindGlobalElement.removeEventListener("mouseup", onMouseUp);
      bindElement.removeEventListener("touchstart", onTouchStart);
      bindGlobalElement.removeEventListener("touchmove", onTouchMove);
      bindGlobalElement.removeEventListener("touchend", onTouchEnd);
      bindElement.removeEventListener("wheel", onWheel);
    },
    update(deltaTime: number) {
      // Update zoom with acceleration/deceleration
      const now = performance.now() / 1000;
      const diffTime = now - lastTime;
      lastTime = now;

      // Update zoom speed
      states.keyboard.buttons.zoom.speed = updateSpeed(
        opt.acceleratorKeys.zoom,
        states.keyboard.buttons.zoom,
        diffTime
      );

      // Apply zoom (inverse relationship: positive speed reduces FOV for zoom in)
      this.fov = Math.max(
        opt.camera.minFov,
        Math.min(opt.camera.maxFov, this.fov - states.keyboard.buttons.zoom.speed * diffTime)
      );

      // Update rotation speed
      states.keyboard.buttons.rotation.speed = updateSpeed(
        opt.acceleratorKeys.rotation,
        states.keyboard.buttons.rotation,
        diffTime
      );

      // Apply rotation
      const rotationSpeed = states.keyboard.buttons.rotation.speed;
      if (Math.abs(rotationSpeed) > 1e-6) {
        rotateAroundLook(rotationSpeed * diffTime);
      }

      // Update movement speeds
      states.keyboard.buttons.moveForward.speed = updateSpeed(
        opt.acceleratorKeys.moveForward,
        states.keyboard.buttons.moveForward,
        diffTime
      );
      states.keyboard.buttons.moveRight.speed = updateSpeed(
        opt.acceleratorKeys.moveRight,
        states.keyboard.buttons.moveRight,
        diffTime
      );

      // Calculate forward and right vectors from yaw and pitch
      const cosYaw = Math.cos(this.yaw);
      const sinYaw = Math.sin(this.yaw);
      const cosPitch = Math.cos(this.pitch);

      const forwardX = sinYaw * cosPitch;
      const forwardZ = -cosYaw * cosPitch;

      const rightX = cosYaw;
      const rightZ = sinYaw;

      // Apply drag pan (camera-relative axes or texture offset)
      if (states.dragging.isDragging) {
        const deltaX = states.dragging.current.x - states.dragging.start.x;
        const deltaY = states.dragging.current.y - states.dragging.start.y;

        const panSpeed = 0.2;

        if (opt.movementMode === "texture") {
          // Move texture offset instead of camera
          // Horizontal drag: move along camera right (flipped)
          this.textureOffset[0] -= rightX * deltaX * panSpeed;
          this.textureOffset[1] -= rightZ * deltaX * panSpeed;

          // Vertical drag: move along camera forward on the XZ plane (flipped)
          const flatLen = Math.hypot(forwardX, forwardZ) || 1;
          const fwdXFlat = forwardX / flatLen;
          const fwdZFlat = forwardZ / flatLen;
          this.textureOffset[0] += fwdXFlat * deltaY * panSpeed;
          this.textureOffset[1] += fwdZFlat * deltaY * panSpeed;
        } else {
          // Move camera
          // Horizontal drag: move along camera right (flipped)
          this.position[0] -= rightX * deltaX * panSpeed;
          this.position[2] -= rightZ * deltaX * panSpeed;

          // Vertical drag: move along camera forward on the XZ plane (flipped)
          const flatLen = Math.hypot(forwardX, forwardZ) || 1;
          const fwdXFlat = forwardX / flatLen;
          const fwdZFlat = forwardZ / flatLen;
          this.position[0] += fwdXFlat * deltaY * panSpeed;
          this.position[2] += fwdZFlat * deltaY * panSpeed;
        }

        // Update drag start for next frame
        states.dragging.start = { ...states.dragging.current };
      }

      // Apply movement (camera or texture)
      const forwardSpeed = states.keyboard.buttons.moveForward.speed;
      const rightSpeed = states.keyboard.buttons.moveRight.speed;

      if (opt.movementMode === "texture") {
        // Move texture offset instead of camera
        this.textureOffset[0] +=
          (forwardX * forwardSpeed + rightX * rightSpeed) * diffTime;
        this.textureOffset[1] +=
          (forwardZ * forwardSpeed + rightZ * rightSpeed) * diffTime;
      } else {
        // Move camera
        this.position[0] +=
          (forwardX * forwardSpeed + rightX * rightSpeed) * diffTime;
        this.position[2] +=
          (forwardZ * forwardSpeed + rightZ * rightSpeed) * diffTime;
      }
    },
    get paused() {
      return false; // Can extend later if needed
    },
    rotateAroundLook(deltaAngle: number) {
      rotateAroundLook(deltaAngle);
    },
  });

  function rotateAroundLook(deltaAngle: number) {
    const cam = controller.value.position;
    const yaw = controller.value.yaw;
    const pitch = controller.value.pitch;

    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    // Forward vector
    const fwdX = sinYaw * cosPitch;
    const fwdY = -sinPitch;
    const fwdZ = -cosYaw * cosPitch;

    // Intersection of ray (cam + t*fwd) with plane y=0
    let t: number;
    const eps = 1e-4;
    if (Math.abs(fwdY) < eps) {
      t = 200; // looking parallel; pick a far forward point
    } else {
      t = -cam[1] / fwdY;
    }

    if (t < 0) {
      t = Math.abs(cam[1]) / Math.max(eps, Math.abs(fwdY));
    }

    t = Math.min(Math.max(t, 1), 2000);
    const centerX = cam[0] + fwdX * t;
    const centerZ = cam[2] + fwdZ * t;

    const dx = cam[0] - centerX;
    const dz = cam[2] - centerZ;
    const cosA = Math.cos(deltaAngle);
    const sinA = Math.sin(deltaAngle);
    const rx = dx * cosA - dz * sinA;
    const rz = dx * sinA + dz * cosA;
    controller.value.position[0] = centerX + rx;
    controller.value.position[2] = centerZ + rz;

    controller.value.yaw += deltaAngle;
  }

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

  function onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();

    // Handle accelerator keys
    for (const k in opt.acceleratorKeys) {
      const { increaseKeys, decreaseKeys } =
        opt.acceleratorKeys[k as keyof typeof opt.acceleratorKeys];
      const state =
        states.keyboard.buttons[k as keyof typeof states.keyboard.buttons];
      if (increaseKeys.includes(key)) state.increasing = true;
      if (decreaseKeys.includes(key)) state.decreasing = true;
    }

    // Basic toggle keys
    if (opt.basicKeys.pause.toggleKeys.includes(key)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.pause.eventName));
    }
    if (opt.basicKeys.mode.changeKeys.includes(key)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.mode.eventName));
    }
    if (opt.basicKeys.fullscreen.toggleKeys.includes(key)) {
      document.dispatchEvent(
        new CustomEvent(opt.basicKeys.fullscreen.eventName)
      );
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();

    // Handle accelerator keys
    for (const k in opt.acceleratorKeys) {
      const { increaseKeys, decreaseKeys } =
        opt.acceleratorKeys[k as keyof typeof opt.acceleratorKeys];
      const state =
        states.keyboard.buttons[k as keyof typeof states.keyboard.buttons];
      if (increaseKeys.includes(key)) state.increasing = false;
      if (decreaseKeys.includes(key)) state.decreasing = false;
    }
  }

  function onMouseDown(e: MouseEvent) {
    states.dragging.isDragging = true;
    states.dragging.start = { x: e.clientX, y: e.clientY };
    states.dragging.current = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (states.dragging.isDragging) {
      states.dragging.current = { x: e.clientX, y: e.clientY };
    }
  }

  function onMouseUp() {
    states.dragging.isDragging = false;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const maxSpeed = opt.acceleratorKeys.zoom.maxSpeed;
    const zoomChange = e.deltaY * maxSpeed;
    const zoomDiff = states.keyboard.buttons.zoom.speed - zoomChange;
    states.keyboard.buttons.zoom.speed = Math.max(-maxSpeed, Math.min(maxSpeed, zoomDiff));
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      states.touchRotate.isRotating = false;
      states.pinch.isPinching = false;
      states.dragging.isDragging = true;
      states.dragging.start = { x: touch.clientX, y: touch.clientY };
      states.dragging.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches as unknown as [Touch, Touch];
      states.dragging.isDragging = false;
      states.touchRotate.isRotating = true;
      states.pinch.isPinching = true;
      states.touchRotate.lastAngle = Math.atan2(
        t2.clientY - t1.clientY,
        t2.clientX - t1.clientX
      );
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      states.pinch.startDistance = Math.hypot(dx, dy);
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (states.dragging.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      states.dragging.current = { x: touch.clientX, y: touch.clientY };
    } else if (states.touchRotate.isRotating && e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches as unknown as [Touch, Touch];
      const angle = Math.atan2(
        t2.clientY - t1.clientY,
        t2.clientX - t1.clientX
      );
      const deltaAngle = states.touchRotate.lastAngle - angle; // flipped direction

      rotateAroundLook(deltaAngle);
      states.touchRotate.lastAngle = angle;

      // Pinch zoom (adjust FOV)
      const dxp = t2.clientX - t1.clientX;
      const dyp = t2.clientY - t1.clientY;
      const dist = Math.hypot(dxp, dyp);
      const pinchEps = 1e-4;
      if (
        states.pinch.isPinching &&
        dist > pinchEps &&
        states.pinch.startDistance > pinchEps
      ) {
        const ratio = dist / states.pinch.startDistance;
        const safeRatio = Math.max(pinchEps, ratio);
        const newFov = controller.value.fov / safeRatio;
        controller.value.fov = Math.min(
          opt.camera.maxFov,
          Math.max(opt.camera.minFov, newFov)
        );
        states.pinch.startDistance = dist;
      }
    }
  }

  function onTouchEnd() {
    states.dragging.isDragging = false;
    states.touchRotate.isRotating = false;
    states.pinch.isPinching = false;
    states.pinch.startDistance = 0;
  }

  return controller;
};
