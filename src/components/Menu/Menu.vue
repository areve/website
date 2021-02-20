<template>
  <nav>
    <router-link class="button" to="/">Home</router-link>
    {{ " " }}
    <router-link class="button" to="/seaside">Seaside</router-link>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "Menu",
  setup: () => ({}),
});
</script>

<style scoped>
</style>
