import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 데모 배포(아티팩트)용으로 단일 HTML 파일로 번들한다.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3300',
      '/ws': { target: 'ws://127.0.0.1:3300', ws: true },
    },
  },
})
