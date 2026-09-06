import { Router } from 'express'
import { q, pool } from './db.js'
import { requireAuth } from './auth.js'
import { broadcast } from './ws.js'

export const api = Router()

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next)
}

// :id 파라미터가 정수가 아니면 400으로 즉시 응답
function requireIntParam(name) {
  return (req, res, next) => {
    if (!/^\d+$/.test(req.params[name])) return res.status(400).json({ error: '잘못된 요청이에요' })
    next()
  }
}

api.use(requireAuth)

api.get('/me', (req, res) => res.json(req.user))

api.get('/group', wrap(async (req, res) => {
  const [group] = await q('SELECT id, name, school, invite_code FROM groups WHERE id = $1', [req.user.group_id])
  const members = await q(
    'SELECT id, name, label, children, vehicle, apt, verified FROM users WHERE group_id = $1 ORDER BY id',
    [req.user.group_id],
  )
  res.json({ group, members })
}))

// 이번 주 월요일 (서버 로컬 시간 기준)
export function weekStart(d = new Date()) {
  const date = new Date(d)
  const shift = (date.getDay() + 6) % 7 // 월=0 … 일=6
  date.setDate(date.getDate() - shift)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 이번 주 당번표. 없으면 그룹 멤버 순환(라운드로빈)으로 자동 생성 → 공평 배분
api.get('/week', wrap(async (req, res) => {
  const gid = req.user.group_id
  const start = /^\d{4}-\d{2}-\d{2}$/.test(req.query.start ?? '') ? weekStart(new Date(req.query.start)) : weekStart()

  let plans = await q(
    'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 ORDER BY dow',
    [gid, start],
  )
  if (plans.length === 0) {
    const members = await q('SELECT id, children FROM users WHERE group_id = $1 ORDER BY id', [gid])
    if (members.length > 0) {
      const allKids = members.flatMap((m) => m.children.split(',').map((s) => s.trim().replace(/\(.*\)/, '')).filter(Boolean))
      const weekNo = Math.floor(new Date(start).getTime() / (7 * 86400_000))
      const params = [gid, start]
      const values = []
      for (let dow = 1; dow <= 5; dow++) {
        const driver = members[(weekNo + dow) % members.length]
        const base = params.length
        values.push(`($1,$2,$${base + 1},$${base + 2},$${base + 3})`)
        params.push(dow, driver.id, allKids)
      }
      await q(
        `INSERT INTO week_plans (group_id, week_start, dow, driver_id, riders)
         VALUES ${values.join(',')} ON CONFLICT DO NOTHING`,
        params,
      )
      plans = await q('SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 ORDER BY dow', [gid, start])
      if (plans.length < 5) {
        plans = await q('SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 ORDER BY dow', [gid, start])
      }
    }
  }
  const swaps = await q(
    "SELECT * FROM swap_requests WHERE group_id = $1 AND week_start = $2 AND status = 'pending'",
    [gid, start],
  )
  res.json({ weekStart: start, plans, swaps })
}))

// 당번 교환 요청: 내 당번(from)을 다른 요일(to) 당번과 바꾸자고 제안
api.post('/week/swap', wrap(async (req, res) => {
  const { fromDow, toDow, reason = '' } = req.body ?? {}
  const gid = req.user.group_id
  const start = weekStart()
  if (!Number.isInteger(fromDow) || !Number.isInteger(toDow) || fromDow < 1 || fromDow > 5 || toDow < 1 || toDow > 5) {
    return res.status(400).json({ error: '요일이 올바르지 않아요' })
  }
  if (fromDow === toDow) return res.status(400).json({ error: '같은 요일로는 교환할 수 없어요' })
  const [from] = await q(
    'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 AND dow = $3',
    [gid, start, fromDow],
  )
  if (!from || from.driver_id !== req.user.id) return res.status(403).json({ error: '내 당번인 날만 교환을 요청할 수 있어요' })
  const [to] = await q(
    'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 AND dow = $3',
    [gid, start, toDow],
  )
  if (to && to.driver_id === req.user.id) return res.status(400).json({ error: '이미 내 당번인 요일이에요' })
  const [swap] = await q(
    `INSERT INTO swap_requests (group_id, week_start, from_dow, to_dow, requester_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [gid, start, fromDow, toDow, req.user.id, String(reason).slice(0, 100)],
  )
  broadcast(gid, { type: 'week' })
  res.json(swap)
}))

// 교환 수락: to_dow의 운전자만 가능. 두 요일의 운전자를 맞바꾼다.
api.post('/swap/:id/accept', requireIntParam('id'), wrap(async (req, res) => {
  const gid = req.user.group_id
  const client = await pool.connect()
  let result
  try {
    await client.query('BEGIN')
    const { rows: [swap] } = await client.query(
      "SELECT * FROM swap_requests WHERE id = $1 AND group_id = $2 AND status = 'pending' FOR UPDATE",
      [req.params.id, gid],
    )
    if (!swap) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: '요청을 찾을 수 없어요' })
    }
    const { rows: [from] } = await client.query(
      'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 AND dow = $3 FOR UPDATE',
      [gid, swap.week_start, swap.from_dow],
    )
    const { rows: [to] } = await client.query(
      'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 AND dow = $3 FOR UPDATE',
      [gid, swap.week_start, swap.to_dow],
    )
    if (!to || to.driver_id !== req.user.id) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: '교환 상대 당번만 수락할 수 있어요' })
    }
    if (!from || from.driver_id !== swap.requester_id) {
      await client.query("UPDATE swap_requests SET status = 'cancelled' WHERE id = $1", [swap.id])
      await client.query('COMMIT')
      return res.status(409).json({ error: '당번이 바뀌어 이제 유효하지 않은 요청이에요' })
    }
    await client.query(
      'UPDATE week_plans SET driver_id = $1 WHERE group_id = $2 AND week_start = $3 AND dow = $4',
      [req.user.id, gid, swap.week_start, swap.from_dow],
    )
    await client.query(
      'UPDATE week_plans SET driver_id = $1 WHERE group_id = $2 AND week_start = $3 AND dow = $4',
      [swap.requester_id, gid, swap.week_start, swap.to_dow],
    )
    await client.query("UPDATE swap_requests SET status = 'accepted' WHERE id = $1", [swap.id])
    await client.query(
      `UPDATE swap_requests SET status = 'cancelled'
       WHERE group_id = $1 AND week_start = $2 AND status = 'pending' AND id <> $3
         AND (from_dow IN ($4,$5) OR to_dow IN ($4,$5))`,
      [gid, swap.week_start, swap.id, swap.from_dow, swap.to_dow],
    )
    await client.query('COMMIT')
    result = { ok: true }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  broadcast(gid, { type: 'week' })
  res.json(result)
}))

// ---- 운행 세션: 위치 공유는 active 상태인 동안만 중계된다 ----

api.get('/trips/active', wrap(async (req, res) => {
  const [trip] = await q(
    "SELECT * FROM trips WHERE group_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1",
    [req.user.group_id],
  )
  if (!trip) return res.json({ trip: null, events: [] })
  const events = await q('SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY id', [trip.id])
  res.json({ trip, events })
}))

api.post('/trips/start', wrap(async (req, res) => {
  const gid = req.user.group_id
  const [active] = await q("SELECT id FROM trips WHERE group_id = $1 AND status = 'active'", [gid])
  if (active) return res.status(409).json({ error: '이미 진행 중인 운행이 있어요' })
  const todayDow = ((new Date().getDay() + 6) % 7) + 1
  const [plan] = await q(
    'SELECT * FROM week_plans WHERE group_id = $1 AND week_start = $2 AND dow = $3',
    [gid, weekStart(), todayDow],
  )
  if (!plan || plan.driver_id !== req.user.id) {
    return res.status(403).json({ error: '오늘 운전 당번만 운행을 시작할 수 있어요' })
  }
  const kind = req.body?.kind === '하원' ? '하원' : '등원'
  const [trip] = await q(
    'INSERT INTO trips (group_id, driver_id, kind) VALUES ($1,$2,$3) RETURNING *',
    [gid, req.user.id, kind],
  )
  broadcast(gid, { type: 'trip' })
  res.json(trip)
}))

api.post('/trips/:id/event', requireIntParam('id'), wrap(async (req, res) => {
  const [trip] = await q("SELECT * FROM trips WHERE id = $1 AND status = 'active'", [req.params.id])
  if (!trip || trip.driver_id !== req.user.id) return res.status(403).json({ error: '운행 중인 운전자만 기록할 수 있어요' })
  const label = String(req.body?.label ?? '').slice(0, 80)
  if (!label) return res.status(400).json({ error: '내용이 비어 있어요' })
  const [ev] = await q('INSERT INTO trip_events (trip_id, label) VALUES ($1,$2) RETURNING *', [trip.id, label])
  broadcast(trip.group_id, { type: 'trip' })
  res.json(ev)
}))

api.post('/trips/:id/end', requireIntParam('id'), wrap(async (req, res) => {
  const [trip] = await q("SELECT * FROM trips WHERE id = $1 AND status = 'active'", [req.params.id])
  if (!trip || trip.driver_id !== req.user.id) return res.status(403).json({ error: '운행 중인 운전자만 종료할 수 있어요' })
  await q("UPDATE trips SET status = 'ended', ended_at = now() WHERE id = $1", [trip.id])
  broadcast(trip.group_id, { type: 'trip' })
  res.json({ ok: true })
}))
