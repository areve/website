<template>
  <section>
    <h1>Mandelbrot <small>(and Julia)</small></h1>
    <p>
      A html canvas showing a Mandelbrot set, and some options to show a Julia
      set.
    </p>
    <p>Click/shift to zoom in and out, or pinch-in/out on touchscreen.</p>
    <pre>
      {{ event }}
    </pre>
    <figure class="touch-area">
      <canvas
        id="mandelbrot-canvas"
        width="100"
        height="100"
        @click="clickZoom"
      />
    </figure>

    <fieldset>
      <button type="button" @click="snapshot">Snapshot</button>
      <button type="button" @click="reset">Reset</button>
      <button type="button" @click="update">Update</button>
      <button type="button" @click="openFullscreen">Fullscreen</button>
      <label v-if="isHiResAvailable" for="hiRes">
        <input id="hiRes" v-model="hiRes" type="checkbox" @click="update" />
        hi-res
      </label>
    </fieldset>

    <fieldset>
      <label for="realMin">R min</label>
      <input id="realMin" v-model.number="realMin" type="number" step="any" />
      <label for="realMax">R max</label>
      <input id="realMax" v-model.number="realMax" type="number" step="any" />
      <label for="imagMin">i min</label>
      <input id="imagMin" v-model.number="imagMin" type="number" step="any" />
      <label for="imagMax">i max</label>
      <input id="imagMax" v-model.number="imagMax" type="number" step="any" />
      <label for="maxIterations">max depth</label>
      <input id="maxIterations" v-model="maxIterations" type="number" />
    </fieldset>

    <fieldset>
      <label for="julia">
        <input id="julia" v-model="julia" type="checkbox" @click="update" />
        Julia
      </label>
      <label for="juliaR">Real</label>
      <input id="juliaR" v-model.number="juliaR" type="number" step="any" />
      <label for="juliaI">Imaginary</label>
      <input id="juliaI" v-model.number="juliaI" type="number" step="any" />
    </fieldset>

    <div class="snapshots">
      <div v-for="snapshot in snapshots" :key="snapshot" class="snapshot">
        <img :src="snapshot" :key="snapshot" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
/// <reference types="hammerjs" />

import ComplexGridIterator, {
  ComplexNumber,
  ComplexPoint,
} from "./lib/complex-grid-iterator";
import { defineComponent } from "vue";
import { getDevicePixelRatio } from "./lib/get-device-pixel-ratio";
import { Point } from "./lib/grid-iterator";
import canvasColor from "./lib/canvas-color";
import ImageBufferManipulate from "./lib/image-buffer-manipulate";
import fullscreen from "fullscreen";
import { Fullscreen } from "fullscreen-types";
import { getElementScreenOffset } from "./lib/get-element-offset";
import "hammerjs";

interface MandelbrotCalculateResult {
  iterations: number;
  value: number;
  z: ComplexNumber;
  c: ComplexNumber;
}

