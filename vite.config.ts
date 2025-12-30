
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY),
    'process.env.SENDGRID_API_KEY': JSON.stringify(process.env.SENDGRID_API_KEY),
    'process.env.SENDGRID_FROM_EMAIL': JSON.stringify(process.env.SENDGRID_FROM_EMAIL)
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, '')
      }
    }
  }
});
