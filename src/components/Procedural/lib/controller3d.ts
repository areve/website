import { ref } from "vue";

interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

const defaultOptions = {
  camera: {
    initialPosition: [0, 80, 80] as [number, number, number],
    initialYaw: 0,
    initialPitch: -Math.PI / 4,
    initialFov: Math.PI / 4, // Default FOV (45 degrees)
    minFov: Math.PI / 12, // Min zoom in (15 degrees)
    maxFov: Math.PI / 2, // Max zoom out (90 degrees)
  },
  movement: {
    forward: { keys: ["w"], speed: 0.05 },
    backward: { keys: ["s"], speed: 0.05 },
    left: { keys: ["a"], speed: 0.05 },
    right: { keys: ["d"], speed: 0.05 },
  },
  rotation: {
    left: { keys: [","], speed: 0.02 },
    right: { keys: ["."], speed: 0.02 },
  },
  zoom: {
    increaseKeys: ["'"],
    decreaseKeys: ["/"],
    accel: 5,
    decel: 5,
    maxSpeed: 2,
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
    keys: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      rotateLeft: false,
      rotateRight: false,
    },
    zoom: {
      increasing: false,
      decreasing: false,
      speed: 0,
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
  };

  let bindElement: HTMLElement;
  let bindGlobalElement: Document;
  let lastTime = performance.now() / 1000;

  const controller = ref({
    position: [...opt.camera.initialPosition] as [number, number, number],
    yaw: opt.camera.initialYaw,
    pitch: opt.camera.initialPitch,
    fov: opt.camera.initialFov,

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
    },
    update(deltaTime: number) {
      // Update zoom with acceleration/deceleration
      const now = performance.now() / 1000;
      const diffTime = now - lastTime;
      lastTime = now;

      // Calculate zoom speed with acceleration/deceleration
      if (states.zoom.increasing) {
        states.zoom.speed = Math.min(
          states.zoom.speed + opt.zoom.accel * diffTime,
          opt.zoom.maxSpeed
        );
      } else if (states.zoom.decreasing) {
        states.zoom.speed = Math.max(
          states.zoom.speed - opt.zoom.accel * diffTime,
          -opt.zoom.maxSpeed
        );
      } else {
        // Decelerate
        if (states.zoom.speed > 0) {
          states.zoom.speed = Math.max(0, states.zoom.speed - opt.zoom.decel * diffTime);
        } else if (states.zoom.speed < 0) {
          states.zoom.speed = Math.min(0, states.zoom.speed + opt.zoom.decel * diffTime);
        }
      }

      // Apply zoom (inverse relationship: positive speed reduces FOV for zoom in)
      this.fov = Math.max(
        opt.camera.minFov,
        Math.min(
          opt.camera.maxFov,
          this.fov - states.zoom.speed * diffTime
        )
      );

      // Apply rotation
      if (states.keys.rotateLeft) this.yaw -= opt.rotation.left.speed;
      if (states.keys.rotateRight) this.yaw += opt.rotation.right.speed;

      // Calculate forward and right vectors from yaw and pitch
      const cosYaw = Math.cos(this.yaw);
      const sinYaw = Math.sin(this.yaw);
      const cosPitch = Math.cos(this.pitch);

      const forwardX = sinYaw * cosPitch;
      const forwardZ = -cosYaw * cosPitch;

      const rightX = cosYaw;
      const rightZ = sinYaw;

      // Apply drag pan
      if (states.dragging.isDragging) {
        const deltaX = states.dragging.current.x - states.dragging.start.x;
        const deltaY = states.dragging.current.y - states.dragging.start.y;
        
        // Pan camera horizontally (along right vector) - flipped
        const panSpeed = 0.2;
        this.position[0] -= rightX * deltaX * panSpeed;
        this.position[2] -= rightZ * deltaX * panSpeed;
        
        // Pan camera forward/backward (along Z axis) - flipped
        this.position[2] -= deltaY * panSpeed;
        
        // Update drag start for next frame
        states.dragging.start = { ...states.dragging.current };
      }

      // Apply movement
      if (states.keys.forward) {
        this.position[0] += forwardX * opt.movement.forward.speed * deltaTime;
        this.position[2] += forwardZ * opt.movement.forward.speed * deltaTime;
      }
      if (states.keys.backward) {
        this.position[0] -= forwardX * opt.movement.backward.speed * deltaTime;
        this.position[2] -= forwardZ * opt.movement.backward.speed * deltaTime;
      }
      if (states.keys.left) {
        this.position[0] -= rightX * opt.movement.left.speed * deltaTime;
        this.position[2] -= rightZ * opt.movement.left.speed * deltaTime;
      }
      if (states.keys.right) {
        this.position[0] += rightX * opt.movement.right.speed * deltaTime;
        this.position[2] += rightZ * opt.movement.right.speed * deltaTime;
      }
    },
    get paused() {
      return false; // Can extend later if needed
    },
  });

  function onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();

    // Movement keys
    if (opt.movement.forward.keys.includes(key)) {
      states.keys.forward = true;
    }
    if (opt.movement.backward.keys.includes(key)) {
      states.keys.backward = true;
    }
    if (opt.movement.left.keys.includes(key)) {
      states.keys.left = true;
    }
    if (opt.movement.right.keys.includes(key)) {
      states.keys.right = true;
    }

    // Rotation keys
    if (opt.rotation.left.keys.includes(key)) {
      states.keys.rotateLeft = true;
    }
    if (opt.rotation.right.keys.includes(key)) {
      states.keys.rotateRight = true;
    }

    // Zoom keys
    if (opt.zoom.increaseKeys.includes(key)) {
      states.zoom.increasing = true;
    }
    if (opt.zoom.decreaseKeys.includes(key)) {
      states.zoom.decreasing = true;
    }

    // Basic toggle keys
    if (opt.basicKeys.pause.toggleKeys.includes(key)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.pause.eventName));
    }
    if (opt.basicKeys.mode.changeKeys.includes(key)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.mode.eventName));
    }
    if (opt.basicKeys.fullscreen.toggleKeys.includes(key)) {
      document.dispatchEvent(new CustomEvent(opt.basicKeys.fullscreen.eventName));
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();

    // Movement keys
    if (opt.movement.forward.keys.includes(key)) {
      states.keys.forward = false;
    }
    if (opt.movement.backward.keys.includes(key)) {
      states.keys.backward = false;
    }
    if (opt.movement.left.keys.includes(key)) {
      states.keys.left = false;
    }
    if (opt.movement.right.keys.includes(key)) {
      states.keys.right = false;
    }

    // Rotation keys
    if (opt.rotation.left.keys.includes(key)) {
      states.keys.rotateLeft = false;
    }
    if (opt.rotation.right.keys.includes(key)) {
      states.keys.rotateRight = false;
    }

    // Zoom keys
    if (opt.zoom.increaseKeys.includes(key)) {
      states.zoom.increasing = false;
    }
    if (opt.zoom.decreaseKeys.includes(key)) {
      states.zoom.decreasing = false;
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

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      states.touchRotate.isRotating = false;
      states.dragging.isDragging = true;
      states.dragging.start = { x: touch.clientX, y: touch.clientY };
      states.dragging.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches as unknown as [Touch, Touch];
      states.dragging.isDragging = false;
      states.touchRotate.isRotating = true;
      states.touchRotate.lastAngle = Math.atan2(
        t2.clientY - t1.clientY,
        t2.clientX - t1.clientX
      );
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (states.dragging.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      states.dragging.current = { x: touch.clientX, y: touch.clientY };
    } else if (states.touchRotate.isRotating && e.touches.length === 2) {
      const [t1, t2] = e.touches as unknown as [Touch, Touch];
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      const deltaAngle = states.touchRotate.lastAngle - angle; // flipped direction

      // Rotate camera around the point on the plane the camera is looking at (y = 0 plane)
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
      // Use a stable forward distance when looking nearly parallel to the plane
      let t: number;
      const eps = 1e-4;
      if (Math.abs(fwdY) < eps) {
        t = 200; // looking parallel; pick a far forward point
      } else {
        t = -cam[1] / fwdY;
      }

      // If intersection is behind the camera, push it forward instead of rotating in place
      if (t < 0) {
        t = Math.abs(cam[1]) / Math.max(eps, Math.abs(fwdY));
      }

      // Clamp to avoid extreme distances
      t = Math.min(Math.max(t, 1), 2000);
      const centerX = cam[0] + fwdX * t;
      const centerZ = cam[2] + fwdZ * t;

      // Rotate position around center on Y axis by deltaAngle
      const dx = cam[0] - centerX;
      const dz = cam[2] - centerZ;
      const cosA = Math.cos(deltaAngle);
      const sinA = Math.sin(deltaAngle);
      const rx = dx * cosA - dz * sinA;
      const rz = dx * sinA + dz * cosA;
      controller.value.position[0] = centerX + rx;
      controller.value.position[2] = centerZ + rz;

      // Update yaw to match rotation
      controller.value.yaw += deltaAngle;
      states.touchRotate.lastAngle = angle;
    }
  }

  function onTouchEnd() {
    states.dragging.isDragging = false;
    states.touchRotate.isRotating = false;
  }

  return controller;
};
