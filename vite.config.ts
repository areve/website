import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import assemblyScriptPlugin from "vite-plugin-assemblyscript-asc";

export default defineConfig({
  plugins: [
    vue({
      plugins: [assemblyScriptPlugin()],
      template: {
        compilerOptions: {
          whitespace: "preserve",
        } as unknown,
      },
    }),
  ],
});
