import pg from 'pg';
const { Pool } = pg;

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT meta FROM app_assessment.discovery_invitations WHERE invited_email = 'hola@algoritmot.com' LIMIT 1");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

check();
