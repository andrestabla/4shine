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

async function checkUser() {
  const client = await pool.connect();
  try {
    console.log(`--- Investigando usuario: ${targetEmail} ---`);
    
    const invitation = await client.query(`
      SELECT 
        invitation_id, 
        meta->'external_progress' as progress,
        updated_at
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = $1
    `, [targetEmail.toLowerCase()]);

    if (invitation.rows.length > 0) {
      const row = invitation.rows[0];
      console.log('Invitación encontrada:');
      console.log(`ID: ${row.invitation_id}`);
      console.log(`Última actualización: ${row.updated_at}`);
      console.log(`Progreso guardado: ${JSON.stringify(row.progress, null, 2)}`);
    } else {
      console.log('No se encontró invitación para este correo.');
    }

    const session = await client.query(`
      SELECT 
        ds.session_id,
        ds.completion_percent,
        ds.status,
        ds.updated_at
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE lower(u.email) = $1
    `, [targetEmail.toLowerCase()]);

    if (session.rows.length > 0) {
      console.log('\nSesión encontrada:');
      const row = session.rows[0];
      console.log(`ID: ${row.session_id}`);
      console.log(`Avance: ${row.completion_percent}%`);
      console.log(`Status: ${row.status}`);
      console.log(`Última actualización: ${row.updated_at}`);
    } else {
      console.log('\nNo se encontró sesión activa para este correo.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUser();
