// Picks the right Prisma schema for the current environment and prepares the database.
//   DATABASE_URL = postgres...  -> uses prisma/schema.prisma as-is (Vercel / production)
//   anything else               -> generates a SQLite copy (prisma/schema.local.prisma) and uses prisma/soulsync.db
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = resolve(root, 'prisma/schema.prisma')
const localSchemaPath = resolve(root, 'prisma/schema.local.prisma')

const url = process.env.DATABASE_URL || ''
const isPostgres = /^postgres(ql)?:/i.test(url)

let schemaArg = schemaPath
const env = { ...process.env }

if (!isPostgres) {
  const src = readFileSync(schemaPath, 'utf8').replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
  writeFileSync(localSchemaPath, `// AUTO-GENERATED from schema.prisma by scripts/prepare-db.mjs. Do not edit or commit.\n${src}`)
  schemaArg = localSchemaPath
  env.DATABASE_URL = 'file:./soulsync.db'
  console.log('[db] Using local SQLite database (prisma/soulsync.db)')
} else {
  console.log('[db] Using PostgreSQL from DATABASE_URL')
}

const run = (args) => {
  const r = spawnSync('npx', ['prisma', ...args], { cwd: root, env, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run(['generate', '--schema', schemaArg])
// Matches the previous build behaviour (--accept-data-loss) so schema changes deploy without prompts.
// Once you have real customers' data in production, set PRISMA_STRICT=1 in Vercel so destructive
// schema changes fail the build instead of silently dropping data.
const strict = process.env.PRISMA_STRICT === '1'
run(['db', 'push', '--schema', schemaArg, '--skip-generate', ...(strict ? [] : ['--accept-data-loss'])])
