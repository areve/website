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
          @click="layer.click"
          @mousemove="layer.hover"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">{{ layer.title }}</div>
        <div class="info">{{ layer.description }}</div>
        <hr />
        <div>data</div>
        <div>{{ (layer.hoverData.value ?? 0).toPrecision(3) }}</div>
      </div>
    </section>
    <!-- <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="universeCanvas"
          class="canvas"
          @click="clickUniverse"
          @mousemove="hoverUniverse"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">universe</div>
        <div class="info">each dot is a galaxy</div>
        <hr />
        <div>weight: {{ universeProps?.weight.toPrecision(3) }}</div>
        <div>{{ universeHover.toPrecision(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="galaxyCanvas"
          class="canvas"
          @click="clickGalaxy"
          @mousemove="hoverGalaxy"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">galaxy</div>
        <div class="info">each dot is a solar system</div>
        <hr />
        <div>weight: {{ galaxyProps?.weight.toPrecision(3) }}</div>
        <div>{{ galaxyHover.toPrecision(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="solarSystemCanvas"
          class="canvas"
          @click="clickSolarSystem"
          @mousemove="hoverSolarSystem"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">solar system</div>
        <div class="info">each dot is a sun, planet, moon, asteroid</div>
        <hr />
        <div>weight: {{ solarSystemProps?.weight.toPrecision(3) }}</div>
        <div>{{ solarSystemHover.toPrecision(3) }}</div>
      </div>
    </section>
    <section class="group">
      <div class="canvas-wrap">
        <canvas
          ref="planetCanvas"
          class="canvas"
          @mousemove="hoverPlanet"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">planet</div>
        <div class="info">
          each dot is a point on a point on the planet sized region of the solar
          system
        </div>
        <hr />
        <div>weight: {{ planetProps?.weight.toPrecision(3) }}</div>
        <div>{{ planetHover.toPrecision(3) }}</div>
      </div>
    </section> -->
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw, watch } from "vue";
import { Layer } from "./lib/prng";
import {
  makeUniverseLayer,
  UniverseLayer,
  UniverseProps,
} from "./maps/universeMap";
import { makePlanetLayer, PlanetLayer, PlanetProps } from "./maps/planetMap";
import { clamp } from "./lib/other";
import { GalaxyLayer, GalaxyProps, makeGalaxyLayer } from "./maps/galaxyMap";
import {
  SolarSystemLayer,
  SolarSystemProps,
  makeSolarSystemLayer,
} from "./maps/solarSystemMap";

interface Area {
  width: number;
  height: number;
}

// const actualUniverseWeightKg = 1e53;
const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
// const milkyWayWeightKg = 2.7e27;
// const earthWeightKg = 5.9e24;

const layers = [
  {
    title: "universe",
    description: "each dot is a galaxy",
    click: (event: MouseEvent) => console.log(event),
    hover: (event: MouseEvent) => {
      if (!layers[0].instance) return;
      layers[0].hoverData.value = (layers[0].instance as any).weights(
        ...coordFromEvent(event, layers[0].instance.props)
      );
    },
    canvas: ref<HTMLCanvasElement>(),
    instance: null as Layer | null,
    context: null as CanvasRenderingContext2D | null,
    make: makeUniverseLayer,
    data: ref<number>(0),
    hoverData: ref<number>(0),
    makeProps(prevLayer: any, x: number, y: number) {
      return {
        width: 200,
        height: 200,
        seed: 1234567890,
        weight: thisUniverseWeightKg,
      } as UniverseProps;
    },
  },
  {
    title: "galaxy",
    description: "each dot is a solar system",
    click: (event: MouseEvent) => console.log(event),
    hover: (event: MouseEvent) => {
      if (!layers[1].instance) return;
      layers[1].hoverData.value = (layers[1].instance as any).weights(
        ...coordFromEvent(event, layers[1].instance.props)
      );
    },
    canvas: ref<HTMLCanvasElement>(),
    instance: null as Layer | null,
    context: null as CanvasRenderingContext2D | null,
    make: makeGalaxyLayer,
    data: ref<number>(0),
    hoverData: ref<number>(0),
    makeProps(prevLayer: any, x: number, y: number) {
      const { width, height } = prevLayer.props;
      return {
        width,
        height,
        seed: prevLayer.weights(x, y),
        weight: prevLayer.weights(x, y),
        universeProps: toRaw(prevLayer.props),
      } as GalaxyProps;
    },
  },
  {
    title: "solar system",
    description: "each dot is a sun, planet, moon, asteroid",
    click: (event: MouseEvent) => console.log(event),
    hover: (event: MouseEvent) => {
      if (!layers[2].instance) return;
      layers[2].hoverData.value = (layers[2].instance as any).weights(
        ...coordFromEvent(event, layers[2].instance.props)
      );
    },
    canvas: ref<HTMLCanvasElement>(),
    instance: null as Layer | null,
    context: null as CanvasRenderingContext2D | null,
    make: makeSolarSystemLayer,
    data: ref<number>(0),
    hoverData: ref<number>(0),
    makeProps(prevLayer: any, x: number, y: number) {
      const { width, height } = prevLayer.props;
      return {
        width,
        height,
        seed: prevLayer.weights(x, y),
        weight: prevLayer.weights(x, y),
        galaxyProps: toRaw(prevLayer.props),
      } as SolarSystemProps;
    },
  },
  {
    title: "planet",
    description:
      "each dot is a point on a point on the planet sized region of the solar system",
    click: (event: MouseEvent) => console.log(event),
    hover: (event: MouseEvent) => {
      if (!layers[3].instance) return;
      layers[3].hoverData.value = (layers[3].instance as any).heights(
        ...coordFromEvent(event, layers[3].instance.props)
      );
    },
    canvas: ref<HTMLCanvasElement>(),
    instance: null as Layer | null,
    context: null as CanvasRenderingContext2D | null,
    make: makePlanetLayer,
    data: ref<number>(0),
    hoverData: ref<number>(0),
    makeProps(prevLayer: any, x: number, y: number) {
      const { width, height } = prevLayer.props;
      return {
        width,
        height,
        seed: prevLayer.weights(x, y),
        weight: prevLayer.weights(x, y),
        solarSystemProps: toRaw(prevLayer.props),
      } as PlanetProps;
    },
  },
];
// const universeCanvas = ref<HTMLCanvasElement>(undefined!);
// let universeContext: CanvasRenderingContext2D | null;
// let universeLayer: UniverseLayer;
// const universeProps = ref<UniverseProps>();
// const universeHover = ref(0);

// const galaxyCanvas = ref<HTMLCanvasElement>(undefined!);
// let galaxyContext: CanvasRenderingContext2D | null;
// let galaxyLayer: GalaxyLayer;
// const galaxyProps = ref<GalaxyProps>();
// const galaxyHover = ref(0);

// const solarSystemCanvas = ref<HTMLCanvasElement>(undefined!);
// let solarSystemContext: CanvasRenderingContext2D | null;
// let solarSystemLayer: SolarSystemLayer;
// const solarSystemProps = ref<SolarSystemProps>();
// const solarSystemHover = ref(0);

// const planetCanvas = ref<HTMLCanvasElement>(undefined!);
// let planetContext: CanvasRenderingContext2D | null;
// let planetLayer: PlanetLayer;
// const planetProps = ref<PlanetProps>();
// const planetHover = ref(0);

onMounted(async () => {
  layers.reduce((prevLayer: any, layer: any) => {
    const props = layer.makeProps(prevLayer, 0, 0);
    layer.instance = layer.make(props);
    layer.context ??= getContext(layer.canvas.value, props);
    render(layer.context, layer.instance);
    // updateGalaxy(0, 0);
    //layer.getNextProp ? layer.getNextProp(layer, 0, 0) : null;
    return layer.instance;
  }, null);
  document.addEventListener("keydown", onKeyDown);
});

// watch(universeProps, updateUniverseProps);
// function updateUniverseProps(universeProps?: UniverseProps) {
//   if (!universeProps) return;
//   universeLayer = makeUniverseLayer(universeProps);
//   universeContext ??= getContext(universeCanvas, universeProps);
//   render(universeContext, universeLayer);
//   updateGalaxy(0, 0);
// }

// function updateGalaxy(width: number, height: number) {
//   if (!universeLayer) return;
//   galaxyProps.value = {
//     width: universeLayer.props.width,
//     height: universeLayer.props.height,
//     seed: universeLayer.weights(width, height),
//     weight: universeLayer.weights(width, height),
//     universeProps: toRaw(universeLayer.props),
//   };
// }

// watch(galaxyProps, updateGalaxyProps);
// function updateGalaxyProps(galaxyProps?: GalaxyProps) {
//   if (!galaxyProps) return;
//   galaxyLayer = makeGalaxyLayer(galaxyProps);
//   galaxyContext ??= getContext(galaxyCanvas, galaxyProps);
//   render(galaxyContext, galaxyLayer);
//   updateSolarSystem(0, 0);
// }

// function updateSolarSystem(width: number, height: number) {
//   if (!galaxyLayer) return;
//   solarSystemProps.value = {
//     width: galaxyLayer.props.width,
//     height: galaxyLayer.props.height,
//     seed: galaxyLayer.weights(width, height),
//     weight: galaxyLayer.weights(width, height),
//     galaxyProps: toRaw(galaxyLayer.props),
//   };
// }

// watch(solarSystemProps, updateSolarSystemProps);
// function updateSolarSystemProps(solarSystemProps?: SolarSystemProps) {
//   if (!solarSystemProps) return;
//   solarSystemLayer = makeSolarSystemLayer(solarSystemProps);
//   solarSystemContext ??= getContext(solarSystemCanvas, solarSystemProps);
//   render(solarSystemContext, solarSystemLayer);
//   updatePlanet(0, 0);
// }

// function updatePlanet(width: number, height: number) {
//   if (!solarSystemLayer) return;
//   planetProps.value = {
//     width: solarSystemLayer.props.width,
//     height: solarSystemLayer.props.height,
//     seed: solarSystemLayer.weights(width, height),
//     weight: solarSystemLayer.weights(width, height),
//     solarSystemProps: toRaw(solarSystemLayer.props),
//     camera: {
//       x: 0,
//       y: 0,
//     },
//   };
// }

// watch(planetProps, updatePlanetProps);
// function updatePlanetProps(planetProps?: PlanetProps) {
//   if (!planetProps) return;
//   planetLayer = makePlanetLayer(planetProps);
//   planetContext ??= getContext(planetCanvas, planetProps);
//   render(planetContext, planetLayer, planetProps.camera);
// }

const coordFromEvent = (event: MouseEvent, dimensions: Area) => {
  return [
    Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  ] as [x: number, y: number];
};

// const hoverUniverse = (event: MouseEvent) => {
//   if (!universeLayer) return;
//   universeHover.value = universeLayer.weights(
//     ...coordFromEvent(event, universeLayer.props)
//   );
// };

// const clickUniverse = (event: MouseEvent) => {
//   if (!universeLayer) return;
//   updateGalaxy(...coordFromEvent(event, universeLayer.props));
// };

// const hoverGalaxy = (event: MouseEvent) => {
//   if (!galaxyLayer) return;
//   galaxyHover.value = galaxyLayer.weights(
//     ...coordFromEvent(event, galaxyLayer.props)
//   );
// };

// const clickGalaxy = (event: MouseEvent) => {
//   if (!galaxyLayer) return;
//   updateSolarSystem(...coordFromEvent(event, galaxyLayer.props));
// };

// const hoverSolarSystem = (event: MouseEvent) => {
//   if (!solarSystemLayer) return;
//   solarSystemHover.value = solarSystemLayer.weights(
//     ...coordFromEvent(event, solarSystemLayer.props)
//   );
// };

// const clickSolarSystem = (event: MouseEvent) => {
//   if (!solarSystemLayer) return;
//   updatePlanet(...coordFromEvent(event, solarSystemLayer.props));
// };

const onKeyDown = (event: KeyboardEvent) => {
  //   let x;
  //   let y;
  //   if (event.key === "a") x = (planetProps.value?.camera.x ?? 0) - 50;
  //   if (event.key === "d") x = (planetProps.value?.camera.x ?? 0) + 50;
  //   if (event.key === "w") y = (planetProps.value?.camera.y ?? 0) - 50;
  //   if (event.key === "s") y = (planetProps.value?.camera.y ?? 0) + 50;
  //   if (x !== undefined || y !== undefined) {
  //     if (!planetProps.value) return;
  //     planetProps.value = Object.assign({}, toRaw(planetProps.value), {
  //       camera: {
  //         x: x ?? planetProps.value?.camera.x ?? 0,
  //         y: y ?? planetProps.value?.camera.y ?? 0,
  //       },
  //     });
  //   }
};

// const hoverPlanet = (event: MouseEvent) => {
//   if (!planetLayer) return;
//   planetHover.value = planetLayer.heights(
//     ...coordFromEvent(event, planetLayer.props)
//   );
// };

function getContext(canvas: HTMLCanvasElement | undefined, dimensions: Area) {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d", {
    willReadFrequently: true,
  });
}

function render(
  context: CanvasRenderingContext2D | null,
  layer: Layer,
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
