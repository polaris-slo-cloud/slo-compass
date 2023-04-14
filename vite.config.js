import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import ViteYaml from '@modyfi/vite-plugin-yaml';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.ELECTRON === 'true' ? './' : '',
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/styles/variables',
    }),
    ViteYaml(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Applies to the DEV Server
    proxy: {
      // Used to proxy requests to the k8s proxy in order to prevent CORS issues
      '/k8s': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/k8s/, ''),
      },
      '/prometheus': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prometheus/, ''),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      './evaluation/**',
    ],
  },
});
