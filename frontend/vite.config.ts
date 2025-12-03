import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  const allowedHosts = env.ALLOWED_DEV_ORIGINS
    ? env.ALLOWED_DEV_ORIGINS.replace(/"/g, '').split(',').map(h => h.trim())
    : []

  return {
    plugins: [react()],
    server: {
      allowedHosts,
    },
  }
})
