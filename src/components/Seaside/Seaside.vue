<template>
  <article>
    <h1>Seaside</h1>
    <p>
      Here is a sand castle that the kids and I made, our castles are not like
      everyone else’s.
    </p>
    <img
      class="sand-castle-photo"
      alt="Sand Castle Photo"
      src="./sand-castle.jpg"
    />
  </article>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
export default defineComponent({
  name: "Seaside",
  setup: () => ({}),
});
</script>

<style scoped>
.sand-castle-photo {
  max-width: 80vmin;
  max-height: 80vmin;
  padding: 1em;
  box-shadow: 0.1em 0.1em 0.5em rgba(0, 0, 0, 0.3);
}
</style>
