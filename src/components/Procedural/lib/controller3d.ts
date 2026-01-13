import { ref } from "vue";

const defaultOptions = {
  movement: {
    forward: { keys: ["w"], speed: 1 },
    backward: { keys: ["s"], speed: 1 },
    left: { keys: ["a"], speed: 1 },
    right: { keys: ["d"], speed: 1 },
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

  const controller = ref({
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
    update() {
      // Controller doesn't need frame updates for 3D, input is read directly
    },
    get paused() {
      return false; // Can extend later if needed
    },
    get movement() {
      return {
        forward: states.keys.forward ? opt.movement.forward.speed : 0,
        backward: states.keys.backward ? opt.movement.backward.speed : 0,
        left: states.keys.left ? opt.movement.left.speed : 0,
        right: states.keys.right ? opt.movement.right.speed : 0,
      };
    },
    get rotation() {
      let rotationSpeed = 0;
      if (states.keys.rotateLeft) rotationSpeed -= opt.rotation.left.speed;
      if (states.keys.rotateRight) rotationSpeed += opt.rotation.right.speed;
      return rotationSpeed;
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
