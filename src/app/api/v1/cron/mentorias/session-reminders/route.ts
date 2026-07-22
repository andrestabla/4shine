import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/server/auth/cron-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { sendIndividualSessionReminders, sendGroupSessionReminders } from '@/features/mentorias/service';
import { sendDiscoveryReminders } from '@/features/descubrimiento/service';
import { processCustomEventSchedules } from '@/features/notificaciones/custom-events-service';

export const runtime = 'nodejs';
// Disable any caching — this must run live for the cron to be useful.
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: scans mentorship_sessions and sends session_reminder
 * notifications for sessions starting in the 24h and 1h windows. Idempotent
 * via app_mentoring.session_reminders_sent.
 *
 * Auth: this endpoint is called by Vercel Cron (configured in vercel.json),
 * which sets `Authorization: Bearer ${CRON_SECRET}` automatically when the
 * env var is set. Locally you can call it with the same header.
 */
export async function GET(request: Request) {
  // Falla cerrado: sin CRON_SECRET no se ejecuta. Antes se aceptaba la
  // cabecera x-vercel-cron como respaldo, y esa la pone el cliente.
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await withClient(async (client) => {
      // Resolve any admin user to use as the RLS role context for the run.
      // We need admin to bypass RLS on mentorship_sessions / users / notifications.
      const { rows } = await client.query<{ user_id: string }>(
        `SELECT user_id::text FROM app_core.users WHERE primary_role = 'admin' ORDER BY created_at LIMIT 1`,
      );
      const adminUserId = rows[0]?.user_id;
      if (!adminUserId) {
        throw new Error('No admin user found to run cron as.');
      }
      return withRoleContext(client, adminUserId, 'admin', async () => {
        const individual = await sendIndividualSessionReminders(client);
        const group = await sendGroupSessionReminders(client);
        const discovery = await sendDiscoveryReminders(client);
        const customEvents = await processCustomEventSchedules(client);
        return { individual, group, discovery, customEvents };
      });
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          ranAt: new Date().toISOString(),
          windows: results,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[cron/session-reminders] failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
