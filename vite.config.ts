import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `a[name].[hash].v1.js`,
        chunkFileNames: `a[name].[hash].v1.js`,
        assetFileNames: `a[name].[hash].v1.[ext]`
      }
    }
  },
  resolve: {
    alias: {
      "three/addons": "three/examples/jsm",
      "three/tsl": "three/webgpu",
      three: "three/webgpu",
    },
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
