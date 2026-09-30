import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // Varre todo o código na inicialização: como as páginas são lazy, sem isso o Vite só
    // descobre algumas dependências ao abrir a página e reotimiza no meio da sessão
    optimizeDeps: {
      entries: ['index.html', 'src/**/*.{ts,tsx}'],
    },
    server: {
      port: 5173,
      // Em desenvolvimento, /api é repassado ao backend: sem CORS e sem URL fixa no código
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:3333', changeOrigin: true },
      },
    },
  }
})
