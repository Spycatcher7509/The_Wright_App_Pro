
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Maps API_KEY from GEMINI_API_KEY if that's what is set in Netlify
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY),
    'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY)
  }
});
