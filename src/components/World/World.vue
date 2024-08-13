<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <section class="group" v-for="layer in layers">
      <div class="canvas-wrap">
        <canvas
          :ref="layer.canvas"
          class="canvas"
          @click="layer.click($event)"
          @mousemove="layer.hover($event)"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">{{ layer.title }}</div>
        <div class="info">{{ layer.description }}</div>
        <hr />
        <div>weight: {{ (layer.weight.value ?? 0).toPrecision(3) }}</div>
        <div>{{ (layer.hoverData.value ?? 0).toPrecision(3) }}</div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw } from "vue";
import { Layerx } from "./lib/prng";
import {
  makeUniverseLayer,
  UniverseLayerx,
  UniverseProps,
} from "./maps/universeMap";
import { makePlanetLayer, PlanetLayerx, PlanetProps } from "./maps/planetMap";
import { clamp } from "./lib/other";
import { GalaxyLayerx, GalaxyProps, makeGalaxyLayer } from "./maps/galaxyMap";
import {
  SolarSystemLayerx,
  SolarSystemProps,
  makeSolarSystemLayer,
} from "./maps/solarSystemMap";

// TODO Layerx is a name that is being replace by this, but not ready yet
interface Layer {
  title: string;
  description: string;
  canvas: Ref<HTMLCanvasElement | undefined>;
  hoverData: Ref<number>;
  weight: Ref<number>;
  childLayer?: Layer;
  click(event: MouseEvent): void;
  hover(event: MouseEvent): void;
  render(prevLayer: any, x: number, y: number): void;
}

class UniverseLayer implements Layer {
  private _instance?: UniverseLayerx;
  private _context: CanvasRenderingContext2D | null = null;
  childLayer?: GalaxyLayer;
  title = "universe";
  description = "each dot is a galaxy";
  canvas = ref<HTMLCanvasElement>();
  hoverData = ref(0);
  weight = ref(0);
  click(event: MouseEvent) {
    this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
  }
  hover(event: MouseEvent) {
    this.hoverData.value = this._instance!.weights(
      ...coordFromEvent(event, this.props!)
    );
  }
  render(prevLayer: any, x: number, y: number) {
    // const actualUniverseWeightKg = 1e53;
    const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
    // const milkyWayWeightKg = 2.7e27;
    // const earthWeightKg = 5.9e24;

    this.props = {
      width: 200,
      height: 200,
      seed: 1234567890,
      weight: thisUniverseWeightKg,
    };

    this._instance = makeUniverseLayer(this.props);
    this._context ??= getContext(this.canvas.value, this.props);
    render(this._context, this._instance);
    this.weight.value = this.props.weight;
    this.childLayer?.render(this, 0, 0);
  }
  props?: UniverseProps;
  weights(x: number, y: number) {
    return this._instance!.weights(x, y);
  }
}

class GalaxyLayer implements Layer {
  private _instance?: GalaxyLayerx;
  private _context: CanvasRenderingContext2D | null = null;
  childLayer?: SolarSystemLayer;
  title = "galaxy";
  description = "each dot is a solar system";
  canvas = ref<HTMLCanvasElement>();
  hoverData = ref(0);
  weight = ref(0);
  click(event: MouseEvent) {
    this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
  }

  hover(event: MouseEvent) {
    this.hoverData.value = this._instance!.weights(
      ...coordFromEvent(event, this.props!)
    );
  }
  render(prevLayer: UniverseLayer, x: number, y: number) {
    this.props = {
      width: prevLayer.props!.width,
      height: prevLayer.props!.height,
      seed: prevLayer.weights(x, y),
      weight: prevLayer.weights(x, y),
      universeProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
    };
    this._instance = makeGalaxyLayer(this.props);
    this._context ??= getContext(this.canvas.value, this.props);
    render(this._context, this._instance);
    this.weight.value = this.props.weight;
    this.childLayer?.render(this, 0, 0);
  }
  props?: GalaxyProps;
  weights(x: number, y: number) {
    return this._instance!.weights(x, y);
  }
}

class SolarSystemLayer implements Layer {
  private _instance?: SolarSystemLayerx;
  private _context: CanvasRenderingContext2D | null = null;
  childLayer?: PlanetLayer;
  title = "solar system";
  description = "each dot is a sun, planet, moon, asteroid";
  canvas = ref<HTMLCanvasElement>();
  hoverData = ref(0);
  weight = ref(0);
  click(event: MouseEvent) {
    this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
  }