export default defineComponent({
  name: "Mandelbrot",
  setup() {
    return {
      canvasWriter: undefined! as ImageBufferManipulate,
      fullscreen: null as Fullscreen | null,
      grid: undefined! as ComplexGridIterator,
      width: undefined! as number,
      height: undefined! as number,
    };
  },
  data() {
    return {
      redrawRate: 20,
      realMin: -2.5,
      realMax: 1.5,
      imagMin: -2,
      imagMax: 2,
      hiRes: false,
      maxIterations: 50,
      julia: false,
      juliaR: -1,
      juliaI: 0,
      snapshots: [] as string[],
      event: null as HammerInput | null,
    };
  },
  mounted() {
    const touchArea = document.getElementsByClassName(
      "touch-area"
    )[0] as HTMLElement;
    const mc = new Hammer.Manager(touchArea);
    const pinch = new Hammer.Pinch();
    mc.add(pinch);
    mc.on("pinchend", this.pinch);

    this.update();
  },
  beforeUnmount() {
    this.destroyChildObjects();
  },
  computed: {
    isHiResAvailable() {
      return getDevicePixelRatio() !== 1;
    },
  },
  methods: {
    snapshot() {
      this.snapshots.push(this.canvasWriter.toCanvas().toDataURL());
    },
    reset() {
      this.realMin = -2.5;
      this.realMax = 1.5;
      this.imagMin = -2;
      this.imagMax = 2;
      this.julia = false;
      this.juliaR = -1;
      this.juliaI = 0;
      this.hiRes = false;
      this.maxIterations = 50;
      this.update();
    },
    pinch(event: HammerInput) {
      this.event = event;
      const canvasDevicePos = getElementScreenOffset(event.target);
      const canvasPos = this.canvasWriter.getCanvasPoint(
        event.center.x - canvasDevicePos.x,
        event.center.y - canvasDevicePos.y
      );
      const point = this.grid.toComplex(canvasPos.x, canvasPos.y);
      const scale = (event as any).additionalEvent ? 0.5 : 2;
      alert(
        "pinch " +
          scale +
          " " +
          (event as any).additionalEvent +
          " " +
          JSON.stringify(event)
      );
      this.zoom(point, scale);
    },
    clickZoom(event: MouseEvent) {
      const canvasPos = this.canvasWriter.getCanvasPoint(
        event.offsetX,
        event.offsetY
      );
      const point = this.grid.toComplex(canvasPos.x, canvasPos.y);
      const scale = event.shiftKey ? 0.5 : 2;
      this.zoom(point, scale);
    },
    openFullscreen(event: Event) {
      const onAttain = () => {
        const canvas = document.getElementById(
          "mandelbrot-canvas"
        ) as HTMLCanvasElement;
        canvas.style.width = screen.width + "px";
        canvas.style.height = screen.height + "px";
        this.update();
      };

      const onRelease = () => {
        const canvas = document.getElementById(
          "mandelbrot-canvas"
        ) as HTMLCanvasElement;
        canvas.style.width = "";
        canvas.style.height = "";
        this.update();
        this.fullscreen?.dispose();
        this.fullscreen = null;
      };

      if (this.fullscreen) this.fullscreen.dispose();
      const canvas = document.getElementById(
        "mandelbrot-canvas"
      ) as HTMLCanvasElement;
      this.fullscreen = fullscreen(canvas);
      this.fullscreen.on("attain", onAttain);
      this.fullscreen.on("release", onRelease);
      this.fullscreen.on("error", () => {
        console.error("fullscreen not supported");
      });
      this.fullscreen.request();
    },
    zoom(point: ComplexNumber, scale: number) {
      const width = this.grid.realMax - this.grid.realMin;
      const height = this.grid.imagMax - this.grid.imagMin;
      this.realMin = point.r - width / 2 / scale;
      this.realMax = point.r + width / 2 / scale;
      this.imagMin = point.i - height / 2 / scale;
      this.imagMax = point.i + height / 2 / scale;
      this.update();
    },
    destroyChildObjects() {
      this.canvasWriter?.destroy();
      this.grid?.destroy();
      this.fullscreen?.dispose();
    },
    update() {
      if (this.grid) this.grid.destroy();

      const canvas = document.getElementById(
        "mandelbrot-canvas"
      ) as HTMLCanvasElement;

      if (!this.canvasWriter) {
        this.canvasWriter = new ImageBufferManipulate(
          canvas,
          undefined,
          this.hiRes
        );
      } else {
        this.canvasWriter.hiRes = this.hiRes;
        this.canvasWriter.refresh();
      }

      this.height = this.canvasWriter.height;
      this.width = this.canvasWriter.width;

      this.grid = new ComplexGridIterator(
        this.width,
        this.height,
        this.realMin,
        this.imagMin,
        this.realMax,
        this.imagMax
      );

      this.grid.each((point: ComplexPoint) => {
        const result = this.calculate(point);
        this.setPointColor(point, result);
      });
    },
    calculate(c: ComplexPoint): MandelbrotCalculateResult {
      let value = 0;
      let iterations = 0;
      let z = { r: c.r, i: c.i };
      for (; iterations < this.maxIterations; iterations++) {
        let r = this.julia ? this.juliaR : c.r;
        let i = this.julia ? this.juliaI : c.i;
        z = {
          r: z.r * z.r - z.i * z.i + r,
          i: z.r * z.i * 2 + i,
        };

        value = z.r * z.r + z.i * z.i;
        if (value > 4) break;
      }

      return { iterations, value, z, c };
    },
    setPointColor(point: Point, result: MandelbrotCalculateResult) {
      const r = ~~(result.value * 6);
      const g = result.value < 9 ? 0 : ~~(result.value * 20);
      const b = 255 - (result.iterations / this.maxIterations) * 255;

      const color = canvasColor.fromRGB(r, g, b);
      this.canvasWriter.setPoint(point.x, point.y, color);
    },
  },
});
</script>

<style scoped>
.touch-area {
  display: inline-block;
}

canvas {
  border: 1px solid shade(0.8);
  width: 500px;
}

.snapshots {
  line-height: 0;
}

.snapshots .snapshot {
  display: inline-block;
  width: 24%;
  margin: 0.5%;
}

.snapshots .snapshot img {
  width: 100%;
}
</style>
