import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

import * as Buffer from "buffer";
(window as any).Buffer = Buffer;

const app = createApp(App);
app.use(router);
app.mount("#app");
