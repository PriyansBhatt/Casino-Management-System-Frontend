import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { testEnvironmentDefines } from './src/utils/testEnvironment.js'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: testEnvironmentDefines({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }),
  server: { port: 5173, open: true },
}))
