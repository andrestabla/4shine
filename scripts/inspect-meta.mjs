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

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const targetEmail = 'marianalobolozano@gmail.com';

async function inspectMeta() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT invitation_id, meta, updated_at
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = $1
    `, [targetEmail.toLowerCase()]);

    if (res.rows.length > 0) {
      console.log('--- RAW META ---');
      console.log(JSON.stringify(res.rows[0].meta, null, 2));
      console.log('--- UPDATED AT ---');
      console.log(res.rows[0].updated_at);
    } else {
      console.log('No invitation found.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

inspectMeta();
