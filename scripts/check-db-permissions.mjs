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

async function checkPermissions() {
  const client = await pool.connect();
  try {
    console.log('--- Verificando permisos ---');
    const res = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'app_assessment' 
        AND table_name = 'discovery_invitations'
        AND grantee = 'app_runtime';
    `);
    console.log('Permisos para app_runtime:', res.rows);

    console.log('\n--- Probando UPDATE como app_runtime ---');
    await client.query('SET ROLE app_runtime');
    try {
      await client.query(`
        UPDATE app_assessment.discovery_invitations
        SET updated_at = now()
        WHERE invitation_id = '9ce7dbf1-70cc-4e68-a3f1-ea25fe416ca3'
      `);
      console.log('UPDATE exitoso como app_runtime.');
    } catch (e) {
      console.error('ERROR al hacer UPDATE como app_runtime:', e.message);
    }
    await client.query('RESET ROLE');

  } finally {
    client.release();
    await pool.end();
  }
}

checkPermissions();
