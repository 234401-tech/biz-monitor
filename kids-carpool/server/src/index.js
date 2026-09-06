import 'dotenv/config'
import http from 'node:http'
import path from 'node:path'
import express from 'express'
import { initSchema } from './db.js'
import { register, login } from './auth.js'
import { api } from './routes.js'
import { attachWs } from './ws.js'

process.on('unhandledRejection', (e) => console.error(e))

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.post('/api/auth/register', wrap(register))
app.post('/api/auth/login', wrap(login))
app.use('/api', api)

// 개발/테스트용: STATIC_DIR이 설정되면 정적 파일 서빙 (운영에서는 Caddy가 서빙)
if (process.env.STATIC_DIR) {
  app.use(express.static(process.env.STATIC_DIR))
  // SPA 폴백: /api로 시작하지 않는 GET 요청은 index.html로 라우팅
  app.get(/^\/(?!api\/)/, (_req, res) => {
    res.sendFile(path.join(process.env.STATIC_DIR, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: '서버 오류가 발생했어요' })
})

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next)
}

const server = http.createServer(app)
attachWs(server)

const port = Number(process.env.PORT ?? 3000)
await initSchema()
// Caddy 뒤에서만 동작하므로 루프백에만 바인딩 — 방화벽 설정과 무관하게 외부 직접 접근 불가
server.listen(port, '127.0.0.1', () => {
  console.log(`같이타요 API: http://127.0.0.1:${port}`)
})
