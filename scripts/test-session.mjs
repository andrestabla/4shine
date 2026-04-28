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
    const inv = await client.query(`
      SELECT invitation_id, session_id, invited_email, meta
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = 'hola@algoritmot.com'
      LIMIT 1
    `);
    if (inv.rows.length > 0) {
      console.log('Inv session_id:', inv.rows[0].session_id);
      
      const ses = await client.query(`
        SELECT session_id, user_id, name_snapshot, feedback_survey
        FROM app_assessment.discovery_sessions
        WHERE session_id = $1::uuid
      `, [inv.rows[0].session_id]);
      
      if (ses.rows.length > 0) {
        console.log('Session user_id:', ses.rows[0].user_id);
        console.log('Session name:', ses.rows[0].name_snapshot);
        console.log('Session survey:', ses.rows[0].feedback_survey);
      } else {
        console.log('Session row NOT found!');
      }
      
      console.log('Meta external_survey:', inv.rows[0].meta?.external_survey);
    } else {
      console.log('Invitation not found for hola@algoritmot.com');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

test();
