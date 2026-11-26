import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const browser = process.env.VITE_BROWSER || 'chrome';
const outDir = `dist/${browser}`;
// In watch mode we must not wipe the dir: content.js is built by a separate config.
const watching = process.argv.includes('--watch');

/** Rewrite the copied manifest for the target browser. */
function manifestPlugin(browser: string): Plugin {
  return {
    name: 'manifest-plugin',
    closeBundle() {
      const manifestPath = resolve(__dirname, outDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) return;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      if (browser === 'chrome') {
        delete manifest.background.scripts;
        delete manifest.browser_specific_settings;
      } else if (browser === 'firefox') {
        manifest.sidebar_action = {
          default_panel: manifest.side_panel?.default_path || 'src/sidepanel/index.html',
        };
        delete manifest.side_panel;
        // AMO requires a data-collection declaration. Nothing leaves the device, so "none".
        manifest.browser_specific_settings.gecko.strict_min_version = '140.0';
        manifest.browser_specific_settings.gecko.data_collection_permissions = { required: ['none'] };
        manifest.permissions = manifest.permissions.filter((p: string) => p !== 'sidePanel');

        // Chrome opens the panel from a custom command; Firefox has a built-in one.
        if (manifest.commands?.['open-side-panel']) {
          manifest.commands._execute_sidebar_action = manifest.commands['open-side-panel'];
          delete manifest.commands['open-side-panel'];
        }
      }

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    },
  };
}

/**
 * The icon-font CSS ships .eot/.woff/.woff2 for every style. Extensions only run in
 * modern browsers, so keep woff2 only (cuts ~10 MB from the package).
 */
const keepWoff2Only = {
  postcssPlugin: 'keep-woff2-only',
  Declaration: {
    src(decl: { value: string; parent?: { type: string; name?: string } }) {
      if (decl.parent?.type !== 'atrule' || decl.parent.name !== 'font-face') return;
      const kept = decl.value.split(/,(?=\s*url\()/).filter((part) => /format\(\s*["']woff2["']\s*\)/.test(part));
      const next = kept.join(',');
      if (kept.length > 0 && next !== decl.value) decl.value = next;
    },
  },
};

/** Drop the legacy font files that keepWoff2Only no longer references. */
const dropLegacyFontAssets: Plugin = {
  name: 'drop-legacy-font-assets',
  generateBundle(_options, bundle) {
    for (const key of Object.keys(bundle)) {
      if (/\.(eot|woff)$/.test(key)) delete bundle[key];
    }
  },
};

export default defineConfig({
  plugins: [react(), manifestPlugin(browser), dropLegacyFontAssets],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: { plugins: [keepWoff2Only] },
  },
  build: {
    outDir,
    emptyOutDir: !watching,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        // The content script is built separately (vite.content.config.ts) as a
        // self-contained IIFE, because content scripts cannot import chunks.
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
