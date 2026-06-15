import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (identity.guestScope === 'descubrimiento') {
    return NextResponse.json(
      {
        ok: true,
        user: {
          id: identity.userId,
          email: identity.email,
          name: identity.name,
          role: identity.role,
        },
      },
      { status: 200 },
    );
  }

  const result = await withClient((client) =>
    withRoleContext(client, identity.userId, identity.role, async () => {
      const { rows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        primary_role: string;
        is_active: boolean;
        privacy_policy_accepted_at: string | null;
        must_change_password: boolean;
      }>(
        `
          SELECT u.user_id, u.email, u.display_name, u.primary_role, u.is_active,
                 uc.must_change_password,
                 lpa.accepted_at::text AS privacy_policy_accepted_at
          FROM app_core.users u
          JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
          LEFT JOIN LATERAL (
            SELECT accepted_at
            FROM app_auth.user_policy_acceptances
            WHERE user_id = u.user_id AND policy_code = 'privacy_policy'
            ORDER BY accepted_at DESC LIMIT 1
          ) lpa ON true
          WHERE u.user_id = $1
          LIMIT 1
        `,
        [identity.userId],
      );

      return rows[0] ?? null;
    }),
  );

  if (!result || !result.is_active) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await recordAuditEvent(
      {
        action: 'auth_me_query',
        entityTable: 'app_core.users',
        entityId: identity.userId,
        changeSummary: buildRequestSummary(request),
      },
      identity,
    );
  } catch (auditError) {
    console.error('Audit log failed', auditError);
  }

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: result.user_id,
        email: result.email,
        name: result.display_name,
        role: result.primary_role,
        privacyPolicyAccepted: !!result.privacy_policy_accepted_at,
        mustChangePassword: !!result.must_change_password,
      },
    },
    { status: 200 },
  );
}
