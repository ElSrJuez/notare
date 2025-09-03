import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/normalize': 'http://localhost:8000',
      '/outline':   'http://localhost:8000',
      '/pptx':      'http://localhost:8000'
     }
   }
 });
