import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config: React + Tailwind plugins
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Parent folder-la irukka shared/ code-ah use panna allow
    fs: { allow: ['..'] },
    // Frontend-la '/api' nu call pannaa, adhu backend (port 5000) ku pogum
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
