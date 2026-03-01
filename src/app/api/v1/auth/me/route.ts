import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await withClient((client) =>
    withRoleContext(client, identity.userId, identity.role, async () => {
      const { rows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        primary_role: string;
        is_active: boolean;
      }>(
        `
          SELECT user_id, email, display_name, primary_role, is_active
          FROM app_core.users
          WHERE user_id = $1
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

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: result.user_id,
        email: result.email,
        name: result.display_name,
        role: result.primary_role,
      },
    },
    { status: 200 },
  );
}
