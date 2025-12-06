// client/vite.config.js (or .ts)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // This proxy only runs during 'npm run dev' on your computer
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // Your local Express server port
        changeOrigin: true,
        // You may need to add a rewrite rule if your backend doesn't expect the /api prefix
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
  // ... other config
});