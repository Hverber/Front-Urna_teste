import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// O proxy redireciona as chamadas "/api" para o backend,
// evitando problemas de CORS sem precisar alterar a API.
// Padrão: API na nuvem (Railway). Para usar a API local, crie um .env com:
//   VITE_API_URL=http://localhost:8080
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl =
    env.VITE_API_URL || 'https://modulo-urna-production.up.railway.app'

    return {
        plugins: [react()],
        server: {
            host: true,
            port: process.env.PORT ? Number(process.env.PORT) : 5173,
            open: false,
            proxy: {
                '/api': {
                    target: apiUrl,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                },
            },
        },
    }
})
