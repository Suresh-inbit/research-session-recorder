import { defineConfig } from 'vite';
import { resolve } from 'path';

// Content scripts are classic scripts: they cannot `import` shared chunks, so they
// are bundled on their own as one self-contained IIFE. Runs after the main build.
const browser = process.env.VITE_BROWSER || 'chrome';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  publicDir: false,
  build: {
    outDir: `dist/${browser}`,
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'RsrContent',
      fileName: () => 'content.js',
    },
  },
});
