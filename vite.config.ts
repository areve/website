import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import assemblyScriptPlugin from "vite-plugin-assemblyscript-asc";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    assemblyScriptPlugin(),
    vue({
      template: {
        compilerOptions: {
          whitespace: "preserve",
        },
      },
    }),
  ],
});
