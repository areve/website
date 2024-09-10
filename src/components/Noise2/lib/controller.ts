import { mount } from "@vue/test-utils";
import { ref } from "vue";

export const makeController = function () {
  let _tick = 0;
  let _element: HTMLElement;
  const controller = ref({
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
  });
  return controller;

  function onKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === "a") controller.value.x -= 10;
    if (key === "d") controller.value.x += 10;
    if (key === "w") controller.value.y -= 10;
    if (key === "s") controller.value.y += 10;
    if (key === "'") controller.value.zoom /= 1.2;
    if (key === "/") controller.value.zoom *= 1.2;
  }
};
