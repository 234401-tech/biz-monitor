import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import 'dotenv/config'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

export async function q(text, params) {
  const res = await pool.query(text, params)
  return res.rows
}

export async function initSchema() {
  const sql = readFileSync(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8')
  await pool.query(sql)
}
