import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { errorResponse, unauthorizedResponse } from '../../_utils';

/**
 * Política de privacidad para el panel. Se guarda como una fila de
 * integration_configs (integration_key = 'privacy_policy'), pero es contenido
 * editorial y no una credencial: la abre el permiso `politicas:manage`, no el
 * de Integraciones ni el de Gestión de Usuarios.
 *
 * La lectura pública (pantalla de aceptación, sitio) va por
 * /api/v1/public/privacy-policy y no pasa por aquí.
 */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const wizardData = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'politicas', 'manage');
        const { rows } = await client.query<{ wizard_data: Record<string, string> | null }>(
          `SELECT wizard_data
           FROM app_admin.integration_configs
           WHERE integration_key = 'privacy_policy'
           LIMIT 1`,
        );
        return rows[0]?.wizard_data ?? null;
      }),
    );
    return NextResponse.json({ ok: true, wizardData });
  } catch (error) {
    return errorResponse(error, 'Error al cargar política');
  }
}

export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  let body: { version?: string; content?: string };
  try {
    body = (await request.json()) as { version?: string; content?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const version = body.version?.trim();
  const content = body.content?.trim();

  if (!version || !content) {
    return NextResponse.json({ ok: false, error: 'version y content son requeridos' }, { status: 400 });
  }

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'politicas', 'manage');
        await client.query(
          `INSERT INTO app_admin.integration_configs (integration_key, enabled, wizard_data)
           VALUES ('privacy_policy', true, $1::jsonb)
           ON CONFLICT (integration_key)
           DO UPDATE SET wizard_data = $1::jsonb, updated_at = now()`,
          [JSON.stringify({ version, content })],
        );
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Error al guardar política');
  }
}
