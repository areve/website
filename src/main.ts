import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

import { Buffer } from "buffer";
(globalThis as any).Buffer = Buffer;
(window as any).Buffer = Buffer;

const app = createApp(App);
app.use(router);
app.mount("#app");
