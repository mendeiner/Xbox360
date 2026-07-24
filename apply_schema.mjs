// One-off, not part of the build. Applies supabase/schema.sql directly to the linked
// Supabase Postgres database via SUPABASE_DB_URL (a direct DB-password connection string,
// distinct from the VITE_SUPABASE_ANON_KEY used by the app itself — see .env.example).
//
// Most of schema.sql is already written to be safely re-run (add column if not exists,
// drop constraint if exists before re-adding, insert ... on conflict do nothing), but
// `create policy` has no IF NOT EXISTS form in Postgres, so re-running the file as one
// batch fails once policies already exist. This runs each top-level statement individually
// and treats "already exists" (duplicate_object/duplicate_table) as already-applied rather
// than a failure, so the whole file stays safely re-runnable end to end.
//
// Usage: node --env-file=.env apply_schema.mjs
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const ALREADY_EXISTS_CODES = new Set(['42710', '42P07']) // duplicate_object, duplicate_table

function splitStatements(sql) {
  const statements = []
  let current = ''
  let i = 0
  while (i < sql.length) {
    const two = sql.slice(i, i + 2)
    if (two === '--') {
      const end = sql.indexOf('\n', i)
      current += sql.slice(i, end === -1 ? sql.length : end + 1)
      i = end === -1 ? sql.length : end + 1
      continue
    }
    if (two === '/*') {
      const end = sql.indexOf('*/', i + 2)
      current += sql.slice(i, end === -1 ? sql.length : end + 2)
      i = end === -1 ? sql.length : end + 2
      continue
    }
    if (sql[i] === "'") {
      const end = sql.indexOf("'", i + 1)
      current += sql.slice(i, end === -1 ? sql.length : end + 1)
      i = end === -1 ? sql.length : end + 1
      continue
    }
    if (sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$[a-zA-Z_]*\$/)
      if (tagMatch) {
        const tag = tagMatch[0]
        const end = sql.indexOf(tag, i + tag.length)
        const stop = end === -1 ? sql.length : end + tag.length
        current += sql.slice(i, stop)
        i = stop
        continue
      }
    }
    if (sql[i] === ';') {
      current += ';'
      if (current.trim()) statements.push(current.trim())
      current = ''
      i += 1
      continue
    }
    current += sql[i]
    i += 1
  }
  if (current.trim()) statements.push(current.trim())
  return statements
}

const sql = readFileSync(new URL('./supabase/schema.sql', import.meta.url), 'utf8')
const statements = splitStatements(sql)
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })

let applied = 0
let skipped = 0

try {
  await client.connect()
  for (const statement of statements) {
    try {
      await client.query(statement)
      applied++
    } catch (err) {
      if (ALREADY_EXISTS_CODES.has(err.code)) {
        skipped++
      } else {
        console.error('Failed on statement:\n', statement.slice(0, 200))
        throw err
      }
    }
  }
  console.log(`schema.sql applied successfully. (${applied} run, ${skipped} already applied)`)
} catch (err) {
  console.error('Failed to apply schema.sql:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
