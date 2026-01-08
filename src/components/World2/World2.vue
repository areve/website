<template>
  <section>
    <h1>World</h1>
    <p>
      A pseudo random number generated world map.
      Controls and keyboard shortcuts are listed below for quick reference.
    </p>
    <ul class="controls">
      <li><kbd>Mouse</kbd>: drag to pan, scroll/wheel to zoom</li>
      <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>: pan the view (A = left, D = right, W = up, S = down)</li>
      <li><kbd>'</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard accelerator)</li>
      <li><kbd>Space</kbd> or <kbd>P</kbd>: pause / resume animation; double-click/tap also toggles pause</li>
      <li>Touch: two-finger pinch to zoom, drag to pan</li>
    </ul>
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
