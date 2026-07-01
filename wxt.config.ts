import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Scroll Meter",
    description: "See how far you really scroll — as real-world distance.",
    permissions: ["storage", "favicon"],
    action: { default_title: "Scroll Meter" },
  },
});
