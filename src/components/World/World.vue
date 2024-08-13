<template>
  <section>
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <section class="group" v-for="(layer, k) in layers">
      <div class="canvas-wrap">
        <canvas
          :ref="layer.canvas.element"
          class="canvas"
          @click="layer.canvas.click($event)"
          @mousemove="layer.canvas.hover($event)"
        ></canvas>
      </div>
      <div class="notes">
        <div class="title">{{ layer.meta.title }}</div>
        <div class="info">{{ layer.meta.description }}</div>
        <hr />
        <div>{{ layer.data.value.hover.toPrecision(3) }}</div>
        <!-- <div>{{ (layer.hoverData.value ?? 0).toPrecision(3) }}</div> -->
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref, toRaw, watch } from "vue";
import { diskFilter } from "./filters/diskFilter";
import { Layerx, PointGenerator } from "./lib/prng";
import {
  makeUniverseLayer,
  UniverseLayerx,
  UniverseProps,
} from "./maps/universeMap";
import { makePlanetLayer, PlanetLayerx, PlanetProps } from "./maps/planetMap";
import { clamp, hsv2rgb } from "./lib/other";
import { GalaxyLayerx, GalaxyProps, makeGalaxyLayer } from "./maps/galaxyMap";
import {
  SolarSystemLayerx,
  SolarSystemProps,
  makeSolarSystemLayer,
} from "./maps/solarSystemMap";

// TODO Layerx is a name that is being replace by this, but not ready yet
// interface Layer {
//   title: string;
//   description: string;
//   canvas: Ref<HTMLCanvasElement | undefined>;
//   hoverData: Ref<number>;
//   weight: Ref<number>;
//   childLayer?: Layer;
//   click(event: MouseEvent): void;
//   hover(event: MouseEvent): void;
//   render(prevLayer: any, x: number, y: number): void;
// }

// class UniverseLayer implements Layer {
//   private _instance?: UniverseLayerx;
//   private _context: CanvasRenderingContext2D | null = null;
//   childLayer?: GalaxyLayer;
//   title = "universe";
//   description = "each dot is a galaxy";
//   canvas = ref<HTMLCanvasElement>();
//   hoverData = ref(0);
//   weight = ref(0);
//   click(event: MouseEvent) {
//     this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
//   }
//   hover(event: MouseEvent) {
//     this.hoverData.value = this._instance!.weights(
//       ...coordFromEvent(event, this.props!)
//     );
//   }
//   render(prevLayer: any, x: number, y: number) {
//     // const actualUniverseWeightKg = 1e53;
//     const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
//     // const milkyWayWeightKg = 2.7e27;
//     // const earthWeightKg = 5.9e24;

//     this.props = {
//       width: 200,
//       height: 200,
//       seed: 1234567890,
//       weight: thisUniverseWeightKg,
//     };

//     this._instance = makeUniverseLayer(this.props);
//     this._context ??= getContext(this.canvas.value, this.props);
//     render(this._context, this._instance);
//     this.weight.value = this.props.weight;
//     this.childLayer?.render(this, 0, 0);
//   }
//   props?: UniverseProps;
//   weights(x: number, y: number) {
//     return this._instance!.weights(x, y);
//   }
// }

// class GalaxyLayer implements Layer {
//   private _instance?: GalaxyLayerx;
//   private _context: CanvasRenderingContext2D | null = null;
//   childLayer?: SolarSystemLayer;
//   title = "galaxy";
//   description = "each dot is a solar system";
//   canvas = ref<HTMLCanvasElement>();
//   hoverData = ref(0);
//   weight = ref(0);
//   click(event: MouseEvent) {
//     this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
//   }

