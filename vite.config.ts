
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080, // Setting the port to 8080 as required
    // Allow all hosts for Lovable projects
    allowedHosts: true, // Changed from "all" to true to match expected type
    hmr: {
      // Configure HMR to use secure WebSocket when in production
      clientPort: process.env.NODE_ENV === 'production' ? 443 : undefined,
      protocol: process.env.NODE_ENV === 'production' ? 'wss' : 'ws',
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
