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

async function testSync() {
  const client = await pool.connect();
  try {
    const email = 'proyectos@algoritmot.com';
    console.log(`\n===== Testing Sync for ${email} =====`);
    
    // Simulate answering 5 questions (out of 70)
    const mockAnswers = { "1": "1", "2": "2", "3": "3", "4": "4", "5": "5" };
    const completionPercent = Math.round((5 / 70) * 100); // 7%
    
    const inv = await client.query(`SELECT session_id, meta FROM app_assessment.discovery_invitations WHERE lower(invited_email) = $1`, [email.toLowerCase()]);
    const sessionId = inv.rows[0].session_id;
    const oldMeta = inv.rows[0].meta;
    
    const nextMeta = {
      ...oldMeta,
      external_progress: {
        ...oldMeta.external_progress,
        status: 'quiz',
        answers: mockAnswers,
        completionPercent
      }
    };

    console.log(`Updating session ${sessionId} with ${completionPercent}%...`);
    
    await client.query(`
      UPDATE app_assessment.discovery_sessions
      SET completion_percent = $2,
          answers = $3::jsonb,
          updated_at = now()
      WHERE session_id = $1::uuid
    `, [sessionId, completionPercent, JSON.stringify(mockAnswers)]);

    const check = await client.query(`SELECT completion_percent FROM app_assessment.discovery_sessions WHERE session_id = $1`, [sessionId]);
    console.log('New Completion Percent in DB:', check.rows[0].completion_percent);
    
  } finally {
    client.release();
    await pool.end();
  }
}
testSync();
