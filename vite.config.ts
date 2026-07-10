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
    // Config-neutral: the dev-server bind host and any extra allowed hosts are supplied by the
    // instance running this repo (its supervisor), never hardcoded here — see site/PREVIEW.md.
    // Defaults are portable (loopback-only, no extra allowed hosts) for a plain `npm run dev`
    // outside any particular instance's networking.
    host: process.env.VITE_DEV_HOST || "127.0.0.1",
    // The stable-preview contract requires failing loudly on a port conflict, not silently moving
    // to another port while the stable URL keeps pointing at the configured one.
    strictPort: true,
    allowedHosts: process.env.VITE_DEV_ALLOWED_HOSTS
      ? process.env.VITE_DEV_ALLOWED_HOSTS.split(",").map((h) => h.trim()).filter(Boolean)
      : undefined,
    // /workspace is a MooseFS network mount; inotify never fires, so HMR is
    // dead without polling. interval kept modest to limit CPU on the volume.
    watch: { usePolling: true, interval: 300 },
  },
})
