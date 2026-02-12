import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";
import path from "path";

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
        target: "http://localhost:5001",
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
      "process.env.API_URL": JSON.stringify(
        process.env.API_URL || "http://localhost:5001",
      ),
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
