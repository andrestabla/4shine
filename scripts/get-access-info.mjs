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

async function getAccessInfo() {
  const client = await pool.connect();
  try {
    // Get the access_code_last4 so we know what code to test with
    const inv = await client.query(`
      SELECT invitation_id, invite_token, access_code_last4, meta->'external_progress' as prog
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = 'proyectos@algoritmot.com'
      LIMIT 1
    `);
    
    if (inv.rows.length === 0) {
      console.log('No invitation found');
      return;
    }
    
    const row = inv.rows[0];
    console.log('Invitation ID:', row.invitation_id);
    console.log('Invite Token:', row.invite_token);
    console.log('Access Code Last 4:', row.access_code_last4);
    console.log('Current external_progress:', JSON.stringify(row.prog, null, 2));
    
  } finally {
    client.release();
    await pool.end();
  }
}

getAccessInfo();
