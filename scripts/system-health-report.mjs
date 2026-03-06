import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const moduleChecks = [
  {
    moduleCode: 'dashboard',
    pagePath: 'src/app/dashboard/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'trayectoria',
    pagePath: 'src/app/dashboard/trayectoria/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'aprendizaje',
    pagePath: 'src/app/dashboard/aprendizaje/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'metodologia',
    pagePath: 'src/app/dashboard/metodologia/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'mentorias',
    pagePath: 'src/app/dashboard/mentorias/page.tsx',
    readRoutes: ['src/app/api/v1/modules/mentorias/route.ts'],
    writeRoutes: ['src/app/api/v1/modules/mentorias/[sessionId]/route.ts'],
  },
  {
    moduleCode: 'networking',
    pagePath: 'src/app/dashboard/networking/page.tsx',
    readRoutes: [
      'src/app/api/v1/modules/networking/connections/route.ts',
      'src/app/api/v1/modules/networking/people/route.ts',
    ],
    writeRoutes: ['src/app/api/v1/modules/networking/connections/[connectionId]/route.ts'],
  },
  {
    moduleCode: 'convocatorias',
    pagePath: 'src/app/dashboard/convocatorias/page.tsx',
    readRoutes: ['src/app/api/v1/modules/convocatorias/route.ts'],
    writeRoutes: ['src/app/api/v1/modules/convocatorias/[jobPostId]/route.ts'],
  },
  {
    moduleCode: 'mensajes',
    pagePath: 'src/app/dashboard/mensajes/page.tsx',
    readRoutes: [
      'src/app/api/v1/modules/mensajes/threads/route.ts',
      'src/app/api/v1/modules/mensajes/participants/route.ts',
      'src/app/api/v1/modules/mensajes/threads/[threadId]/messages/route.ts',
    ],
    writeRoutes: ['src/app/api/v1/modules/mensajes/messages/[messageId]/route.ts'],
  },
  {
    moduleCode: 'workshops',
    pagePath: 'src/app/dashboard/workshops/page.tsx',
    readRoutes: ['src/app/api/v1/modules/workshops/route.ts'],
    writeRoutes: ['src/app/api/v1/modules/workshops/[workshopId]/route.ts'],
  },
  {
    moduleCode: 'perfil',
    pagePath: 'src/app/dashboard/perfil/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'lideres',
    pagePath: 'src/app/dashboard/lideres/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'formacion_mentores',
    pagePath: 'src/app/dashboard/formacion-mentores/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'gestion_formacion_mentores',
    pagePath: 'src/app/dashboard/gestion-formacion-mentores/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
  {
    moduleCode: 'usuarios',
    pagePath: 'src/app/dashboard/usuarios/page.tsx',
    readRoutes: ['src/app/api/v1/modules/usuarios/route.ts'],
    writeRoutes: ['src/app/api/v1/modules/usuarios/[userId]/route.ts'],
  },
  {
    moduleCode: 'administracion_branding',
    pagePath: 'src/app/dashboard/administracion/branding/page.tsx',
    readRoutes: [
      'src/app/api/v1/modules/administracion/branding/route.ts',
      'src/app/api/v1/public/branding/route.ts',
    ],
    writeRoutes: ['src/app/api/v1/modules/administracion/branding/route.ts'],
  },
  {
    moduleCode: 'administracion_integraciones',
    pagePath: 'src/app/dashboard/administracion/integraciones/page.tsx',
    readRoutes: ['src/app/api/v1/modules/administracion/integraciones/route.ts'],
    writeRoutes: [
      'src/app/api/v1/modules/administracion/integraciones/route.ts',
      'src/app/api/v1/modules/administracion/integraciones/outbound-email/test/route.ts',
    ],
  },
  {
    moduleCode: 'contenido',
    pagePath: 'src/app/dashboard/contenido/page.tsx',
    readRoutes: ['src/app/api/v1/modules/contenido/route.ts'],
    writeRoutes: ['src/app/api/v1/modules/contenido/[contentId]/route.ts'],
  },
  {
    moduleCode: 'analitica',
    pagePath: 'src/app/dashboard/analitica/page.tsx',
    readRoutes: ['src/app/api/v1/bootstrap/me/route.ts'],
    writeRoutes: [],
  },
];

async function fileExists(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function queryRows(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows;
}

function permissionSummary(matrixRows) {
  const actions = ['view', 'create', 'update', 'delete', 'approve', 'moderate', 'manage'];
  const grouped = new Map();

  for (const row of matrixRows) {
    if (!grouped.has(row.role_code)) {
      grouped.set(row.role_code, {
        role: row.role_code,
        modules: matrixRows.filter((entry) => entry.role_code === row.role_code).length,
      });
    }
  }

  const list = [];
  for (const [role, base] of grouped.entries()) {
    const roleRows = matrixRows.filter((row) => row.role_code === role);
    const counters = {};
    for (const action of actions) {
      counters[action] = roleRows.filter((row) => row[`can_${action}`]).length;
    }

    list.push({
      ...base,
      actions: counters,
    });
  }

  return list.sort((a, b) => a.role.localeCompare(b.role));
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const moduleHealth = [];
    for (const item of moduleChecks) {
      const pageOk = await fileExists(item.pagePath);
      const readOk = (await Promise.all(item.readRoutes.map(fileExists))).every(Boolean);
      const writeOk = item.writeRoutes.length
        ? (await Promise.all(item.writeRoutes.map(fileExists))).every(Boolean)
        : null;

      moduleHealth.push({
        moduleCode: item.moduleCode,
        page: pageOk,
        apiRead: readOk,
        apiWrite: writeOk,
      });
    }

    const datasetCounts = await queryRows(
      client,
      `
      SELECT metric, value::bigint
      FROM (
        SELECT 'users_total' AS metric, COUNT(*) AS value FROM app_core.users
        UNION ALL SELECT 'users_active', COUNT(*) FROM app_core.users WHERE is_active = true
        UNION ALL SELECT 'cohorts_total', COUNT(*) FROM app_core.cohorts
        UNION ALL SELECT 'trajectory_events_total', COUNT(*) FROM app_core.trajectory_events
        UNION ALL SELECT 'content_aprendizaje', COUNT(*) FROM app_learning.content_items WHERE scope = 'aprendizaje'
        UNION ALL SELECT 'content_metodologia', COUNT(*) FROM app_learning.content_items WHERE scope = 'metodologia'
        UNION ALL SELECT 'content_formacion_mentores', COUNT(*) FROM app_learning.content_items WHERE scope = 'formacion_mentores'
        UNION ALL SELECT 'content_total', COUNT(*) FROM app_learning.content_items
        UNION ALL SELECT 'mentorship_sessions', COUNT(*) FROM app_mentoring.mentorship_sessions
        UNION ALL SELECT 'connections_total', COUNT(*) FROM app_networking.connections
        UNION ALL SELECT 'job_posts_total', COUNT(*) FROM app_networking.job_posts
        UNION ALL SELECT 'chat_threads_total', COUNT(*) FROM app_networking.chat_threads
        UNION ALL SELECT 'messages_total', COUNT(*) FROM app_networking.messages
        UNION ALL SELECT 'workshops_total', COUNT(*) FROM app_networking.workshops
        UNION ALL SELECT 'branding_settings_total', COUNT(*) FROM app_admin.branding_settings
        UNION ALL SELECT 'integration_configs_total', COUNT(*) FROM app_admin.integration_configs
        UNION ALL SELECT 'outbound_email_configs_total', COUNT(*) FROM app_admin.outbound_email_configs
      ) q
      ORDER BY metric
      `,
    );

    const permissionMatrix = await queryRows(
      client,
      `
      SELECT
        role_code,
        module_code,
        module_name,
        can_view,
        can_create,
        can_update,
        can_delete,
        can_approve,
        can_moderate,
        can_manage
      FROM app_auth.v_role_permission_matrix
      ORDER BY role_code, module_code
      `,
    );

    const report = {
      generatedAt: new Date().toISOString(),
      checks: {
        modules: moduleHealth,
      },
      database: {
        metrics: datasetCounts,
      },
      permissions: {
        summaryByRole: permissionSummary(permissionMatrix),
        matrix: permissionMatrix,
      },
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
