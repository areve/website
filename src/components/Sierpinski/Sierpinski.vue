<template>
  <section>
    <h1>Sierpinski</h1>
    <p>A html canvas drawing a Sierpinski Gasket with the Chaos Game method.</p>
    <figure>
      <canvas id="sierpinski-canvas" width="300" height="300" />
    </figure>

    <fieldset>
      <label for="pointsPerSecond">points/sec</label>
      <input
        id="pointsPerSecond"
        v-model.number="pointsPerSecond"
        type="number"
      />
      <button type="button" @click="snapshot()">Snapshot</button>
      <button type="button" @click="start()">Restart</button>
      <label v-if="isHiResAvailable" for="hiRes">
        <input id="hiRes" v-model="hiRes" type="checkbox" @click="start" />
        hi-res
      </label>
    </fieldset>

    <div class="snapshots">
      <div v-for="snapshot in snapshots" :key="snapshot" class="snapshot">
        <img :src="snapshot" :key="snapshot" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import canvasColor from "./lib/canvas-color";
import { getDevicePixelRatio } from "./lib/get-device-pixel-ratio";
import { defineComponent } from "vue";
import { constantly, Constantly } from "./lib/constantly";
import ImageBufferManipulate from "../OldskoolFire/lib/image-buffer-manipulate";

interface Point {
  x: number;
  y: number;
}

export default defineComponent({
  name: "Sierpinski",
  setup() {
    return {
      width: undefined! as number,
      height: undefined! as number,
      canvasWriter: null as ImageBufferManipulate | null,
      constantly: null as Constantly | null,
      currentPoint: undefined! as Point,
    };
  },
  data() {
    return {
      corners: [] as Point[],
      snapshots: [] as string[],
      hiRes: false,
      pointsPerSecond: 1000,
      darkGrey: canvasColor.fromRGB(64, 64, 64),
    };
  },
  mounted() {
    this.start();
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
    destroyChildObjects() {
      this.canvasWriter?.destroy();
      this.constantly?.destroy();
    },
    start() {
      this.destroyChildObjects();
      const canvas = document.getElementById(
        "sierpinski-canvas"
      ) as HTMLCanvasElement;

      this.canvasWriter = new ImageBufferManipulate(
        canvas,
        undefined,
        this.hiRes
      );

      this.height = this.canvasWriter.height;
      this.width = this.canvasWriter.width;

      this.canvasWriter.clear(canvasColor.fromRGB(255, 255, 255));
      const scale = this.width;
      this.corners = [];
      const corners = [
        { x: 0.5, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ];

      corners.forEach((point) =>
        this.corners.push({
          x: point.x * scale,
          y: point.y * scale,
        })
      );

      this.currentPoint = {
        x: this.corners[0].x,
        y: this.corners[0].y,
      };

      this.constantly = constantly(() => this.addPoint(), this.pointsPerSecond);
    },

    snapshot() {
      const dataUrl = this.canvasWriter!.toCanvas().toDataURL();
      this.snapshots.push(dataUrl);
    },
    addPoint() {
      const randomCorner = this.corners[
        ~~(Math.random() * this.corners.length)
      ];

      const point: Point = {
        x: (this.currentPoint.x + randomCorner.x) / 2,
        y: (this.currentPoint.y + randomCorner.y) / 2,
      };

      this.canvasWriter!.subtractPoint(point.x, point.y, this.darkGrey);

      this.currentPoint = point;
    },
  },
});
</script>

<style scoped>
canvas {
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
</style>
