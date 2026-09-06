import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { q } from './db.js'

const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET.startsWith('CHANGE_ME')) {
  throw new Error('JWT_SECRET 환경변수를 무작위 문자열로 설정하세요 (.env 참고)')
}

const SAFE_USER = 'id, group_id, phone, name, label, children, vehicle, apt, verified'

// 로그인/가입 무차별 대입 방지: IP+종류별 최근 1분간 요청 수 제한 (외부 의존성 없이 인메모리로 처리)
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 10
const rateHits = new Map() // `${ip}:${kind}` -> 최근 요청 타임스탬프[]
function rateLimited(key) {
  const now = Date.now()
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  hits.push(now)
  rateHits.set(key, hits)
  if (rateHits.size > 500) {
    for (const [k, v] of rateHits) if (now - v[v.length - 1] >= RATE_WINDOW_MS) rateHits.delete(k)
  }
  return hits.length > RATE_MAX
}

// 미가입 전화번호로 로그인 시도해도 동일한 시간이 걸리도록(타이밍 열거 방지) 더미 해시를 미리 준비해 둔다
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10)

export function signToken(user) {
  return jwt.sign({ uid: user.id, gid: user.group_id }, SECRET, { expiresIn: '30d' })
}

/** @returns {{uid:number, gid:number} | null} */
export function verifyToken(token) {
  try {
    const { uid, gid } = jwt.verify(token, SECRET)
    return { uid, gid }
  } catch {
    return null
  }
}

export async function register(req, res) {
  if (rateLimited(`${req.ip}:register`)) return res.status(429).json({ error: '잠시 후 다시 시도해 주세요' })
  const { inviteCode, phone, password, name, label, children = '', vehicle = '', apt = '' } = req.body ?? {}
  if (!inviteCode || !phone || !password || !name || !label) {
    return res.status(400).json({ error: '필수 항목이 비어 있어요' })
  }
  const normalizedPhone = String(phone).replace(/-/g, '').trim()
  if (!/^01[0-9]{8,9}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: '전화번호 형식이 올바르지 않아요' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 해요' })
  }
  if (String(password).length > 200) {
    return res.status(400).json({ error: '비밀번호가 너무 길어요' })
  }
  if (String(name).length > 40 || String(label).length > 40) {
    return res.status(400).json({ error: '이름 또는 호칭이 너무 길어요' })
  }
  if (String(children).length > 200 || String(vehicle).length > 200 || String(apt).length > 200) {
    return res.status(400).json({ error: '입력값이 너무 길어요' })
  }
  const [group] = await q('SELECT id FROM groups WHERE invite_code = $1', [inviteCode.trim()])
  if (!group) return res.status(400).json({ error: '초대 코드가 올바르지 않아요' })

  const hash = await bcrypt.hash(String(password), 10)
  try {
    const [user] = await q(
      `INSERT INTO users (group_id, phone, password_hash, name, label, children, vehicle, apt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${SAFE_USER}`,
      [group.id, normalizedPhone, hash, name.trim(), label.trim(), children.trim(), vehicle.trim(), apt.trim()],
    )
    res.json({ token: signToken(user), user })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 가입된 전화번호예요' })
    throw e
  }
}

export async function login(req, res) {
  if (rateLimited(`${req.ip}:login`)) return res.status(429).json({ error: '잠시 후 다시 시도해 주세요' })
  const { phone, password } = req.body ?? {}
  const [row] = await q('SELECT * FROM users WHERE phone = $1', [String(phone ?? '').trim()])
  // 미등록 전화번호여도 더미 해시로 bcrypt.compare를 수행해 응답 시간 차이로 계정 존재 여부가 드러나지 않게 한다
  const match = await bcrypt.compare(String(password ?? ''), row ? row.password_hash : DUMMY_HASH)
  if (!row || !match) {
    return res.status(401).json({ error: '전화번호 또는 비밀번호가 맞지 않아요' })
  }
  const { password_hash, created_at, ...user } = row
  res.json({ token: signToken(row), user })
}

// Express 미들웨어: Authorization: Bearer <token> → req.user
export async function requireAuth(req, res, next) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: '로그인이 필요해요' })
  const [user] = await q(`SELECT ${SAFE_USER} FROM users WHERE id = $1`, [payload.uid])
  if (!user) return res.status(401).json({ error: '로그인이 필요해요' })
  req.user = user
  next()
}