//   hover(event: MouseEvent) {
//     this.hoverData.value = this._instance!.weights(
//       ...coordFromEvent(event, this.props!)
//     );
//   }
//   render(prevLayer: UniverseLayer, x: number, y: number) {
//     this.props = {
//       width: prevLayer.props!.width,
//       height: prevLayer.props!.height,
//       seed: prevLayer.weights(x, y),
//       weight: prevLayer.weights(x, y),
//       universeProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
//     };
//     this._instance = makeGalaxyLayer(this.props);
//     this._context ??= getContext(this.canvas.value, this.props);
//     render(this._context, this._instance);
//     this.weight.value = this.props.weight;
//     this.childLayer?.render(this, 0, 0);
//   }
//   props?: GalaxyProps;
//   weights(x: number, y: number) {
//     return this._instance!.weights(x, y);
//   }
// }

// class SolarSystemLayer implements Layer {
//   private _instance?: SolarSystemLayerx;
//   private _context: CanvasRenderingContext2D | null = null;
//   childLayer?: PlanetLayer;
//   title = "solar system";
//   description = "each dot is a sun, planet, moon, asteroid";
//   canvas = ref<HTMLCanvasElement>();
//   hoverData = ref(0);
//   weight = ref(0);
//   click(event: MouseEvent) {
//     this.childLayer?.render(this, ...coordFromEvent(event, this.props!));
//   }

//   hover(event: MouseEvent) {
//     this.hoverData.value = this._instance!.weights(
//       ...coordFromEvent(event, this.props!)
//     );
//   }
//   render(prevLayer: GalaxyLayer, x: number, y: number) {
//     this.props = {
//       width: prevLayer.props!.width,
//       height: prevLayer.props!.height,
//       seed: prevLayer.weights(x, y),
//       weight: prevLayer.weights(x, y),
//       galaxyProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
//     };
//     this._instance = makeSolarSystemLayer(this.props);
//     this._context ??= getContext(this.canvas.value, this.props);
//     render(this._context, this._instance!);
//     this.weight.value = this.props.weight;
//     this.childLayer?.render(this, 0, 0);
//   }
//   props?: SolarSystemProps;
//   weights(x: number, y: number) {
//     return this._instance!.weights(x, y);
//   }
// }

// class PlanetLayer implements Layer {
//   private _instance?: PlanetLayerx;
//   private _context: CanvasRenderingContext2D | null = null;
//   childLayer?: Layer;
//   title = "planet";
//   description =
//     "each dot is a point on a point on the planet sized region of the solar system";
//   canvas = ref<HTMLCanvasElement>();
//   hoverData = ref(0);
//   weight = ref(0);
//   click(event: MouseEvent) {}
//   hover(event: MouseEvent) {
//     this.hoverData.value = this._instance!.heights(
//       ...coordFromEvent(event, this.props!)
//     );
//   }
//   render(prevLayer: SolarSystemLayer, x: number, y: number) {
//     this.props = {
//       width: prevLayer.props!.width,
//       height: prevLayer.props!.height,
//       seed: prevLayer.weights(x, y),
//       weight: prevLayer.weights(x, y),
//       solarSystemProps: toRaw(prevLayer.props!), // TODO don't use exclamation mark
//       camera: { x: 0, y: 0 },
//     };
//     this._instance = makePlanetLayer(this.props);
//     this._context ??= getContext(this.canvas.value, this.props);
//     render(this._context, this._instance!);
//     this.weight.value = this.props.weight;
//   }
//   props?: PlanetProps;
// }

onMounted(async () => {
  // const actualUniverseWeightKg = 1e53;
  const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
  // const milkyWayWeightKg = 2.7e27;
  // const earthWeightKg = 5.9e24;

  universe.update({
    height: 200,
    width: 200,
    seed: 1234567890,
    weight: thisUniverseWeightKg,
  });
  // galaxy.select(0, 0);
  // solarSystem.select(0, 0);
  // planet.select(0, 0);
  galaxy.update({
    height: universe.props.value.height,
    width: universe.props.value.width,
    seed: universe.engine.weights(0, 0),
    weight: universe.engine.weights(0, 0),
    galaxyAvgerageWeight:
      universe.props.value.weight /
      universe.props.value.width /
      universe.props.value.height,
  });
  solarSystem.update({
    height: galaxy.props.value.height,
    width: galaxy.props.value.width,
    seed: galaxy.engine.weights(0, 0),
    weight: galaxy.engine.weights(0, 0),
  });

  planet.update({
    height: solarSystem.props.value.height,
    width: solarSystem.props.value.width,
    seed: solarSystem.engine.weights(0, 0),
    weight: solarSystem.engine.weights(0, 0),
    camera: { x: 0, y: 0 },
  });

  document.addEventListener("keydown", onKeyDown);
});

