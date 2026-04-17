import pg from 'pg';
import fs from 'fs';

// Cargar env manualmente
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

async function checkInvitedProgress() {
  const client = await pool.connect();
  try {
    console.log('--- Investigando Invitaciones con Progreso ---');
    const invitations = await client.query(`
      SELECT 
        invitation_id, 
        invited_email, 
        session_id,
        meta->'externalProgress' as progress_json,
        updated_at
      FROM app_assessment.discovery_invitations
      WHERE meta->'externalProgress' IS NOT NULL
      ORDER BY updated_at DESC
    `);

    console.log(`Encontradas ${invitations.rows.length} invitaciones con algún tipo de progreso.`);
    
    invitations.rows.forEach(row => {
      const prog = row.progress_json || {};
      const answers = prog.answers || {};
      const answerCount = Object.keys(answers).length;
      console.log(`Email: ${row.invited_email} | Status: ${prog.status} | Respuestas: ${answerCount} | SessionID: ${row.session_id || 'NULL'} | Última mod: ${row.updated_at}`);
    });

    console.log('\n--- Investigando Sesiones de Invitados ---');
    const sessions = await client.query(`
      SELECT 
        ds.session_id,
        ds.user_id,
        u.email,
        ds.completion_percent,
        ds.status,
        ds.updated_at
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE u.primary_role = 'invitado'
      ORDER BY ds.updated_at DESC
    `);

    console.log(`Encontradas ${sessions.rows.length} sesiones de invitados.`);
    sessions.rows.forEach(row => {
      console.log(`Email: ${row.email} | Avance: ${row.completion_percent}% | Status: ${row.status} | Última mod: ${row.updated_at}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInvitedProgress();
