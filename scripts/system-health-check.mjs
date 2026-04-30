import pg from 'pg';
import process from 'node:process';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL env var is not set. Run with: DATABASE_URL=... node scripts/system-health-check.mjs');
  process.exit(1);
}

async function runHealthCheck() {
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  console.log('--- 4Shine System Health Report ---');

  try {
    // 1. DB Connectivity
    const now = await pool.query('SELECT NOW()');
    console.log('✅ Database: Connected (' + now.rows[0].now + ')');

    // 2. Schema check
    const tables = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('app_core', 'app_discovery', 'app_learning')");
    console.log(`✅ Schema: ${tables.rows[0].count} tables across 3 modules`);

    // 3. User Health (Roxana Hernandez case)
    const roxana = await pool.query("SELECT meta->'external_progress'->>'completionPercent' as progress, meta->'external_progress'->>'status' as status, meta->'external_progress'->>'currentStep' as step FROM app_assessment.discovery_invitations WHERE invited_email = 'roxanajachl@gmail.com'");
    if (roxana.rows.length > 0) {
      const u = roxana.rows[0];
      console.log(`✅ Specific Case (roxanajachl): Progress ${u.progress}%, Status: ${u.status}, Step: ${u.step}`);
    } else {
      console.log(`⚠️ Specific Case (roxanajachl): Not found in Invitations table`);
    }

    // 4. Analytics Health
    const pendingAnalysis = await pool.query("SELECT count(*) FROM app_assessment.discovery_invitations WHERE meta->'external_progress'->>'status' = 'results' AND (meta->'aiReports' IS NULL OR meta->>'aiReports' = 'null')");
    console.log(`📊 AI Analytics: ${pendingAnalysis.rows[0].count} invitations pending AI report generation (High Depth Mode active)`);

    // 5. Surveys
    const surveyCount = await pool.query("SELECT count(*) FROM app_assessment.discovery_invitations WHERE meta->'external_survey' IS NOT NULL AND meta->>'external_survey' <> 'null'");
    console.log(`📝 Surveys: ${surveyCount.rows[0].count} registered survey responses`);

  } catch (err) {
    console.error('❌ Health Check Failed:', err.message);
  } finally {
    await pool.end();
  }
}

runHealthCheck();
