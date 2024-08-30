<template>
  <transition name="slide">
    <div v-if="isOpen" class="menu">
      <nav>
        <ul>
          <li>
            <router-link to="/" @click="toggle()">Home</router-link>
          </li>
          <li>
            <router-link to="/seaside" @click="toggle()">Seaside </router-link>
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
          <li>
            <router-link to="/oldskool-fire" @click="toggle()"
              >Oldskool Fire</router-link
            >
          </li>
          <li>
            <router-link to="/fft" @click="toggle()">FFT</router-link>
          </li>
          <li>
            <router-link to="/tic-tac-toe" @click="toggle()"
              >tic-tac-toe</router-link
            >
          </li>
          <li>
            <router-link to="/sierpinski" @click="toggle()"
              >Sierpinski</router-link
            >
          </li>
          <li>
            <router-link to="/mandelbrot" @click="toggle()"
              >Mandelbrot</router-link
            >
          </li>
          <li>
            <router-link to="/stocks" @click="toggle()">Stocks</router-link>
          </li>
          <li>
            <router-link to="/google-maps" @click="toggle()"
              >Google Maps</router-link
            >
          </li>
          <li>
            <router-link to="/google-auth" @click="toggle()"
              >Google Auth</router-link
            >
          </li>
          <li>
            <router-link to="/flat-css" @click="toggle()">flat.css</router-link>
          </li>
          <li>
            <router-link to="/quantum-particles" @click="toggle()"
              >Quantum Particles</router-link
            >
          </li>
          <li>
            <router-link to="/n-queens" @click="toggle()">n-Queens</router-link>
          </li>
          <li>
            <router-link to="/chess" @click="toggle()">Chess</router-link>
          </li>
          <!-- <li>
            <router-link to="/card-game" @click="toggle()">Card Game</router-link>
          </li> -->
          <li>
            <router-link to="/noise" @click="toggle()">Noise</router-link>
          </li>
          <li>
            <router-link to="/curves" @click="toggle()">Curves</router-link>
          </li>
          <li>
            <router-link to="/world" @click="toggle()">World</router-link>
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
a {
  width: 100%;
  box-shadow: 0 0 0.3em rgba(0, 0, 0, 0.3);
  color: #333;
  font-size: 1.1em;
  display: block;
  padding: 0.5em;
  text-align: center;
  line-height: 3em;
}

ul {
  list-style: none;
  display: flex;
  flex-flow: row wrap;
  margin: -0.5em;
}

li {
  flex: 1 0;
  min-width: 10em;
  display: flex;
  margin: 0.5em;
}

.menu {
  height: 100%;
  position: fixed;
  z-index: 100;
  width: 80%;
  background-color: var(--background-color);
  top: 0;
  left: 0;
  padding: 4em 1em 1em;
  box-shadow: 0.1em 0.1em 0.5em rgba(0, 0, 0, 0.5);
  overflow: auto;
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
