// 최초 1회: 카풀 그룹과 초대 코드를 만든다. (가입은 앱에서 초대 코드로)
import 'dotenv/config'
import { initSchema, q, pool } from './db.js'

await initSchema()

const name = process.env.GROUP_NAME ?? '한빛초 카풀'
const school = process.env.GROUP_SCHOOL ?? '한빛초등학교'
const code = process.env.INVITE_CODE ?? 'HANBIT-2026'

const [existing] = await q('SELECT * FROM groups WHERE invite_code = $1', [code])
if (existing) {
  console.log(`이미 존재하는 그룹: ${existing.name} (초대 코드 ${existing.invite_code})`)
} else {
  const [g] = await q(
    'INSERT INTO groups (name, school, invite_code) VALUES ($1,$2,$3) RETURNING *',
    [name, school, code],
  )
  console.log(`그룹 생성 완료: ${g.name} / 초대 코드: ${g.invite_code}`)
  console.log('이 초대 코드를 이웃 학부모들에게 공유하면 앱에서 가입할 수 있어요.')
}

await pool.end()
