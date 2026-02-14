import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";
import path from "path";

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  throw new Error("API_URL must be set");
}

export default defineConfig({
  plugins: [pluginReact()],

  tools: {
    rspack: {
      plugins: [TanStackRouterRspack()],
    },
  },

  server: {
    port: 3000,
    // Proxy API requests to backend
    proxy: {
      "/api": {
        target: apiUrl,
        changeOrigin: true,
      },
    },
  },

  html: {
    template: "./index.html",
    title: "Farm Manager",
  },

  output: {
    distPath: {
      root: "dist",
    },
    assetPrefix: "/",
  },

  source: {
    entry: {
      index: "./src/main.tsx",
    },
    define: {
      "process.env.API_URL": JSON.stringify(apiUrl),
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  performance: {
    chunkSplit: {
      strategy: "split-by-experience",
    },
  },
});
