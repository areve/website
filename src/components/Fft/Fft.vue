<template>
  <section>
    <h1>FFT</h1>
    <p>
      Experiments with Fast Fourier Transformations in javascript. Click an
      image at the top to show an FFT magnitude and phase image, and then the
      third image is made by comnining the two.
    </p>

    <img src="./images/lena.png" @click="selectImage" />
    <img src="./images/clown.jpg" @click="selectImage" />
    <img src="./images/sine4.png" @click="selectImage" />
    <img src="./images/twigs.jpg" @click="selectImage" />
    <div>
      <div>
        Magnitude<br />
        <canvas id="mag-canvas" width="100" height="100" />
      </div>

      <div>
        Phase<br />
        <canvas id="phase-canvas" width="100" height="100" />
      </div>
      <div>
        Inverse FFT<br />
        <canvas id="output-canvas" width="100" height="100" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ComplexBuffer from "./lib/complex-buffer";

export default defineComponent({
  name: "Fft",
  data() {
    return {};
  },
  mounted() {},
  methods: {
    selectImage(event: Event) {
      this.start(event.target as HTMLImageElement);
    },
    start(img: HTMLImageElement) {
      const magCanvas = document.getElementById(
        "mag-canvas"
      ) as HTMLCanvasElement;
      const phaseCanvas = document.getElementById(
        "phase-canvas"
      ) as HTMLCanvasElement;
      const outputCanvas = document.getElementById(
        "output-canvas"
      ) as HTMLCanvasElement;

      const complexBuffer = ComplexBuffer.createFromImage(img);
      const fftData = complexBuffer.fft();
      const mag = fftData.toMagnitude().autoContrast().toBuffer(6);
      const phase = fftData.toPhase().toBuffer();
      const output = fftData.ifft().toBuffer();

      mag.toCanvas(magCanvas);
      phase.toCanvas(phaseCanvas);
      output.toCanvas(outputCanvas);
    },
  },
});
</script>

<style scoped>
img {
  cursor: pointer;
}
</style>
