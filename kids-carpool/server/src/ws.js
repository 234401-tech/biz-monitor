import { WebSocketServer } from 'ws'
import { verifyToken } from './auth.js'
import { q } from './db.js'

/** groupId -> Set<ws> */
const rooms = new Map()

export function broadcast(groupId, msg) {
  const room = rooms.get(groupId)
  if (!room) return
  const data = JSON.stringify(msg)
  for (const client of room) {
    if (client.readyState === client.OPEN) client.send(data)
  }
}

export function attachWs(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws, req) => {
    // 토큰만으로 동기 인증 — 연결 직후 도착하는 메시지를 놓치지 않도록 여기서 DB를 기다리지 않는다
    const token = new URL(req.url, 'http://x').searchParams.get('token') ?? ''
    const auth = verifyToken(token)
    if (!auth) return ws.close(4001, 'unauthorized')

    const { uid, gid } = auth
    if (!rooms.has(gid)) rooms.set(gid, new Set())
    rooms.get(gid).add(ws)
    ws.on('close', () => rooms.get(gid)?.delete(ws))

    ws.on('message', async (raw) => {
      let msg
      try { msg = JSON.parse(raw) } catch { return }
      // 위치는 저장하지 않고, "운행 중 + 그 운행의 운전자"일 때만 그룹에 중계한다.
      if (msg.type === 'loc' && Number.isFinite(msg.lat) && Number.isFinite(msg.lng)) {
        const [trip] = await q(
          "SELECT driver_id FROM trips WHERE group_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1",
          [gid],
        )
        if (trip && trip.driver_id === uid) {
          broadcast(gid, { type: 'loc', lat: msg.lat, lng: msg.lng, at: Date.now() })
        }
      }
    })
  })
}
