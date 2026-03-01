import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const migrationFile = process.argv[2] ?? 'db/migrations/20260301_initial_platform_schema.sql';

const sql = await readFile(migrationFile, 'utf8');
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied migration: ${migrationFile}`);
} finally {
  await client.end();
}
