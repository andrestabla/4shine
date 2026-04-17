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
    const emails = ['proyectos@algoritmot.com', 'marianalobolozano@gmail.com'];
    for (const email of emails) {
      console.log(`\n===== ${email} =====`);
      const inv = await client.query(`
        SELECT invitation_id, meta, updated_at
        FROM app_assessment.discovery_invitations
        WHERE lower(invited_email) = $1
      `, [email.toLowerCase()]);
      if (inv.rows.length > 0) {
        const row = inv.rows[0];
        const prog = row.meta?.external_progress;
        console.log('Invitación actualizada:', row.updated_at);
        console.log('external_progress status:', prog?.status ?? 'NULL');
        console.log('profileCompleted:', prog?.profileCompleted ?? 'NULL');
        console.log('Completion%:', prog?.completionPercent ?? 'NULL');
      } else {
        console.log('Sin invitación.');
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}
check();