  hover(event: MouseEvent) {
    this.hoverData.value = this._instance!.weights(
      ...coordFromEvent(event, this.props!)
    );
  }
  render(prevLayer: GalaxyLayer, x: number, y: number) {
    this.props = {
      width: prevLayer.props!.width,
      height: prevLayer.props!.height,
      seed: prevLayer.weights(x, y),
      weight: prevLayer.weights(x, y),
      galaxyProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
    };
    this._instance = makeSolarSystemLayer(this.props);
    this._context ??= getContext(this.canvas.value, this.props);
    render(this._context, this._instance!);
    this.weight.value = this.props.weight;
    this.childLayer?.render(this, 0, 0);
  }
  props?: SolarSystemProps;
  weights(x: number, y: number) {
    return this._instance!.weights(x, y);
  }
}

class PlanetLayer implements Layer {
  private _instance?: PlanetLayerx;
  private _context: CanvasRenderingContext2D | null = null;
  childLayer?: Layer;
  title = "planet";
  description =
    "each dot is a point on a point on the planet sized region of the solar system";
  canvas = ref<HTMLCanvasElement>();
  hoverData = ref(0);
  weight = ref(0);
  click(event: MouseEvent) {}
  hover(event: MouseEvent) {
    this.hoverData.value = this._instance!.heights(
      ...coordFromEvent(event, this.props!)
    );
  }
  render(prevLayer: SolarSystemLayer, x: number, y: number) {
    this.props = {
      width: prevLayer.props!.width,
      height: prevLayer.props!.height,
      seed: prevLayer.weights(x, y),
      weight: prevLayer.weights(x, y),
      solarSystemProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
      camera: { x: 0, y: 0 },
    };
    this._instance = makePlanetLayer(this.props);
    this._context ??= getContext(this.canvas.value, this.props);
    render(this._context, this._instance!);
    this.weight.value = this.props.weight;
  }
  props?: PlanetProps;
}

onMounted(async () => {
  layers.reduce((prevLayer: Layer | null, layer: Layer) => {
    layer.render(prevLayer, 200, 200);
    if (prevLayer) prevLayer.childLayer = layer;
    return layer;
  }, null);
  document.addEventListener("keydown", onKeyDown);
});

const layers = [
  new UniverseLayer(),
  new GalaxyLayer(),
  new SolarSystemLayer(),
  new PlanetLayer(),
];

const coordFromEvent = (
  event: MouseEvent,
  dimensions: {
    width: number;
    height: number;
  }
) => {
  return [
    Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  ] as [x: number, y: number];
};

const onKeyDown = (event: KeyboardEvent) => {
  let x;
  let y;
  // if (event.key === "a") x = (planetProps.value?.camera.x ?? 0) - 50;
  // if (event.key === "d") x = (planetProps.value?.camera.x ?? 0) + 50;
  // if (event.key === "w") y = (planetProps.value?.camera.y ?? 0) - 50;
  // if (event.key === "s") y = (planetProps.value?.camera.y ?? 0) + 50;
  // if (x !== undefined || y !== undefined) {
  //   if (!planetProps.value) return;
  //   planetProps.value = Object.assign({}, toRaw(planetProps.value), {
  //     camera: {
  //       x: x ?? planetProps.value?.camera.x ?? 0,
  //       y: y ?? planetProps.value?.camera.y ?? 0,
  //     },
  //   });
  // }
};

function getContext(
  canvas: HTMLCanvasElement | undefined,
  dimensions: {
    width: number;
    height: number;
  }
) {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d", {
    willReadFrequently: true,
  });
}

function render(
  context: CanvasRenderingContext2D | null,
  layer: Layerx,
  camera?: { x: number; y: number }
) {
  if (!context) return;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const xMax = layer.props.width;
  const yMax = layer.props.height;
  const cameraX = camera?.x ?? 0;
  const cameraY = camera?.y ?? 0;
  for (let x = 0; x < xMax; ++x) {
    for (let y = 0; y < yMax; ++y) {
      const v = layer.pixel(x + cameraX, y + cameraY);
      const i = (x + y * width) * 4;
      data[i] = (v[0] * 0xff) >>> 0;
      data[i + 1] = (v[1] * 0xff) >>> 0;
      data[i + 2] = (v[2] * 0xff) >>> 0;
      data[i + 3] = ((v[3] ?? 1) * 0xff) >>> 0;
    }
  }

  context.putImageData(imageData, 0, 0);
}
</script>

<style scoped>
.group {
  display: flex;
  margin-bottom: 5px;
}
.title {
  font-weight: 500;
}
.info {
  font-size: 0.9em;
  line-height: 1.2em;
}
.notes {
  flex: 1 1;
  background-color: #eee;
  margin-left: 5px;
  padding: 5px;
}
.canvas-wrap {
  position: relative;
  height: 200px;
  width: 200px;
}
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0px solid #999;
}
</style>
