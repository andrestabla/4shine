import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { getIntegrationConfigForActor } from '@/server/integrations/config';

/**
 * Centro de incidencias: detecta casos que necesitan que una persona decida.
 *
 * Cada detector es una consulta sobre datos reales, no una alerta genérica: si
 * aparece una incidencia es porque hay algo concreto que revisar. Cada caso
 * viaja con su evidencia, una guía de análisis y las acciones que resuelven,
 * para que gestor y admin no tengan que reconstruir el contexto.
 */

export type IncidentSeverity = 'alta' | 'media' | 'baja';

export interface IncidentAction {
  label: string;
  href: string;
  /** true = la acción abre la ficha donde se ejecuta el cambio. */
  primary?: boolean;
}

export interface IncidentRecord {
  incidentId: string;
  type: string;
  severity: IncidentSeverity;
  title: string;
  summary: string;
  /** Datos duros que sustentan el caso (lo que vio el detector). */
  evidence: string[];
  /** Guía de análisis: qué mirar antes de decidir. */
  checklist: string[];
  actions: IncidentAction[];
  /** Personas involucradas, para filtrar por líder. */
  userIds: string[];
  detectedAt: string;
}

export interface IncidentsSummary {
  incidents: IncidentRecord[];
  countsBySeverity: Record<IncidentSeverity, number>;
  /** Casos que alguien ya cerró y por eso no aparecen en la lista. */
  dismissedCount: number;
  generatedAt: string;
}

/** Cómo se cerró un caso: se arregló, o no era un caso real. */
export type IncidentResolution = 'resuelto' | 'descartado';

export interface DismissedIncident {
  incidentId: string;
  type: string;
  title: string;
  resolution: IncidentResolution;
  note: string | null;
  closedAt: string;
  closedByName: string | null;
}

const nowIso = () => new Date().toISOString();

/** Cuentas que parecen la misma persona y una de ellas concentra el avance. */
async function detectDuplicateAccounts(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    a_id: string; a_name: string; a_email: string; a_role: string; a_diag: boolean; a_wb: boolean; a_plan: string | null;
    b_id: string; b_name: string; b_email: string; b_role: string; b_diag: boolean; b_wb: boolean; b_plan: string | null;
  }>(
    `
      WITH base AS (
        SELECT u.user_id, u.display_name, u.email::text AS email, u.primary_role, u.created_at,
               sp.name AS plan_name,
               EXISTS (SELECT 1 FROM app_assessment.discovery_sessions d WHERE d.user_id = u.user_id) AS tiene_diag,
               EXISTS (
                 SELECT 1 FROM app_learning.user_workbooks w
                 WHERE w.owner_user_id = u.user_id AND COALESCE(w.completion_percent, 0) > 0
               ) AS tiene_wb,
               ARRAY(
                 SELECT t FROM unnest(string_to_array(
                   lower(translate(u.display_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), ' ')) AS t
                 WHERE length(t) >= 3
               ) AS tokens
        FROM app_core.users u
        LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
        LEFT JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
        WHERE u.is_active = true
      )
      SELECT a.user_id::text AS a_id, a.display_name AS a_name, a.email AS a_email,
             a.primary_role AS a_role, a.tiene_diag AS a_diag, a.tiene_wb AS a_wb, a.plan_name AS a_plan,
             b.user_id::text AS b_id, b.display_name AS b_name, b.email AS b_email,
             b.primary_role AS b_role, b.tiene_diag AS b_diag, b.tiene_wb AS b_wb, b.plan_name AS b_plan
      FROM base a
      JOIN base b ON a.created_at < b.created_at
      WHERE cardinality(a.tokens) >= 2
        AND cardinality(ARRAY(SELECT unnest(a.tokens) INTERSECT SELECT unnest(b.tokens))) >= 2
        -- Solo importa si el avance quedó partido: una tiene datos y la otra no.
        AND ((a.tiene_diag OR a.tiene_wb) <> (b.tiene_diag OR b.tiene_wb))
      ORDER BY b.created_at DESC
      LIMIT 30
    `,
  );

  return rows.map((row) => {
    const conDatos = row.a_diag || row.a_wb ? 'a' : 'b';
    const origen = conDatos === 'a'
      ? { name: row.a_name, email: row.a_email, role: row.a_role, id: row.a_id }
      : { name: row.b_name, email: row.b_email, role: row.b_role, id: row.b_id };
    const destino = conDatos === 'a'
      ? { name: row.b_name, email: row.b_email, role: row.b_role, id: row.b_id, plan: row.b_plan }
      : { name: row.a_name, email: row.a_email, role: row.a_role, id: row.a_id, plan: row.a_plan };
    const queTiene = [
      (conDatos === 'a' ? row.a_diag : row.b_diag) ? 'diagnóstico' : null,
      (conDatos === 'a' ? row.a_wb : row.b_wb) ? 'workbooks con avance' : null,
    ].filter(Boolean).join(' y ');

    return {
      incidentId: `duplicado:${row.a_id}:${row.b_id}`,
      type: 'cuenta_duplicada',
      severity: 'alta' as IncidentSeverity,
      title: `Posible cuenta duplicada: ${destino.name}`,
      summary:
        `Hay dos cuentas activas que parecen la misma persona. La de ${origen.email} tiene ${queTiene}; ` +
        `la de ${destino.email}${destino.plan ? ` (plan ${destino.plan})` : ''} no. ` +
        `Si es la misma persona, su avance está colgando de la cuenta equivocada y su ficha se ve vacía.`,
      evidence: [
        `Cuenta con avance: ${origen.name} · ${origen.email} · rol ${origen.role}`,
        `Cuenta sin avance: ${destino.name} · ${destino.email} · rol ${destino.role}${destino.plan ? ` · plan ${destino.plan}` : ''}`,
      ],
      checklist: [
        'Confirma con la persona cuál correo usa para entrar hoy: esa es la cuenta que se conserva.',
        'Revisa qué tiene la otra cuenta (diagnóstico, workbooks, mentorías) para saber qué hay que trasladar.',
        'Si son personas distintas con nombres parecidos, descarta el caso y no hagas nada.',
      ],
      actions: [
        { label: `Abrir ficha de ${destino.name}`, href: `/dashboard/usuarios/${destino.id}`, primary: true },
        { label: `Abrir ficha de ${origen.name}`, href: `/dashboard/usuarios/${origen.id}` },
        { label: 'Ver 360 del líder', href: `/dashboard/lideres/${destino.id}` },
      ],
      userIds: [row.a_id, row.b_id],
      detectedAt: nowIso(),
    };
  });
}