// const universeProps = ref<UniverseProps>({
//   height: 200,
//   width: 200,
//   seed: 23432424,
//   weight: 1222,
// });

// const galaxyProps = ref<GalaxyProps>({
//   height: 200,
//   width: 200,
//   seed: 0,
//   weight: 0,
//   // universeProps,
// });

// const solarSystemProps = ref<SolarSystemProps>({
//   height: 200,
//   width: 200,
//   seed: 0,
//   weight: 0,
//   // galaxyProps,
// });

// const planetProps = ref<PlanetProps>({
//   height: 200,
//   width: 200,
//   seed: 0,
//   weight: 0,
//   // solarSystemProps,
//   camera: { x: 0, y: 0 },
// });

// interface Engine {
//   at(x: number, y: number): string;
// }

interface Dimensions {
  width: number;
  height: number;
}

function makeLayer<T1, T2>(
  title: string,
  description: string,
  update: (props: T2) => T1,
  getData: (
    engine: T1,
    x: number,
    y: number
  ) => {
    hover: number;
  },
  select: (x: number, y: number) => void
) {
  const layer = {
    meta: { title, description },
    props: ref<T2 & Dimensions>({
      width: 0,
      height: 0,
    } as T2 & Dimensions),
    data: ref({
      hover: 0,
    }),
    update: (props: T2 & Dimensions) => {
      layer.props.value = props;
      Object.assign(layer.engine as any, update(props));
    },
    select,
    render: () => {
      const dimensions = {
        width: layer.props.value.width,
        height: layer.props.value.height,
      };
      layer.canvas.context ??= getContext(
        layer.canvas.element.value,
        dimensions
      );
      render(layer.canvas.context, layer.engine);
    },
    canvas: {
      element: ref<HTMLCanvasElement>(),
      context: null as CanvasRenderingContext2D | null,
      click(event: MouseEvent) {
        select(...coordFromEvent(event, layer.props.value));
      },
      hover(event: MouseEvent) {
        layer.data.value = getData(
          layer.engine,
          ...coordFromEvent(event, layer.props.value)
        );
      },
    },
    engine: {} as T1 & Layerx,
  };

  watch(layer.props, layer.render);
  return layer;
}

const universe = makeLayer(
  "universe",
  "each dot is a galaxy",
  (props: UniverseProps) => {
    const generator = new PointGenerator(props.seed);
    const scale = props.weight / props.height / props.width;
    const weights = (x: number, y: number) => generator.getPoint(x, y) * scale;
    const pixel = (x: number, y: number) => {
      const n = generator.getPoint(x, y);
      return [n, n, n];
    };
    return { props, weights, pixel } as UniverseLayerx;
  },
  (engine: UniverseLayerx, x: number, y: number) => ({
    hover: engine.weights(x, y),
  }),
  (x: number, y: number) => {
    galaxy.update({
      height: universe.props.value.height,
      width: universe.props.value.width,
      seed: universe.engine.weights(x, y),
      weight: universe.engine.weights(x, y),
      galaxyAvgerageWeight:
        universe.props.value.weight /
        universe.props.value.width /
        universe.props.value.height,
    });
    galaxy.select(0, 0);
    solarSystem.select(0, 0);
  }
);

