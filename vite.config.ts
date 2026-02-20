import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "8081-ink3giuifrdiiqzfub3tk-3c0907b9.us2.manus.computer",
      "8082-ink3giuifrdiiqzfub3tk-3c0907b9.us2.manus.computer",
      "localhost",
      ".manus.computer"
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
