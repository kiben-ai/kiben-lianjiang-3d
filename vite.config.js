import {defineConfig} from 'vite';
export default defineConfig({
  base: "./",
  build: {target: "es2022", rollupOptions: {input: {desktop: "index.html", mobile: "mobile.html"}}},
  server: {
    strictPort: true,
    headers: {'Cache-Control': 'no-store'},
    fs: {deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/research/**']},
  },
});
