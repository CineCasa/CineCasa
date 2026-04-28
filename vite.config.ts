import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      overlay: false,
    },
    fs: {
      strict: false,
    },
  },
  build: {
    // Ignorar erros de TypeScript durante o build
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    // Copy _redirects file after build
    rollupOptions: {
      plugins: [
        {
          name: 'copy-redirects',
          writeBundle() {
            try {
              if (fs.existsSync('public/_redirects')) {
                // Ensure dist directory exists
                if (!fs.existsSync('dist')) {
                  fs.mkdirSync('dist', { recursive: true });
                }
                fs.copyFileSync('public/_redirects', 'dist/_redirects');
                console.log('✓ _redirects copied to dist');
              } else {
                console.log('⚠️ public/_redirects not found, skipping copy');
              }
            } catch (e) {
              console.error('Failed to copy _redirects:', e);
              // Don't throw to avoid breaking the build
            }
          }
        }
      ]
    }
  },
  esbuild: {
    // Ignorar erros de type checking
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
