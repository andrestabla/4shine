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
      SELECT invitation_id, session_id, meta
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = 'hola@algoritmot.com'
      LIMIT 1
    `);
    const row = inv.rows[0];
    
    const surveyPayload = {
      answers: { "1": 5, "2": 5, "3": 5, "4": 5, "5": 5 },
      submittedAt: new Date().toISOString(),
      average: 5
    };

    const finalMeta = {
      ...row.meta,
      external_survey: surveyPayload
    };

    await client.query('SET ROLE app_runtime');
    
    const updateInv = await client.query(
      `UPDATE app_assessment.discovery_invitations SET meta = $2::jsonb, updated_at = now() WHERE invitation_id = $1::uuid`,
      [row.invitation_id, JSON.stringify(finalMeta)]
    );
    console.log('Inv update:', updateInv.rowCount);

    const updateSes = await client.query(
      `UPDATE app_assessment.discovery_sessions SET feedback_survey = $2::jsonb, updated_at = now() WHERE session_id = $1::uuid`,
      [row.session_id, JSON.stringify(surveyPayload)]
    );
    console.log('Ses update:', updateSes.rowCount);
    
    await client.query('RESET ROLE');
  } finally {
    client.release();
    await pool.end();
  }
}
test();
