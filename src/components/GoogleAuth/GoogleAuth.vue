<template>
  <h1>Google Auth</h1>
  <p>Example of using Google Auth.</p>

  <button @click="signIn" :disabled="!isInit || isAuthorized">Sign In</button>
  <button @click="signOut" :disabled="!isInit || !isAuthorized">
    Sign Out
  </button>
  <p>Username: {{ username }}</p>
  <pre>
isInit: {{ isInit }}
isAuthorized: {{ isAuthorized }}
googleUser: {{ googleUser }}
    </pre
  >
  <!-- TODO Remove code from main.ts if possible -->
</template>

<script lang="ts">
import { defineComponent } from "vue";
import gAuth from "vue3-google-auth";

export default defineComponent({
  name: "GoogleAuth",
  components: {},
  mounted() {
    const $gAuth = gAuth.useGAuth();
    let checkGauthLoad = setInterval(() => {
      this.isInit = !!$gAuth.isInit;
      this.isAuthorized = !!$gAuth.isAuthorized;
      this.$gAuth = $gAuth;
      this.googleUser = this.$gAuth?.GoogleAuth?.currentUser?.Xd;
      this.username = this.googleUser?.dt?.Se
      if (this.isInit) clearInterval(checkGauthLoad);
    }, 100);
  },
  data: () => {
    return {
      isInit: false,
      isAuthorized: false,
      $gAuth: null as any,
      googleUser: null as any,
      username: null as any
    };
  },
  methods: {
    async signIn() {
      const googleUser = await this.$gAuth.signIn();
      this.isAuthorized = this.$gAuth.isAuthorized;
      this.googleUser = googleUser;
      this.username = this.googleUser?.dt?.Se
    },
    async signOut() {
      await this.$gAuth.signOut();
      this.isAuthorized = this.$gAuth.isAuthorized;
      this.googleUser = null;
      this.username = null;
    },
  },
});
</script>

<style scoped>
</style>
