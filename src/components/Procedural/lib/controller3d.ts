import { ref } from "vue";

interface CameraState {
  position: [number, number, number];
  yaw: number;
  pitch: number;
}

const defaultOptions = {
  camera: {
    initialPosition: [0, 25, 40] as [number, number, number],
    initialYaw: 0,
    initialPitch: -0.6,
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
  };

  let bindElement: HTMLElement;
  let bindGlobalElement: Document;
  let lastTime = performance.now();

  const controller = ref({
    position: [...opt.camera.initialPosition] as [number, number, number],
    yaw: opt.camera.initialYaw,
    pitch: opt.camera.initialPitch,

    mount(element: HTMLElement) {
      bindGlobalElement = document;
      bindElement = element;
      bindGlobalElement.addEventListener("keydown", onKeyDown);
      bindGlobalElement.addEventListener("keyup", onKeyUp);
    },
    unmount() {
      bindGlobalElement.removeEventListener("keydown", onKeyDown);
      bindGlobalElement.removeEventListener("keyup", onKeyUp);
    },
    update(deltaTime: number) {
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
  }

  return controller;
};
