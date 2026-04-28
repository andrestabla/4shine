import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env.production.local', 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...val] = line.split('=');
      return [key.trim(), val.join('=').trim().replace(/^"|"$/g, '')];
    })
);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  const client = await pool.connect();
  try {
    const q = await client.query(`
      SELECT user_id, email, display_name, primary_role 
      FROM app_core.users
      WHERE user_id = '7a89f7b6-6d39-41fc-863d-7177136269cd'::uuid
    `);
    console.log(q.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
