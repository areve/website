<template>
  <transition name="fade">
    <div v-if="isOpen" class="menu">
      <nav>
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/seaside">Seaside</router-link></li>
        </ul>
      </nav>
    </div>
  </transition>
  <button
    class="standard toggle-button"
    v-on:click="toggle"
    aria-label="Toggle Sidebar"
  >
    <span v-if="!isOpen">&#9776;</span>
    <span v-if="isOpen">&times;</span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "Menu",
  data() {
    return {
      isOpen: false,
    };
  },
  setup: () => ({}),
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
});
</script>

<style scoped>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
}

a {
  color: #333;
  font-size: 1.1em;
  display: block;
  padding: 0.5em 0em;
}

.menu {
  height: 100%;
  position: fixed;
  z-index: 100;
  min-width: 20vmin;
  min-height: 20vmin;
  background-color: #f7f7f7;
  top: 0;
  right: 0;
  padding: 4em 1em 1em;
  box-shadow: 0.1em 0.1em 0.5em rgba(0, 0, 0, 0.5);
}

.toggle-button {
  position: fixed;
  width: 3em;
  text-align: center;
  z-index: 200;
  top: 1em;
  right: 1em;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20vmin);
}
</style>
