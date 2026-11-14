/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // gilbertanderson.github.io is a user site, served from the domain root.
  // (A project site would need base: '/<repo-name>/'.)
  base: '/',
  server: {
    // In dev, /api goes to the FastAPI server (uvicorn on :8000).
    proxy: { '/api': process.env.API_PROXY ?? 'http://localhost:8000' },
  },
  test: {
    environment: './src/test/jsdom-env.ts',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_URL: 'http://api.test' },
  },
});
