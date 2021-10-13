import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

import gAuth from 'vue3-google-auth';
const $gAuth = gAuth.createGAuth({
  clientId: '416446233465-ohu915ducvkina65jp1ombdae6urbnue.apps.googleusercontent.com',
  scope: 'profile email',
  prompt: 'select_account',
  ux_mode: 'redirect',
  redirect_uri: document.location.origin
});

const app = createApp(App);
app.use(router);
app.use($gAuth)
app.mount("#app");
