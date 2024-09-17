<template>
  <section>
    <h1>World</h1>
    <p>A pseudo random number generated world map</p>
    <div class="panels">
    
      <div class="panel">
        <p>
      <div>WebGPUWorld3d</div>
      <WebGPUWorld3d />
    </p>
        <div class="photo">
          <img
            src="./assets/New-global-view.width-1000.format-webp.webp"
            width="500"
            height="200"
          />
        </div>
        <div class="caption">Photo map for reference</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
    import WebGPUWorld3d from "./WebGPUWorld3d/WebGPUWorld3d.vue";
</script>


<style scoped>

</style>
