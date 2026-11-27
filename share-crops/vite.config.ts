import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// Served from https://gilbertanderson.com/share-crops/ on GitHub Pages.
// The site's own build copies this output into frontend/dist/share-crops.
// GitHub Pages can't send headers, so the policy ships as a meta tag. Added at
// build time only, because Vite's dev server injects inline scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function contentSecurityPolicy() {
  return {
    name: 'content-security-policy',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  base: '/share-crops/',
  plugins: [react(), contentSecurityPolicy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: process.env.SHARE_CROPS_OUT || 'dist',
    emptyOutDir: true,
  },
});
