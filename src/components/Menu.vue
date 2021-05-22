<template>
  <transition name="slide">
    <div v-if="isOpen" class="menu">
      <nav>
        <ul>
          <li>
            <router-link to="/" @click="toggle()">Home</router-link>
          </li>
          <li>
            <router-link to="/seaside" @click="toggle()">Seaside</router-link>
          </li>
          <li>
            <router-link to="/colours" @click="toggle()">Colours</router-link>
          </li>
          <li>
            <router-link to="/azure-ad" @click="toggle()">Azure AD</router-link>
          </li>
          <li>
            <router-link to="/azure-b2c" @click="toggle()"
              >Azure B2C</router-link
            >
          </li>
        </ul>
      </nav>
    </div>
  </transition>
  <transition name="fade">
    <div class="overlay" v-if="isOpen" @click="toggle()"></div>
  </transition>

  <button
    class="standard toggle-button"
    @click="toggle"
    aria-label="Toggle Sidebar"
  >
    &#9776;
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ref } from "vue";

export default defineComponent({
  name: "Menu",
  setup() {
    return {
      isOpen: ref(false),
    };
  },
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
  left: 0;
  padding: 4em 1em 1em;
  box-shadow: 0.1em 0.1em 0.5em rgba(0, 0, 0, 0.5);
}

.overlay {
  z-index: 99;
  background-color: #000;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: 0.8;
}
.toggle-button {
  position: fixed;
  top: 1em;
  left: 1em;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20vmin);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
