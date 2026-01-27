import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { alphaTab } from '@coderline/alphatab-vite'

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
    alphaTab()
  ],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@webexplorer/ffmpeg', '@webexplorer/archive', '@unionpdf/pdfium', 'wabt']
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
