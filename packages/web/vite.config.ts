import path from 'path'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { alphaTab } from '@coderline/alphatab-vite'
import { VitePWA } from 'vite-plugin-pwa'

const nodePolyfillsPluginOptions = nodePolyfills({
  // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
  include: ['stream'],
  // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
  exclude: [],
  // Whether to polyfill specific globals.
  globals: {
    Buffer: true, // can also be 'build', 'dev', or false
    global: true,
    process: true,
  },
  // Override the default polyfills for specific modules.
  overrides: {
    // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
    fs: 'memfs',
  },
  // Whether to polyfill `node:` protocol imports.
  protocolImports: true,
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfillsPluginOptions,
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
    plugins: () => [
      nodePolyfills({
        include: ['process'],
        globals: {
          process: true,
        },
        protocolImports: true,
      }),
    ],
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