const galaxy = makeLayer(
  "galaxy",
  "each dot is a solar system",
  (props: GalaxyProps) => {
    const generator = new PointGenerator(props.seed);
    const scale = props.weight / props.height / props.width;
    const weights = (x: number, y: number) => generator.getPoint(x, y) * scale;
    const weightDiffToAverage = props.weight / props.galaxyAvgerageWeight;
    const weightRange = 1;
    const pixel = (x: number, y: number) => {
      const v = generator.getPoint(x, y);
      const n = (v / weightRange) ** (20 / weightDiffToAverage);
      return [n, n, n];
    };
    return { props, weights, pixel } as GalaxyLayerx;
  },
  (engine: GalaxyLayerx, x: number, y: number) => ({
    hover: engine.weights(x, y),
  }),
  (x: number, y: number) => {
    solarSystem.update({
      height: galaxy.props.value.height,
      width: galaxy.props.value.width,
      seed: galaxy.engine.weights(x, y),
      weight: galaxy.engine.weights(x, y),
    });
    solarSystem.select(0, 0);
  }
);

const solarSystem = makeLayer(
  "solar system",
  "each dot is a sun, planet, moon, asteroid",
  (props: SolarSystemProps) => {
    const generator = new PointGenerator(props.seed);
    const scale = props.weight / props.height / props.width;
    const weights = (x: number, y: number) => generator.getPoint(x, y) * scale;
    const floats = (x: number, y: number) => generator.getPoint(x, y) ** 100;
    const hueSeed = 136395369829;
    const hues = (x: number, y: number) =>
      generator.getPoint(x * hueSeed, y * hueSeed) * scale;
    const pixel = (x: number, y: number) => {
      const v = floats(x, y);
      const h = hues(x, y);
      const [r, g, b] = hsv2rgb(h, 1, 1).map((v) => v / 4 + 0.75);
      return [v * r, v * g, v * b];
    };
    return { props, weights, pixel } as SolarSystemLayerx;
  },
  (engine: SolarSystemLayerx, x: number, y: number) => ({
    hover: engine.weights(x, y),
  }),
  (x: number, y: number) => {
    const newP = {
      height: solarSystem.props.value.height,
      width: solarSystem.props.value.width,
      seed: solarSystem.engine.weights(x, y),
      weight: solarSystem.engine.weights(x, y),
      camera: { x: 0, y: 0 },
    };
    console.log("solarSystem", x, y, newP);

    planet.update(newP);
  }
);

const planet = makeLayer(
  "planet",
  "each dot is a point on a point on the planet sized region of the solar system",
  (props: PlanetProps) => {
    const generator = new PointGenerator(props.seed);
    const filterRadius = 10;
    const filter = diskFilter(filterRadius);
    const scale = props.weight / 3.6e22; // multiplying heights by this makes planets all water or land, which is like what I want but not today, the number was just somewhere in the middle of expected values
    const heights = (x: number, y: number) => {
      const padHeight = Math.floor(filter.length / 2);
      const padWidth = Math.floor(filter[0].length / 2);
      let sum = 0;
      for (let fy = 0; fy < filter.length; fy++) {
        for (let fx = 0; fx < filter[0].length; fx++) {
          const px = x + 20 + fx - padWidth;
          const py = y + 20 + fy - padHeight;
          sum += filter[fy][fx] * generator.getPoint(px, py);
        }
      }
      return ((sum - 0.5) * filterRadius) / 2 + 0.5;
    };
    const pixel = (x: number, y: number) => {
      const n = heights(x, y);
      return n > 0.5 //
        ? [n - 0.5, n - 0.25, 0]
        : [0, n, n + 0.5];
    };
    return { props, heights, pixel } as PlanetLayerx;
  },
  (engine: PlanetLayerx, x: number, y: number) => ({
    hover: engine.heights(x, y),
  }),
  (x: number, y: number) => {}
);

const layers = {
  universe,
  galaxy,
  solarSystem,
  planet,
};

// const layers = [universe, galaxy, solarSystem, planet];

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
