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

async function check() {
  const client = await pool.connect();
  try {
    const email = 'proyectos@algoritmot.com';
    console.log(`\n===== Checking state for ${email} =====`);
    
    const inv = await client.query(`
      SELECT di.invitation_id, di.session_id, di.meta, di.updated_at,
             ds.status as session_status, ds.completion_percent, ds.updated_at as session_updated_at
      FROM app_assessment.discovery_invitations di
      LEFT JOIN app_assessment.discovery_sessions ds ON ds.session_id = di.session_id
      WHERE lower(di.invited_email) = $1
    `, [email.toLowerCase()]);

    if (inv.rows.length > 0) {
      const row = inv.rows[0];
      console.log('Invitation ID:', row.invitation_id);
      console.log('Session ID:', row.session_id);
      console.log('Invitation Updated At:', row.updated_at);
      console.log('Session Updated At:', row.session_updated_at);
      console.log('Session Status:', row.session_status);
      console.log('Session Completion%:', row.completion_percent);
      console.log('Meta Progress Status:', row.meta?.external_progress?.status);
      console.log('Meta Progress Completion%:', row.meta?.external_progress?.completionPercent);
    } else {
      console.log('Invitation not found.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}
check();
