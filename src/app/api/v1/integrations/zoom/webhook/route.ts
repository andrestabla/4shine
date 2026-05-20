import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { ingestZoomRecording } from '@/features/mentorias/service';
import { setZoomRecordingPublic } from '@/server/integrations/zoom';

export const runtime = 'nodejs';

async function getZoomWebhookSecret(client: import('pg').PoolClient): Promise<string | null> {
  const { rows } = await client.query<{ wizard_data: Record<string, string> | null }>(
    `SELECT ic.wizard_data
     FROM app_admin.integration_configs ic
     JOIN app_core.organizations o ON o.organization_id = ic.organization_id
     WHERE ic.integration_key = 'zoom'
     LIMIT 1`,
  );
  return rows[0]?.wizard_data?.webhookSecretToken?.trim() || null;
}

export async function POST(request: Request) {
  // Read the raw body: Zoom signs the exact bytes it sent, so the signature
  // must be verified against this string, not a re-serialized JSON object.
  const rawBody = await request.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Zoom Challenge-Response Check (CRC) — validates endpoint ownership
  if (
    body.event === 'endpoint.url_validation' &&
    body.payload &&
    typeof (body.payload as Record<string, unknown>).plainToken === 'string'
  ) {
    const plainToken = (body.payload as Record<string, string>).plainToken;

    const secret = await withClient((client) => getZoomWebhookSecret(client));
    if (!secret) {
      return NextResponse.json({ error: 'Zoom webhook secret not configured' }, { status: 500 });
    }

    const encryptedToken = createHmac('sha256', secret).update(plainToken).digest('hex');
    return NextResponse.json({ plainToken, encryptedToken }, { status: 200 });
  }

  // Actual webhook events — verify x-zm-signature before processing
  const zmSignature = request.headers.get('x-zm-signature');
  const zmTimestamp = request.headers.get('x-zm-request-timestamp');
  if (zmSignature && zmTimestamp) {
    const secret = await withClient((client) => getZoomWebhookSecret(client));
    if (secret) {
      const message = `v0:${zmTimestamp}:${rawBody}`;
      const hash = 'v0=' + createHmac('sha256', secret).update(message).digest('hex');
      if (hash !== zmSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
  }

  if (body.event === 'recording.completed') {
    const obj = (body.payload as Record<string, unknown>)?.object as Record<string, unknown> | undefined;
    if (obj) {
      const meetingId = String(obj.id ?? '');
      const topic = String(obj.topic ?? '');
      const files = (obj.recording_files ?? []) as Array<Record<string, unknown>>;

      const PRIORITY = [
        'shared_screen_with_speaker_view',
        'active_speaker',
        'shared_screen_with_gallery_view',
        'shared_screen',
      ];
      const mp4 = files
        .filter((f) => f.file_type === 'MP4' && f.status === 'completed' && f.play_url)
        .sort((a, b) => {
          const pa = PRIORITY.indexOf(String(a.recording_type ?? ''));
          const pb = PRIORITY.indexOf(String(b.recording_type ?? ''));
          return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
        })[0];

      if (mp4 && meetingId) {
        const start = mp4.recording_start ? String(mp4.recording_start) : null;
        const end = mp4.recording_end ? String(mp4.recording_end) : null;
        const durationMinutes =
          start && end
            ? Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
            : 0;
        const playUrl = String(mp4.play_url);

        // Make recording publicly accessible, then ingest it.
        // Both are fire-and-forget so the webhook returns 200 immediately.
        void (async () => {
          try {
            await withClient((client) => setZoomRecordingPublic(client, meetingId));
          } catch (err) {
            console.error('[zoom webhook] set recording public failed:', err);
          }
          withClient((client) =>
            ingestZoomRecording(client, { meetingId, topic, playUrl, durationMinutes, recordedAt: start }),
          ).catch((err) => console.error('[zoom webhook] recording ingest failed:', err));
        })();
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
