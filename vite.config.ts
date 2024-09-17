import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // prefixing with any none _ character, because of a gh-pages issue I think
        entryFileNames: `x[name].[hash].js`,
        chunkFileNames: `x[name].[hash].js`,
        assetFileNames: `x[name].[hash].[ext]`
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