/** Líder con plan que incluye diagnóstico pero que nunca lo inició. */
async function detectMissingDiagnostic(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; plan_name: string; dias: number;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text, sp.name AS plan_name,
             GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(up.subscription_started_at, u.created_at))::int) AS dias
      FROM app_core.users u
      JOIN app_core.user_profiles up ON up.user_id = u.user_id
      JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
      JOIN app_billing.plan_module_features pmf
        ON pmf.plan_id = sp.plan_id AND pmf.feature_key = 'descubrimiento' AND pmf.is_enabled = true
      WHERE u.primary_role = 'lider' AND u.is_active = true
        AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
        AND NOT EXISTS (SELECT 1 FROM app_assessment.discovery_sessions d WHERE d.user_id = u.user_id)
        AND COALESCE(up.subscription_started_at, u.created_at) < now() - interval '7 days'
      ORDER BY dias DESC
      LIMIT 30
    `,
  );

  return rows.map((row) => ({
    incidentId: `sin-diagnostico:${row.user_id}`,
    type: 'diagnostico_no_iniciado',
    severity: (row.dias > 30 ? 'media' : 'baja') as IncidentSeverity,
    title: `${row.display_name} no ha iniciado su diagnóstico`,
    summary:
      `Lleva ${row.dias} días con el plan ${row.plan_name}, que incluye Descubrimiento, y su diagnóstico ` +
      `no aparece. Puede ser que no lo haya hecho, o que lo haya hecho con otro correo.`,
    evidence: [
      `${row.display_name} · ${row.email}`,
      `Plan ${row.plan_name} · ${row.dias} días desde el inicio`,
      'Sin sesión de diagnóstico asociada a esta cuenta',
    ],
    checklist: [
      'Revisa primero si existe otra cuenta suya con el diagnóstico hecho (ver incidencias de cuenta duplicada).',
      'Si no la hay, el caso es de acompañamiento: contáctalo o envíale la invitación al diagnóstico.',
    ],
    actions: [
      { label: 'Ver 360 del líder', href: `/dashboard/lideres/${row.user_id}`, primary: true },
      { label: 'Abrir ficha de usuario', href: `/dashboard/usuarios/${row.user_id}` },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

/** Diagnóstico empezado hace tiempo y sin terminar. */
async function detectStalledDiagnostic(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; pct: string; dias: number;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text,
             d.completion_percent::text AS pct,
             EXTRACT(DAY FROM now() - d.updated_at)::int AS dias
      FROM app_assessment.discovery_sessions d
      JOIN app_core.users u ON u.user_id = d.user_id
      WHERE u.is_active = true
        AND d.completed_at IS NULL
        AND d.completion_percent > 0
        -- Los que llegaron al 100 % ya respondieron todo: aunque falte la marca
        -- de cierre, no son un caso de abandono y no deben ensuciar el panel.
        AND d.completion_percent < 100
        AND d.updated_at < now() - interval '14 days'
      ORDER BY dias DESC
      LIMIT 20
    `,
  );

  return rows.map((row) => ({
    incidentId: `diagnostico-estancado:${row.user_id}`,
    type: 'diagnostico_estancado',
    severity: 'media' as IncidentSeverity,
    title: `Diagnóstico a medias de ${row.display_name}`,
    summary:
      `Empezó su diagnóstico y quedó en ${Math.round(Number(row.pct))} %, sin actividad hace ${row.dias} días. ` +
      `Sin terminarlo no hay informe ni línea base para su acompañamiento.`,
    evidence: [
      `${row.display_name} · ${row.email}`,
      `Avance ${Math.round(Number(row.pct))} % · última actividad hace ${row.dias} días`,
    ],
    checklist: [
      'Confirma que no sea un problema técnico: abre su 360 y revisa que el diagnóstico cargue.',
      'Si es abandono, un recordatorio del advisor o del gestor suele bastar.',
    ],
    actions: [
      { label: 'Ver 360 del líder', href: `/dashboard/lideres/${row.user_id}`, primary: true },
      { label: 'Escribirle', href: `/dashboard/usuarios/${row.user_id}` },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

/** Workbook con contenido escrito pero avance en cero (o al revés). */
async function detectProgressMismatch(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; title: string; llaves: number;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text, w.title,
             (SELECT COUNT(*) FROM jsonb_each_text(w.state_payload) e
               WHERE e.key ~ '^wb[0-9]+v3-' AND length(btrim(e.value)) > 0)::int AS llaves
      FROM app_learning.user_workbooks w
      JOIN app_core.users u ON u.user_id = w.owner_user_id
      WHERE u.is_active = true
        AND COALESCE(w.completion_percent, 0) = 0
        -- Se cuentan RESPUESTAS con texto, no llaves: los workbooks del formato
        -- antiguo guardan decenas de llaves vacías y aparecían como falsos casos.
        AND (
          SELECT COUNT(*) FROM jsonb_each_text(COALESCE(w.state_payload, '{}'::jsonb)) e
          WHERE e.key ~ '^wb[0-9]+v3-' AND length(btrim(e.value)) > 0
        ) >= 3
      ORDER BY llaves DESC
      LIMIT 20
    `,
  );

  return rows.map((row) => ({
    incidentId: `avance-inconsistente:${row.user_id}:${row.title}`,
    type: 'avance_inconsistente',
    severity: 'media' as IncidentSeverity,
    title: `Avance en 0 % con contenido escrito · ${row.display_name}`,
    summary:
      `Su ${row.title} tiene ${row.llaves} respuestas guardadas pero figura en 0 %. El contenido está, ` +
      `lo que no cuadra es el indicador, así que su progreso se ve peor de lo que es.`,
    evidence: [
      `${row.display_name} · ${row.email}`,
      `${row.title} · ${row.llaves} respuestas guardadas · avance 0 %`,
    ],
    checklist: [
      'Abre el workbook desde su 360 y confirma que las respuestas se ven.',
      'Si el contenido está, es solo el porcentaje: pide el recálculo (no requiere que el líder repita nada).',
    ],
    actions: [
      { label: 'Ver 360 del líder', href: `/dashboard/lideres/${row.user_id}`, primary: true },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

/** Suscripción vencida con la cuenta todavía activa. */
async function detectExpiredPlan(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; plan_name: string; dias: number;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text, sp.name AS plan_name,
             EXTRACT(DAY FROM now() - up.subscription_expires_at)::int AS dias
      FROM app_core.users u
      JOIN app_core.user_profiles up ON up.user_id = u.user_id
      JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
      WHERE u.primary_role = 'lider' AND u.is_active = true
        AND up.subscription_expires_at IS NOT NULL
        AND up.subscription_expires_at < now()
      ORDER BY dias DESC
      LIMIT 20
    `,
  );

  return rows.map((row) => ({
    incidentId: `plan-vencido:${row.user_id}`,
    type: 'plan_vencido',
    severity: 'alta' as IncidentSeverity,
    title: `Plan vencido hace ${row.dias} días · ${row.display_name}`,
    summary:
      `Su plan ${row.plan_name} venció y la cuenta sigue activa: hoy entra como líder sin suscripción y ` +
      `perdió el acceso a los módulos del programa, aunque conserva lo que ya había hecho.`,
    evidence: [
      `${row.display_name} · ${row.email}`,
      `Plan ${row.plan_name} · vencido hace ${row.dias} días`,
    ],
    checklist: [
      '¿Renovó y no se registró? Entonces hay que extender el vencimiento en su ficha.',
      '¿No renovó? Decide si se le acompaña comercialmente o se cierra el ciclo.',
    ],
    actions: [
      { label: 'Abrir ficha y ajustar vencimiento', href: `/dashboard/usuarios/${row.user_id}`, primary: true },
      { label: 'Ver 360 del líder', href: `/dashboard/lideres/${row.user_id}` },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

/** Invitado que ya tiene compra registrada y sigue sin plan de líder. */
async function detectGuestWithPurchase(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; productos: string;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text,
             string_agg(DISTINCT pc.name, ', ') AS productos
      FROM app_core.users u
      JOIN app_billing.user_purchases p ON p.user_id = u.user_id AND p.status = 'active'
      JOIN app_billing.product_catalog pc ON pc.product_code = p.product_code
      WHERE u.is_active = true AND u.primary_role = 'invitado'
        AND pc.product_group <> 'discovery'
      GROUP BY 1, 2, 3
      LIMIT 20
    `,
  );

  return rows.map((row) => ({
    incidentId: `invitado-con-compra:${row.user_id}`,
    type: 'invitado_con_compra',
    severity: 'alta' as IncidentSeverity,
    title: `Invitado con compra sin activar · ${row.display_name}`,
    summary:
      `Tiene una compra activa (${row.productos}) pero su cuenta sigue como invitada, así que solo ve ` +
      `Descubrimiento. Está pagando por un acceso que no tiene.`,
    evidence: [
      `${row.display_name} · ${row.email} · rol invitado`,
      `Compras activas: ${row.productos}`,
    ],
    checklist: [
      'Verifica la compra en GoHighLevel o en el historial de pagos.',
      'Al asignarle el plan en su ficha, la cuenta pasa a líder y conserva lo que ya hizo.',
    ],
    actions: [
      { label: 'Asignar plan en su ficha', href: `/dashboard/usuarios/${row.user_id}`, primary: true },
      { label: 'Revisar compras (GHL)', href: '/dashboard/administracion/ghl' },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

/** Mentorías del programa disponibles y sin agendar hace tiempo. */
async function detectUnusedMentorships(client: PoolClient): Promise<IncidentRecord[]> {
  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string; disponibles: number; dias: number;
  }>(
    `
      SELECT u.user_id::text, u.display_name, u.email::text,
             COUNT(*)::int AS disponibles,
             EXTRACT(DAY FROM now() - COALESCE(up.subscription_started_at, u.created_at))::int AS dias
      FROM app_mentoring.user_program_mentorships m
      JOIN app_core.users u ON u.user_id = m.owner_user_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE u.is_active = true AND m.status = 'available' AND m.scheduled_session_id IS NULL
        AND COALESCE(up.subscription_started_at, u.created_at) < now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM app_mentoring.user_program_mentorships m2
          WHERE m2.owner_user_id = u.user_id AND m2.status <> 'available'
        )
      GROUP BY 1, 2, 3, dias
      ORDER BY dias DESC
      LIMIT 20
    `,
  );

  return rows.map((row) => ({
    incidentId: `mentorias-sin-usar:${row.user_id}`,
    type: 'mentorias_sin_usar',
    severity: 'media' as IncidentSeverity,
    title: `${row.display_name} no ha agendado ninguna mentoría`,
    summary:
      `Lleva ${row.dias} días en el programa con ${row.disponibles} mentorías 1:1 disponibles y ninguna agendada. ` +
      `Es el indicador más temprano de desconexión.`,
    evidence: [
      `${row.display_name} · ${row.email}`,
      `${row.disponibles} mentorías disponibles · ${row.dias} días en el programa`,
    ],
    checklist: [
      'Revisa si tiene advisor asignado y si hay franjas disponibles en la agenda.',
      'Desde su 360 puedes agendarle la primera sesión aunque el sistema aún no la habilite.',
    ],
    actions: [
      { label: 'Agendar desde su 360', href: `/dashboard/lideres/${row.user_id}`, primary: true },
      { label: 'Revisar agenda de advisors', href: '/dashboard/mentorias' },
    ],
    userIds: [row.user_id],
    detectedAt: nowIso(),
  }));
}

const SEVERITY_ORDER: Record<IncidentSeverity, number> = { alta: 0, media: 1, baja: 2 };

/**
 * Ejecuta todos los detectores. Cada uno se aísla: si una consulta falla (por
 * ejemplo tras un cambio de esquema), el resto del panel sigue funcionando.
 */
export async function listIncidents(
  client: PoolClient,
  options?: { userId?: string },
): Promise<IncidentsSummary> {
  await requireModulePermission(client, 'usuarios', 'view');

  const detectors = [
    detectDuplicateAccounts,
    detectGuestWithPurchase,
    detectExpiredPlan,
    detectMissingDiagnostic,
    detectStalledDiagnostic,
    detectProgressMismatch,
    detectUnusedMentorships,
  ];

  const results = await Promise.all(
    detectors.map((run) =>
      run(client).catch((error) => {
        console.error('[incidencias] detector falló:', error);
        return [] as IncidentRecord[];
      }),
    ),
  );

  let incidents = results.flat();
  if (options?.userId) {
    incidents = incidents.filter((incident) => incident.userIds.includes(options.userId!));
  }

  // Los detectores vuelven a encontrar el caso en cada carga; lo que decide si
  // se muestra es si alguien ya lo cerró.
  const closed = await listClosedIncidentIds(client);
  const detected = incidents.length;
  incidents = incidents.filter((incident) => !closed.has(incident.incidentId));

  incidents.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const countsBySeverity: Record<IncidentSeverity, number> = { alta: 0, media: 0, baja: 0 };
  for (const incident of incidents) countsBySeverity[incident.severity] += 1;

  return {
    incidents,
    countsBySeverity,
    dismissedCount: detected - incidents.length,
    generatedAt: nowIso(),
  };
}

/* ── Cierre de casos ─────────────────────────────────────────────────────── */

async function listClosedIncidentIds(client: PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ incident_id: string }>(
    'SELECT incident_id FROM app_admin.incident_dismissals',
  );
  return new Set(rows.map((row) => row.incident_id));
}

/**
 * Cierra un caso: deja de aparecer en el panel hasta que alguien lo reabra.
 * Se guarda el título tal como se vio, para que la lista de casos cerrados
 * siga siendo legible aunque el detector ya no genere ese caso.
 */
export async function closeIncident(
  client: PoolClient,
  actor: { userId: string },
  input: {
    incidentId: string;
    type: string;
    title: string;
    resolution: IncidentResolution;
    note?: string | null;
    userIds?: string[];
  },
): Promise<DismissedIncident> {
  await requireModulePermission(client, 'usuarios', 'view');

  const note = input.note?.trim() ? input.note.trim().slice(0, 500) : null;
  const { rows } = await client.query<{
    incident_id: string; incident_type: string; title: string;
    resolution: IncidentResolution; note: string | null; closed_at: string;
  }>(
    `
      INSERT INTO app_admin.incident_dismissals
        (incident_id, incident_type, title, resolution, note, user_ids, closed_by)
      VALUES ($1, $2, $3, $4, $5, $6::uuid[], $7)
      ON CONFLICT (incident_id) DO UPDATE
        SET incident_type = EXCLUDED.incident_type,
            title         = EXCLUDED.title,
            resolution    = EXCLUDED.resolution,
            note          = EXCLUDED.note,
            user_ids      = EXCLUDED.user_ids,
            closed_by     = EXCLUDED.closed_by,
            closed_at     = now()
      RETURNING incident_id, incident_type, title, resolution, note, closed_at
    `,
    [
      input.incidentId,
      input.type,
      input.title.slice(0, 300),
      input.resolution,
      note,
      input.userIds ?? [],
      actor.userId,
    ],
  );

  const row = rows[0];
  return {
    incidentId: row.incident_id,
    type: row.incident_type,
    title: row.title,
    resolution: row.resolution,
    note: row.note,
    closedAt: new Date(row.closed_at).toISOString(),
    closedByName: null,
  };
}

/** Reabre un caso cerrado: vuelve al panel si el detector sigue encontrándolo. */
export async function reopenIncident(client: PoolClient, incidentId: string): Promise<boolean> {
  await requireModulePermission(client, 'usuarios', 'view');
  const { rowCount } = await client.query(
    'DELETE FROM app_admin.incident_dismissals WHERE incident_id = $1',
    [incidentId],
  );
  return (rowCount ?? 0) > 0;
}

/** Historial de casos cerrados, para consultarlos o reabrirlos. */
export async function listClosedIncidents(
  client: PoolClient,
  options?: { userId?: string },
): Promise<DismissedIncident[]> {
  await requireModulePermission(client, 'usuarios', 'view');

  const { rows } = await client.query<{
    incident_id: string; incident_type: string; title: string;
    resolution: IncidentResolution; note: string | null; closed_at: string; closed_by_name: string | null;
  }>(
    `
      SELECT d.incident_id, d.incident_type, d.title, d.resolution, d.note, d.closed_at,
             u.display_name AS closed_by_name
      FROM app_admin.incident_dismissals d
      LEFT JOIN app_core.users u ON u.user_id = d.closed_by
      WHERE $1::uuid IS NULL OR $1::uuid = ANY (d.user_ids)
      ORDER BY d.closed_at DESC
      LIMIT 200
    `,
    [options?.userId ?? null],
  );

  return rows.map((row) => ({
    incidentId: row.incident_id,
    type: row.incident_type,
    title: row.title,
    resolution: row.resolution,
    note: row.note,
    closedAt: new Date(row.closed_at).toISOString(),
    closedByName: row.closed_by_name,
  }));
}

/* ── Asistente de incidencias ────────────────────────────────────────────── */

/**
 * Análisis guiado de un caso. La guía determinista (checklist + acciones) ya
 * viaja en la incidencia; esto añade una lectura del caso concreto: qué revisar
 * primero, qué decidir y qué NO hacer. Si OpenAI no está configurado, se
 * devuelve null y el panel sigue mostrando la guía base.
 */
export async function analyzeIncident(
  client: PoolClient,
  actor: { userId: string; role: string },
  incident: Pick<IncidentRecord, 'type' | 'title' | 'summary' | 'evidence' | 'checklist'>,
): Promise<string | null> {
  await requireModulePermission(client, 'usuarios', 'view');

  const cfg = await getIntegrationConfigForActor(client, actor.userId, 'openai');
  if (!cfg || !cfg.enabled) return null;
  const apiKey = (cfg.wizardData.apiKey || cfg.secretValue || '').trim();
  if (!apiKey) return null;

  const baseUrl = (cfg.wizardData.baseUrl || '').trim().replace(/\/+$/, '') || 'https://api.openai.com/v1';
  const model = (cfg.wizardData.model || '').trim() || 'gpt-4.1';

  const system =
    'Eres el asistente de operaciones de 4Shine, una plataforma de desarrollo de liderazgo. ' +
    'Ayudas a gestores y administradores a resolver incidencias de cuentas y avance de líderes. ' +
    'Respondes en español, en segunda persona, sin rodeos ni saludos. Usa Markdown con estos tres ' +
    'apartados y nada más: **Qué está pasando** (2-3 frases interpretando la evidencia), ' +
    '**Qué verificar primero** (lista corta y accionable, en orden) y **Qué decidir** (las opciones ' +
    'reales con su consecuencia, incluida la de no hacer nada). Si la evidencia no alcanza para ' +
    'concluir, dilo. Nunca inventes datos que no estén en la evidencia. Máximo 220 palabras.';

  const user =
    `Tipo de incidencia: ${incident.type}\n` +
    `Título: ${incident.title}\n` +
    `Resumen del detector: ${incident.summary}\n` +
    `Evidencia:\n${incident.evidence.map((e) => `- ${e}`).join('\n')}\n` +
    `Guía base ya mostrada al gestor:\n${incident.checklist.map((c) => `- ${c}`).join('\n')}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('[incidencias] OpenAI no-OK', res.status);
      return null;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch (error) {
    console.error('[incidencias] análisis IA falló:', error);
    return null;
  }
}
