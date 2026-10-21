import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ports 5173/3001 are commonly taken by other local projects, so CampusConnect
// uses its own: web on 5180, API on 4000 (see VITE_API_URL in .env.example).
export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  preview: { port: 4180 },
});
