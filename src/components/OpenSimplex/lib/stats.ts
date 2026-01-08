import { ref } from "vue";

export const makeStats = function () {
  let frames = 0;
  const start = performance.now() / 1000;
  let prevTime = start;

  return ref({
    update() {
      const now = performance.now() / 1000;
      const diffTime = now - prevTime;

      if (diffTime >= 1) {
        this.fps = frames / diffTime;
        prevTime = now;
        frames = 0;
        const memory = (performance as any).memory;
        this.usedMB = memory.usedJSHeapSize / 1048576;
        this.limitMB = memory.jsHeapSizeLimit / 1048576;
      }
      frames++;
    },
    fps: 0,
    usedMB: 0,
    limitMB: 0,
  });
};
