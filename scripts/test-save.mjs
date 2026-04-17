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

async function testSave() {
  const client = await pool.connect();
  try {
    // Find invitation for proyectos@algoritmot.com
    const inv = await client.query(`
      SELECT invitation_id, invite_token, access_code_hash, meta
      FROM app_assessment.discovery_invitations
      WHERE lower(invited_email) = 'proyectos@algoritmot.com'
      LIMIT 1
    `);
    
    if (inv.rows.length === 0) {
      console.log('No invitation found for proyectos@algoritmot.com');
      return;
    }
    
    const row = inv.rows[0];
    console.log('Found invitation:', row.invitation_id);
    console.log('Current meta keys:', Object.keys(row.meta || {}));
    
    // Simulate what saveDiscoveryInvitationProgress does
    const testProgress = {
      name: 'Test User',
      status: 'instructions',
      profileCompleted: true,
      completionPercent: 0,
      answers: {},
      currentIdx: 0,
      profile: {
        firstName: 'Test',
        lastName: 'User',
        country: 'Colombia',
        jobRole: 'Gerente/Mando medio',
        gender: 'Prefiero no decirlo',
        yearsExperience: 3
      }
    };
    
    const finalMeta = {
      ...(row.meta || {}),
      external_progress: testProgress,
    };

    await client.query('SET ROLE app_runtime');
    const result = await client.query(`
      UPDATE app_assessment.discovery_invitations
      SET meta = $2::jsonb, updated_at = now()
      WHERE invitation_id = $1::uuid
    `, [row.invitation_id, JSON.stringify(finalMeta)]);
    await client.query('RESET ROLE');

    console.log('Update result rowCount:', result.rowCount);
    
    // Verify
    const verify = await client.query(`
      SELECT meta->'external_progress'->>'status' as status,
             meta->'external_progress'->>'profileCompleted' as profile_completed
      FROM app_assessment.discovery_invitations
      WHERE invitation_id = $1::uuid
    `, [row.invitation_id]);
    
    console.log('After save - status:', verify.rows[0].status);
    console.log('After save - profileCompleted:', verify.rows[0].profile_completed);
    
  } finally {
    client.release();
    await pool.end();
  }
}

testSave();
