<template>
  <Menu />
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Menu from "./components/Menu/Menu.vue";
export default defineComponent({
  name: "App",
  components: {
    Menu,
  },
});
</script>

<style>
body {
  font-family: Roboto, Verdana, Geneva, Tahoma, sans-serif;
  font-weight: 300;
}

h1 {
  font-weight: 100;
  letter-spacing: 0.1em;
  font-size: 4em;
}

h2 {
  font-weight: 100;
  letter-spacing: 0.1em;
  font-size: 2.5em;
}


h3 {
  font-weight: 300;
  letter-spacing: 0.1em;
  font-size: 1.25em;
}
</style>