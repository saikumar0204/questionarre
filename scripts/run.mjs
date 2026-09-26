// Runs prepare-db, then the given command (e.g. `next dev`) with the right DATABASE_URL.
//   node scripts/run.mjs dev | build | start
import { spawnSync, spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env / .env.local the same way Next does, so DATABASE_URL is known before Next starts.
for (const f of ['.env', '.env.local']) {
  const p = resolve(root, f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const isPostgres = /^postgres(ql)?:/i.test(process.env.DATABASE_URL || '')
if (!isPostgres) process.env.DATABASE_URL = 'file:./soulsync.db'

const prep = spawnSync('node', ['scripts/prepare-db.mjs'], { cwd: root, env: process.env, stdio: 'inherit' })
if (prep.status !== 0) process.exit(prep.status ?? 1)

const cmd = process.argv[2] || 'dev'
const child = spawn('npx', ['next', cmd, ...process.argv.slice(3)], { cwd: root, env: process.env, stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
