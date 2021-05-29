<template>
  <section>
    <h1>Oldskool Fire</h1>
    <p>I'm writing to a canvas as fast as I can to produce a fire effect.</p>
    <section id="play-area">
      <canvas id="play-canvas" width="100" height="100" />
    </section>
    <button type="button" @click="openFullscreen">Fullscreen</button>
  </section>
</template>

<script lang="ts">
import CanvasWriter from "./canvas-writer";
import canvasColor from "./canvas-color";
import { Constantly, constantly } from "./constantly";
import convert from "color-convert";
import { defineComponent } from "vue";
import { Fullscreen } from "fullscreen-types";
import fullscreen from "fullscreen";
import ImageBufferManipulate from "./image-buffer-manipulate";

export default defineComponent({
  name: "OldskoolFire",
  data() {
    return {};
  },
  setup() {
    return {
      _fullscreen: null as Fullscreen | null,
      palette: [] as number[],
      buffer: [] as number[][],
      canvasWriter: undefined! as CanvasWriter,
      constantly: undefined! as Constantly,
    };
  },
  mounted() {
    this._setup();
    this._update();
  },
  beforeDestroy() {
    this.destroyChildObjects();
  },
  computed: {},
  methods: {
    _setup() {
      // TODO can this can all be move to setup()?
      this.destroyChildObjects();
      const canvas = document.getElementById(
        "play-canvas"
      ) as HTMLCanvasElement;
      this.canvasWriter = new ImageBufferManipulate(canvas, undefined, false);
      this.createPalette();
      this.createBuffer();
      this.constantly = constantly(() => this._update(), 100);
    },
    createPalette() {
      this.palette = [];
      const h1 = 80;
      const h2 = -60;
      for (let i = 0; i < 256; i++) {
        const dh = ((h2 - h1) * i) / 255;
        const h = (360 + h1 + dh) % 360;
        const c = convert.hsl.rgb([h, 100, 100 - Math.sqrt(i / 255) * 100]);
        this.palette.push(canvasColor.fromRGB(c[0], c[1], c[2]));
      }
    },
    createBuffer() {
      const width = this.canvasWriter.width;
      const height = this.canvasWriter.height;
      this.buffer = [];
      for (let y = 0; y < height; y++) {
        this.buffer.push([]);
        for (let x = 0; x < width; x++) {
          this.buffer[y].push(255);
        }
      }
    },
    clickChange() {
      this.createPalette();
    },
    destroyChildObjects() {
      if (this.canvasWriter) this.canvasWriter.destroy();
      if (this.constantly) this.constantly.destroy();
    },
    _update() {
      const width = this.canvasWriter.width;
      const height = this.canvasWriter.height;
      let y = height - 1;
      for (let x = 0; x < width; x++) {
        this.buffer[height - 1][x] = ~~(Math.random() * 255);
        this.buffer[height - 2][x] = ~~(Math.random() * 255);
      }
      for (let y = 0; y < height - 2; y++) {
        for (let x = 0; x < width; x++) {
          const n =
            (this.buffer[y + 1][(x - 1 + width) % width] +
              this.buffer[y + 1][x] +
              this.buffer[y + 1][(x + 1) % width] +
              this.buffer[y + 2][x]) /
            3.965;
          this.buffer[y][x] = ~~n;
        }
      }
      for (let y = 0; y < height; y++) {
        for (let x = 1; x < width; x++) {
          const i = ~~Math.min(this.buffer[y][x] / 2, 255);
          this.canvasWriter.uint32![y * width + x] = this.palette[i];
        }
      }
      this.canvasWriter.canvasUpdateIsRequired = true;
    },
    openFullscreen(_: Event) {
      const playArea = document.getElementById("play-area")!;
      const canvas = document.getElementById(
        "play-canvas"
      )! as HTMLCanvasElement;

      const onAttain = () => {
        playArea.style.width = window.screen.width + "px";
        playArea.style.height = window.screen.height + "px";

        const maxPixels = canvas.width * canvas.height;
        const pixels = canvas.offsetHeight * canvas.offsetWidth;
        const scale = Math.sqrt(maxPixels / pixels);
        const height = ~~(canvas.offsetHeight * scale);
        const width = ~~(window.screen.width * scale);

        this.canvasWriter.refresh(width, height);
        this.createBuffer();
        this._update();
      };

      const onRelease = () => {
        playArea.style.width = "";
        playArea.style.height = "";
        canvas.height = canvas.offsetHeight;
        canvas.width = canvas.offsetWidth;
        this.canvasWriter.refresh();
        this.createBuffer();
        this._update();
        this._fullscreen?.dispose();
        this._fullscreen = null;
      };

      if (this._fullscreen) this._fullscreen?.dispose();
      const screen = fullscreen(playArea);
      screen.on("attain", onAttain);
      screen.on("release", onRelease);
      screen.on("error", () => {
        console.error("fullscreen not supported");
      });
      screen.request();
      this._fullscreen = screen;
    },
  },
});
</script>

<style scoped>
#play-area {
  margin: auto;
  width: 300px;
  height: 300px;
}

#play-canvas {
  width: 100%;
  height: 100%;
}

button {
  margin: 0.5em auto;
  display: block;
}
</style>
