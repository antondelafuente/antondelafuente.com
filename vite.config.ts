import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    strictPort: true,
    allowedHosts: [".proxy.runpod.net", "always-on-controller", ".tail97105e.ts.net"],
    // /workspace is a MooseFS network mount; inotify never fires, so HMR is
    // dead without polling. interval kept modest to limit CPU on the volume.
    watch: { usePolling: true, interval: 300 },
  },
})
