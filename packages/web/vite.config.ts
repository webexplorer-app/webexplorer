import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { alphaTab } from './plugins/alphatab-vite/alphaTabVitePlugin'
import { VitePWA } from 'vite-plugin-pwa'

const nodePolyfillsPluginOptions = nodePolyfills({
  // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
  include: ['stream'],
  // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
  exclude: [],
  // Whether to polyfill specific globals.
  globals: {
    Buffer: 'build',
    global: 'build',
    process: 'build',
  },
  // Override the default polyfills for specific modules.
  overrides: {
    // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
    fs: 'memfs',
  },
  // Whether to polyfill `node:` protocol imports.
  protocolImports: true,
});

// Remove deprecated esbuild config from node-polyfills plugin to suppress Vite 8 warning
const origConfig = (nodePolyfillsPluginOptions as any).config;
if (origConfig) {
  (nodePolyfillsPluginOptions as any).config = function (...args: any[]) {
    const result = origConfig.apply(this, args);
    if (result && 'esbuild' in result) {
      delete result.esbuild;
    }
    return result;
  };
}

/**
 * Injects global polyfills (Buffer, global, process) in dev mode via a
 * transform hook, replacing the deprecated esbuild.banner approach.
 */
function globalPolyfillsPlugin(): Plugin {
  return {
    name: 'global-polyfills',
    apply: 'serve',
    transform(code, id) {
      // Only inject into entry-like modules (the main HTML script)
      if (id.includes('main.ts')) {
        const banner = [
          'import { Buffer } from "vite-plugin-node-polyfills/shims/buffer";',
          'import global from "vite-plugin-node-polyfills/shims/global";',
          'import process from "vite-plugin-node-polyfills/shims/process";',
          'globalThis.Buffer = Buffer;',
          'globalThis.global = global;',
          'globalThis.process = process;',
        ].join('\n');
        return { code: banner + '\n' + code, map: null };
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfillsPluginOptions,
    globalPolyfillsPlugin(),
    alphaTab(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['font/**/*', 'soundfont/**/*', 'icon.svg'],
      manifest: {
        name: 'Web Explorer',
        short_name: 'WebExplorer',
        description: 'A universal file viewer that runs entirely in your browser',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for large WASM files
        runtimeCaching: [
          {
            urlPattern: /\.(?:wasm|js|css|html)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
    plugins: () => {
      const workerPolyfills = nodePolyfills({
        include: ['process'],
        globals: {
          process: 'build',
        },
        protocolImports: true,
      });
      // Patch out deprecated esbuild config from worker polyfills plugin
      const origWorkerConfig = (workerPolyfills as any).config;
      if (origWorkerConfig) {
        (workerPolyfills as any).config = function (...args: any[]) {
          const result = origWorkerConfig.apply(this, args);
          if (result && 'esbuild' in result) {
            delete result.esbuild;
          }
          return result;
        };
      }
      return [workerPolyfills];
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/core-mt', '@ffmpeg/util', '@webexplorer/ffmpeg', '@webexplorer/archive', 'wabt']
  },
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js'),
      'vite-plugin-node-polyfills/shims/global': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js'),
      'vite-plugin-node-polyfills/shims/process': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
