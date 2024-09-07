import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // alias: {
    //   "three/addons": "three/examples/jsm",
    //   "three/tsl": "three/webgpu",
    //   three: "three/webgpu",
    // },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: "preserve",
        },
      },
    }),
  ],
});
