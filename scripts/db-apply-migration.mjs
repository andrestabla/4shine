import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

// ---------------------------------------------------------------------------
// Runner de migraciones con ledger (app_admin.schema_migrations).
//
// Uso:
//   node scripts/db-apply-migration.mjs                 aplica TODAS las pendientes, en orden
//   node scripts/db-apply-migration.mjs <archivo.sql>   aplica una migración puntual (si falta)
//   node scripts/db-apply-migration.mjs --status         muestra aplicadas / pendientes / drift
//   node scripts/db-apply-migration.mjs --baseline       marca TODAS las actuales como aplicadas
//                                                        SIN ejecutarlas (alineación inicial)
//   Flags: --force  (reaplica aunque ya esté registrada)
//
// DATABASE_URL se toma del entorno; si no está, se carga de .env.production.local.
// ---------------------------------------------------------------------------

const MIGRATION_DIR = 'db/migrations';

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = '.env.production.local';
  if (existsSync(envFile)) {
    const env = Object.fromEntries(
      readFileSync(envFile, 'utf8')
        .split('\n').filter((l) => l && !l.startsWith('#'))
        .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')]; }),
    );
    if (env.DATABASE_URL) {
      console.warn(`[db-migrate] DATABASE_URL no está en el entorno; usando ${envFile}.`);
      return env.DATABASE_URL;
    }
  }
  return null;
}

const connectionString = loadDatabaseUrl();
if (!connectionString) {
  console.error('DATABASE_URL is required (en el entorno o en .env.production.local)');
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const isStatus = args.includes('--status');
const isBaseline = args.includes('--baseline');
const explicitPath = args.find((a) => !a.startsWith('--')) ?? null;

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

async function listMigrationFiles() {
  const entries = await readdir(MIGRATION_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function ensureLedger(client) {
  // Bootstrap: la tabla debe existir antes de poder registrar nada. Idempotente
  // y equivalente a la migración 20260726_schema_migrations_tracking.sql.
  await client.query(`CREATE SCHEMA IF NOT EXISTS app_admin`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_admin.schema_migrations (
      filename      text PRIMARY KEY,
      checksum      text NOT NULL,
      applied_at    timestamptz NOT NULL DEFAULT now(),
      applied_by    text NOT NULL DEFAULT current_user,
      execution_ms  integer
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query(`SELECT filename, checksum FROM app_admin.schema_migrations`);
  return new Map(rows.map((r) => [r.filename, r.checksum]));
}

async function record(client, filename, checksum, ms) {
  await client.query(
    `INSERT INTO app_admin.schema_migrations (filename, checksum, execution_ms)
     VALUES ($1, $2, $3)
     ON CONFLICT (filename) DO UPDATE
       SET checksum = EXCLUDED.checksum, applied_at = now(), execution_ms = EXCLUDED.execution_ms`,
    [filename, checksum, ms],
  );
}

async function applyOne(client, filename) {
  const full = path.join(MIGRATION_DIR, filename);
  const sql = await readFile(full, 'utf8');
  const started = Date.now();
  await client.query(sql); // se ejecuta tal cual: cada migración maneja su propio BEGIN/COMMIT
  const ms = Date.now() - started;
  await record(client, filename, sha256(sql), ms);
  console.log(`  ✓ ${filename}  (${ms} ms)`);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  // La DATABASE_URL de prod aterriza la sesión como app_runtime (SET ROLE en
  // las options de la connection string), que no tiene CREATE sobre la BD y
  // hace fallar ensureLedger con "permission denied for database". RESET ROLE
  // vuelve al login role real (neondb_owner). Es no-op si no había SET ROLE.
  await client.query('RESET ROLE');
  await ensureLedger(client);
  const files = await listMigrationFiles();
  const applied = await getApplied(client);

  // ---- --status ----
  if (isStatus) {
    const pending = [];
    const drift = [];
    for (const f of files) {
      const rec = applied.get(f);
      if (!rec) { pending.push(f); continue; }
      const cur = sha256(await readFile(path.join(MIGRATION_DIR, f), 'utf8'));
      if (cur !== rec) drift.push(f);
    }
    const orphan = [...applied.keys()].filter((f) => !files.includes(f)); // en ledger pero sin archivo
    console.log(`Migraciones en repo: ${files.length} | registradas: ${applied.size} | pendientes: ${pending.length} | drift de checksum: ${drift.length}`);
    if (pending.length) { console.log('\nPENDIENTES (en repo, sin aplicar):'); pending.forEach((f) => console.log('  - ' + f)); }
    if (drift.length) { console.log('\nDRIFT DE CHECKSUM (el archivo cambió tras aplicarse — revisar):'); drift.forEach((f) => console.log('  - ' + f)); }
    if (orphan.length) { console.log('\nEN LEDGER SIN ARCHIVO (¿migración borrada del repo?):'); orphan.forEach((f) => console.log('  - ' + f)); }
    if (!pending.length && !drift.length && !orphan.length) console.log('\nTodo alineado ✓');
    process.exit(0);
  }

  // ---- --baseline: registra todo lo actual como aplicado, SIN ejecutar ----
  if (isBaseline) {
    let n = 0;
    for (const f of files) {
      if (applied.has(f) && !force) continue;
      const sql = await readFile(path.join(MIGRATION_DIR, f), 'utf8');
      await client.query(
        `INSERT INTO app_admin.schema_migrations (filename, checksum, applied_by)
         VALUES ($1, $2, 'baseline')
         ON CONFLICT (filename) DO NOTHING`,
        [f, sha256(sql)],
      );
      n++;
    }
    console.log(`Baseline: ${n} migración(es) marcada(s) como aplicada(s) sin ejecutar (total en ledger: ${(await getApplied(client)).size}).`);
    process.exit(0);
  }

  // ---- Aplicar una migración puntual ----
  if (explicitPath) {
    const filename = path.basename(explicitPath);
    if (applied.has(filename) && !force) {
      console.log(`Ya aplicada: ${filename} (usa --force para reaplicar). Nada que hacer.`);
      process.exit(0);
    }
    console.log(`Aplicando 1 migración${applied.has(filename) ? ' (FORZADA)' : ''}:`);
    await applyOne(client, filename);
    process.exit(0);
  }

  // ---- Aplicar TODAS las pendientes en orden ----
  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log('No hay migraciones pendientes. Todo al día ✓');
    process.exit(0);
  }
  console.log(`Aplicando ${pending.length} migración(es) pendiente(s):`);
  for (const f of pending) {
    await applyOne(client, f);
  }
  console.log('Listo ✓');
} catch (error) {
  console.error('\n>>> ERROR aplicando migraciones:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
