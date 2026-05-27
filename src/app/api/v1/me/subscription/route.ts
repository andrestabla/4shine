import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { errorResponse, unauthorizedResponse } from '../../modules/_utils';

interface MeSubscriptionRow {
  subscription_plan_id: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  plan_code: string | null;
  plan_name: string | null;
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const { rows } = await client.query<MeSubscriptionRow>(
          `SELECT
             up.subscription_plan_id::text AS subscription_plan_id,
             up.subscription_started_at::text AS subscription_started_at,
             up.subscription_expires_at::text AS subscription_expires_at,
             sp.plan_code,
             sp.name AS plan_name
           FROM app_core.user_profiles up
           LEFT JOIN app_billing.subscription_plans sp
             ON sp.plan_id = up.subscription_plan_id
           WHERE up.user_id = $1::uuid
           LIMIT 1`,
          [identity.userId],
        );
        const row = rows[0];
        return {
          subscriptionPlanId: row?.subscription_plan_id ?? null,
          subscriptionStartedAt: row?.subscription_started_at ?? null,
          subscriptionExpiresAt: row?.subscription_expires_at ?? null,
          planCode: row?.plan_code ?? null,
          planName: row?.plan_name ?? null,
        };
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load subscription state');
  }
}
