import { mount } from "@vue/test-utils";
import { ref } from "vue";

export const makeController = function () {
  let _tick = 0;
  let _element: HTMLElement;
  const controller = {
    mount(element?: HTMLElement) {
      _element = element ?? document.body;
      _element.addEventListener("keydown", onKeydown);
    },
    unmount(element?: HTMLElement) {
      _element.removeEventListener("keydown", onKeydown);
    },
    update() {
      // console.log("update controller");
      // _tick++;
      // this.x = _tick;
    },
    x: 0,
    y: 0,
    z: 0,
    pitch: 0,
    yaw: 0,
    roll: 0,
    zoom: 1,
  };
  return ref(controller);

  function onKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "a") controller.x -= 10;
    if (key === "d") controller.x += 10;
    if (key === "w") controller.y -= 10;
    if (key === "s") controller.y += 10;

    // console.log("onKeydown", event.key);
  }
};
