import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { q } from './db.js'

const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET.startsWith('CHANGE_ME')) {
  throw new Error('JWT_SECRET 환경변수를 무작위 문자열로 설정하세요 (.env 참고)')
}

const SAFE_USER = 'id, group_id, phone, name, label, children, vehicle, apt, verified'

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
  const { inviteCode, phone, password, name, label, children = '', vehicle = '', apt = '' } = req.body ?? {}
  if (!inviteCode || !phone || !password || !name || !label) {
    return res.status(400).json({ error: '필수 항목이 비어 있어요' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 해요' })
  }
  const [group] = await q('SELECT id FROM groups WHERE invite_code = $1', [inviteCode.trim()])
  if (!group) return res.status(400).json({ error: '초대 코드가 올바르지 않아요' })

  const hash = await bcrypt.hash(String(password), 10)
  try {
    const [user] = await q(
      `INSERT INTO users (group_id, phone, password_hash, name, label, children, vehicle, apt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${SAFE_USER}`,
      [group.id, String(phone).trim(), hash, name.trim(), label.trim(), children.trim(), vehicle.trim(), apt.trim()],
    )
    res.json({ token: signToken(user), user })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 가입된 전화번호예요' })
    throw e
  }
}

export async function login(req, res) {
  const { phone, password } = req.body ?? {}
  const [row] = await q('SELECT * FROM users WHERE phone = $1', [String(phone ?? '').trim()])
  if (!row || !(await bcrypt.compare(String(password ?? ''), row.password_hash))) {
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
