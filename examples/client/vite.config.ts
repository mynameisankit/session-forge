import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");
  const proxy = {
    "/api": {
      target: env.BACKEND_URL || "http://127.0.0.1:3000",
      // Keep the browser's origin so the backend can validate same-origin requests.
      changeOrigin: false,
    },
  };

  return {
    publicDir: fileURLToPath(new URL("../../assets", import.meta.url)),
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { proxy },
    preview: { proxy },
  };
});
