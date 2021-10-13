<template>
  <h1>Google Auth</h1>
  <p>Example of using Google Auth.</p>
  <article class="profile" v-if="profile?.id">
    <img
      class="profile-image"
      referrerpolicy="no-referrer"
      :src="profile.imageUrl"
      width="50"
      height="50"
    />
    <h2 class="profile-name">{{ profile.name }}</h2>
    <p class="profile-email">{{ profile.email }}</p>
  </article>

  <button
    type="button"
    @click="signIn"
    :disabled="!isInit"
    v-if="!isAuthorized"
  >
    Sign-in
  </button>
  <button
    type="button"
    @click="signOut"
    :disabled="!isInit"
    v-if="isAuthorized"
  >
    Sign-out
  </button>
  <pre v-if="showDebug">
isInit: {{ isInit }}
isAuthorized: {{ isAuthorized }}
profile: {{ profile }}
    </pre
  >
  <!-- TODO Remove code from main.ts if possible -->
</template>

<script lang="ts">
import { defineComponent } from "vue";
import googleAuth from "vue3-google-auth";
import { router } from "../../router";

const gAuth = googleAuth.createGAuth({
  clientId: '416446233465-ohu915ducvkina65jp1ombdae6urbnue.apps.googleusercontent.com',
  scope: 'profile email',
  prompt: 'select_account',
  ux_mode: 'redirect',
  redirect_uri: document.location.origin
});

export default defineComponent({
  name: "GoogleAuth",
  components: {},
  mounted() {
    let checkGauthLoad = setInterval(() => {
      this.isInit = !!gAuth.isInit;
      this.isAuthorized = !!gAuth.isAuthorized;
      this.profile = this.googleUserToProfile(
        gAuth?.GoogleAuth?.currentUser?.get()
      );
      if (this.isInit) {
        clearInterval(checkGauthLoad);
        router.replace({ path: "/google-auth" });
      }
    }, 200);
  },
  data: () => {
    return {
      isInit: false,
      isAuthorized: false,
      showDebug: false,
      profile: {} as any,
    };
  },
  methods: {
    googleUserToProfile(googleUser: any) {
      const profile = googleUser?.getBasicProfile();
      return (
        (profile && {
          id: profile.getId(),
          name: profile.getName(),
          givenName: profile.getGivenName(),
          familyName: profile.getFamilyName(),
          imageUrl: profile.getImageUrl(),
          email: profile.getEmail(),
        }) ||
        {}
      );
    },
    async signIn() {
      const googleUser = await gAuth.signIn();
      this.isAuthorized = gAuth.isAuthorized;
      this.profile = this.googleUserToProfile(googleUser);
    },
    async signOut() {
      await gAuth.signOut();
      this.isAuthorized = gAuth.isAuthorized;
      this.profile = {};
    },
  },
});
</script>

<style scoped>
.profile {
  padding: 2em 0 2em 0;
  display: grid;
  grid-template-columns: calc(50px + 1em) 1fr;
  width: fit-content;
}

.profile-image {
  grid-column: 1 / 1;
  grid-row: 1 / span 2;
  border-radius: 50%;
}

.profile-name {
  font-size: 1.2em;
  font-weight: normal;
  margin: 0 0 0.3em 0;
  grid-column: 2 / 2;
  grid-row: 1 / 2;
}
.profile-email {
  margin: 0;
  grid-column: 2 /2;
  grid-row: 2 / 2;
}
</style>
