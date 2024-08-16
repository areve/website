<template>
  <section class="world">
    <h1>World</h1>
    <p>A psuedo random number generated world map</p>
    <p>
      click the maps to select a location, press W, A, S, D to pan the planet
    </p>

    <div class="row">
      <UniverseLayer
        :seed="universe.seed"
        :size="universe.size"
        :dimensions="universe.dimensions"
        @coordSelected="universeCoordSelected"
      ></UniverseLayer>
    </div>
    <div class="row">
      <GalaxyLayer
        :seed="galaxy.seed"
        :dimensions="galaxy.dimensions"
        @coordSelected="galaxyCoordSelected"
        :size="galaxy.size"
        :galaxyAverageWeight="galaxy.galaxyAverageWeight"
      ></GalaxyLayer>
    </div>
    <div class="row">
      <SolarSystemLayer
        :seed="solarSystem.seed"
        :dimensions="solarSystem.dimensions"
        @coordSelected="solarSystemCoordSelected"
        :size="solarSystem.size"
      ></SolarSystemLayer>
    </div>
    <div class="row">
      <PlanetLayer
        :seed="planet.seed"
        :dimensions="planet.dimensions"
        @coordSelected="planetCoordSelected"
        :size="planet.size"
        :camera="planet.camera"
      ></PlanetLayer>
    </div>
    <div class="row">
      <CountryLayer
        :seed="country.seed"
        :dimensions="country.dimensions"
        @coordSelected="countryCoordSelected"
        :size="country.size"
        :camera="country.camera"
      ></CountryLayer>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { clone, cloneExtend } from "./lib/other";
import UniverseLayer, {
  UniverseCoordSelected,
  UniverseProps,
} from "./UniverseLayer.vue";
import GalaxyLayer, {
  GalaxyCoordSelected,
  GalaxyProps,
} from "./GalaxyLayer.vue";
import SolarSystemLayer, {
  SolarSystemCoordSelected,
  SolarSystemProps,
} from "./SolarSystemLayer.vue";
import PlanetLayer, {
  PlanetCoordSelected,
  PlanetProps,
} from "./PlanetLayer.vue";
import CountryLayer, {
  CountryCoordSelected,
  CountryProps,
} from "./CountryLayer.vue";

const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
// const actualUniverseWeightKg = 1e53;
// const milkyWayWeightKg = 2.7e27;
// const earthWeightKg = 5.9e24;

const universe = ref<UniverseProps>({
  seed: 123.456,
  size: 1,
  dimensions: { width: 200, height: 200 },
});

const galaxy = ref<GalaxyProps>({
  size: 0,
  seed: 0,
  dimensions: universe.value.dimensions,
  galaxyAverageWeight:
    universe.value.size /
    universe.value.dimensions.height /
    universe.value.dimensions.width,
});

const solarSystem = ref<SolarSystemProps>({
  size: 0,
  seed: 0,
  dimensions: galaxy.value.dimensions,
});

const planet = ref<PlanetProps>({
  size: 0,
  seed: 0,
  dimensions: solarSystem.value.dimensions,
  camera: { x: 0, y: 0 },
});

const country = ref<CountryProps>({
  size: 0,
  seed: 0,
  dimensions: planet.value.dimensions,
  camera: { x: 0, y: 0 },
});

const universeCoordSelected = (args: UniverseCoordSelected) => {
  galaxy.value = cloneExtend(galaxy.value, {
    seed: args.size,
    size: args.size,
  });
};

const galaxyCoordSelected = (args: GalaxyCoordSelected) => {
  solarSystem.value = cloneExtend(solarSystem.value, {
    seed: args.size,
    size: args.size,
  });
};

const solarSystemCoordSelected = (args: SolarSystemCoordSelected) => {
  planet.value = cloneExtend(planet.value, {
    seed: args.size,
    size: args.size,
  });
};

const planetCoordSelected = (args: PlanetCoordSelected) => {
  country.value = cloneExtend(country.value, {
    seed: args.size,
    size: args.size,
  });
};
const countryCoordSelected = (args: CountryCoordSelected) => {};

onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  const props = clone(planet.value);
  if (event.key === "a") props.camera.x -= 50;
  if (event.key === "d") props.camera.x += 50;
  if (event.key === "w") props.camera.y -= 50;
  if (event.key === "s") props.camera.y += 50;
  planet.value = props;
};
</script>

<style>

.world .row {
    display: flex;
    margin-bottom: 5px;
  }
.world .title {
    font-weight: 500;
  }
.world .info {
    font-size: 0.9em;
    line-height: 1.2em;
  }
.world .data {
    font-size: 0.9em;
    line-height: 1.2em;
  }
.world .notes {
    flex: 1 1;
    background-color: #eee;
    margin-left: 5px;
    padding: 5px;
  }
.world .canvas-wrap {
    position: relative;
    height: 200px;
    width: 200px;
  }
.world .canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 0px solid #999;
  }

</style>
