import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.js'],
      refresh: true,
      buildDirectory: 'build',
    }),
    vue(),
  ],
  server: {
    host: '0.0.0.0', // <-- crucial for Docker and avoiding [::1]
    port: 5173,       // or 5174 if you're using that
    strictPort: true,
    hmr: {
      host: 'localhost', // or your machine's IP (not [::1])
      protocol: 'ws',
      port: 5173,        // match the port you expose
    }
  },
  build: {
    manifest: true,
    outDir: 'public/build',
    rollupOptions: {
      input: 'resources/js/app.js',
    },
  },
});
