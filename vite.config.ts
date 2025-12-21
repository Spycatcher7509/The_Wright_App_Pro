
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Specifically target the API_KEY to ensure it's baked into the bundle
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY)
  }
});
