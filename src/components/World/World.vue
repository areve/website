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
        :weight="universe.weight"
        :dimensions="universe.dimensions"
        @coordSelected="galaxySelected"
      ></UniverseLayer>
    </div>
    <div class="row">
      <GalaxyLayer
        :seed="galaxy.seed"
        :dimensions="galaxy.dimensions"
        @coordSelected="solarSystemSelected"
        :weight="galaxy.weight"
        :galaxyAverageWeight="galaxy.galaxyAverageWeight"
      ></GalaxyLayer>
    </div>
    <div class="row">
      <SolarSystemLayer
        :seed="solarSystem.seed"
        :dimensions="solarSystem.dimensions"
        @coordSelected="planetSelected"
        :weight="solarSystem.weight"
      ></SolarSystemLayer>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { Coord, Dimensions } from "./maps/makeLayer";
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

const thisUniverseWeightKg = 1e37; // 1e37 because it makes solar system weight similar to milky way
// const actualUniverseWeightKg = 1e53;
// const milkyWayWeightKg = 2.7e27;
// const earthWeightKg = 5.9e24;

const universe = ref<UniverseProps>({
  seed: 123.456,
  weight: thisUniverseWeightKg,
  dimensions: { width: 200, height: 200 },
});

const galaxy = ref<GalaxyProps>({
  weight: 0,
  seed: 0,
  dimensions: universe.value.dimensions,
  galaxyAverageWeight:
    universe.value.weight /
    universe.value.dimensions.height /
    universe.value.dimensions.width,
});

const solarSystem = ref<SolarSystemProps>({
  weight: 0,
  seed: 0,
  dimensions: universe.value.dimensions,
});

const galaxySelected = (args: UniverseCoordSelected) => {
  galaxy.value = cloneExtend(galaxy.value, {
    seed: args.weight,
    weight: args.weight,
  });
};

const solarSystemSelected = (args: GalaxyCoordSelected) => {
  solarSystem.value = cloneExtend(solarSystem.value, {
    seed: args.weight,
    weight: args.weight,
  });
};

const planetSelected = (args: SolarSystemCoordSelected) => {
  console.log(args);
  // galaxy.value = cloneExtend(galaxy.value, {
  //   seed: 122,
  //   weight: 1234,
  // });
};

onMounted(async () => {
  document.addEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  // const props = clone(planet.props.value);
  // if (event.key === "a") props.camera.x -= 50;
  // if (event.key === "d") props.camera.x += 50;
  // if (event.key === "w") props.camera.y -= 50;
  // if (event.key === "s") props.camera.y += 50;
  // planet.props.value = props;
};
</script>

<style>
.world {
  .row {
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
  .data {
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
}
</style>
