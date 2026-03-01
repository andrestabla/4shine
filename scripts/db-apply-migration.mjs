import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function resolveMigrationFiles() {
  const explicitPath = process.argv[2];
  if (explicitPath) {
    return [explicitPath];
  }

  const migrationDir = 'db/migrations';
  const entries = await readdir(migrationDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(migrationDir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

try {
  const migrationFiles = await resolveMigrationFiles();
  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  await client.connect();
  for (const migrationFile of migrationFiles) {
    const sql = await readFile(migrationFile, 'utf8');
    await client.query(sql);
    console.log(`Applied migration: ${migrationFile}`);
  }
} finally {
  await client.end();
}
