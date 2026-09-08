import {defineConfig} from 'vite';
export default defineConfig({
  build: {target: "es2022"},
  server: {
    strictPort: true,
    headers: {'Cache-Control': 'no-store'},
    fs: {deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/research/**']},
  },
});
