import type { PoolClient } from 'pg';
import { getIntegrationConfigForActor } from './config';

async function getInstitutionTimezone(client: PoolClient, actorUserId: string): Promise<string> {
  try {
    const { rows } = await client.query<{ institution_timezone: string }>(
      `SELECT bs.institution_timezone
       FROM app_admin.branding_settings bs
       JOIN app_core.users u ON u.organization_id = bs.organization_id
       WHERE u.user_id = $1::uuid
       LIMIT 1`,
      [actorUserId],
    );
    return rows[0]?.institution_timezone || 'America/Bogota';
  } catch {
    return 'America/Bogota';
  }
}

// Zoom's start_time expects local wall-clock time (yyyy-MM-ddTHH:mm:ss, no offset)
// paired with the timezone field. Sending a UTC ISO string with milliseconds makes
// Zoom misread the value as local time. Convert the instant to the target timezone.
function toZoomLocalTime(isoInstant: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(isoInstant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
}

export interface ZoomMeetingResult {
  meetingId: string;
  joinUrl: string;
  hostUrl: string;
}

export interface ZoomMeetingParams {
  topic: string;
  startsAt: string;
  durationMinutes: number;
  hostEmail?: string;
  timezone?: string;
  waitingRoom?: boolean;
  autoRecording?: 'none' | 'local' | 'cloud';
}

interface ZoomTokenResponse {
  access_token: string;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_url: string;
}

async function getAccessToken(
  accountId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Zoom token error ${res.status}: ${await res.text()}`);
  }
  return ((await res.json()) as ZoomTokenResponse).access_token;
}

export async function createZoomMeeting(
  client: PoolClient,
  actorUserId: string,
  params: ZoomMeetingParams,
): Promise<ZoomMeetingResult | null> {
  const config = await getIntegrationConfigForActor(client, actorUserId, 'zoom');
  if (!config?.enabled) return null;

  const accountId = config.wizardData.accountId?.trim();
  const clientId = config.wizardData.clientId?.trim();
  // wizard_data.clientSecret is the canonical location; secret_value is a secondary store
  const clientSecret = (config.wizardData.clientSecret?.trim() || config.secretValue?.trim());
  if (!accountId || !clientId || !clientSecret) return null;

  const timezone = params.timezone ?? await getInstitutionTimezone(client, actorUserId);
  const waitingRoom = params.waitingRoom ?? config.wizardData.waitingRoom !== 'false';
  const autoRecording = (params.autoRecording ?? config.wizardData.autoRecording ?? 'none') as
    | 'none'
    | 'local'
    | 'cloud';

  const token = await getAccessToken(accountId, clientId, clientSecret);

  const meetingBody: Record<string, unknown> = {
    topic: params.topic,
    type: 2,
    start_time: toZoomLocalTime(params.startsAt, timezone),
    duration: params.durationMinutes,
    timezone,
    settings: {
      waiting_room: waitingRoom,
      auto_recording: autoRecording,
      host_video: true,
      participant_video: false,
      join_before_host: false,
      mute_upon_entry: true,
    },
  };

  const postMeeting = (payload: Record<string, unknown>) =>
    fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  // The Adviser host can start the meeting when set as an alternative host.
  // Zoom requires that email to belong to a user on the same Zoom account; if it
  // does not, the request is retried without it so the meeting is still created.
  let res: Response;
  if (params.hostEmail) {
    res = await postMeeting({
      ...meetingBody,
      settings: { ...(meetingBody.settings as object), alternative_hosts: params.hostEmail },
    });
    if (!res.ok) {
      res = await postMeeting(meetingBody);
    }
  } else {
    res = await postMeeting(meetingBody);
  }

  if (!res.ok) {
    throw new Error(`Zoom create meeting error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as ZoomMeetingResponse;
  return {
    meetingId: String(data.id),
    joinUrl: data.join_url,
    hostUrl: data.start_url,
  };
}

export async function updateZoomMeetingTime(
  client: PoolClient,
  actorUserId: string,
  meetingId: string,
  params: Pick<ZoomMeetingParams, 'startsAt' | 'durationMinutes'>,
): Promise<void> {
  const config = await getIntegrationConfigForActor(client, actorUserId, 'zoom');
  if (!config?.enabled) return;

  const accountId = config.wizardData.accountId?.trim();
  const clientId = config.wizardData.clientId?.trim();
  const clientSecret = config.wizardData.clientSecret?.trim() || config.secretValue?.trim();
  if (!accountId || !clientId || !clientSecret) return;

  const token = await getAccessToken(accountId, clientId, clientSecret);
  const timezone = await getInstitutionTimezone(client, actorUserId);

  const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: toZoomLocalTime(params.startsAt, timezone),
      duration: params.durationMinutes,
      timezone,
    }),
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Zoom update meeting error ${res.status}: ${await res.text()}`);
  }
}

export async function deleteZoomMeeting(
  client: PoolClient,
  actorUserId: string,
  meetingId: string,
): Promise<void> {
  const config = await getIntegrationConfigForActor(client, actorUserId, 'zoom');
  if (!config?.enabled) return;

  const accountId = config.wizardData.accountId?.trim();
  const clientId = config.wizardData.clientId?.trim();
  const clientSecret = config.wizardData.clientSecret?.trim() || config.secretValue?.trim();
  if (!accountId || !clientId || !clientSecret) return;

  const token = await getAccessToken(accountId, clientId, clientSecret);
  await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getZoomCredentials(
  client: PoolClient,
): Promise<{ accountId: string; clientId: string; clientSecret: string } | null> {
  const { rows } = await client.query<{ wizard_data: Record<string, string> | null; secret_value: string | null }>(
    `SELECT ic.wizard_data, ic.secret_value
     FROM app_admin.integration_configs ic
     WHERE ic.integration_key = 'zoom'
     ORDER BY ic.updated_at DESC
     LIMIT 1`,
  );
  const row = rows[0];
  if (!row?.wizard_data) return null;
  const accountId = row.wizard_data.accountId?.trim();
  const clientId = row.wizard_data.clientId?.trim();
  const clientSecret = row.wizard_data.clientSecret?.trim() || row.secret_value?.trim();
  if (!accountId || !clientId || !clientSecret) return null;
  return { accountId, clientId, clientSecret };
}

export async function setZoomRecordingPublic(
  client: PoolClient,
  meetingId: string,
): Promise<void> {
  const creds = await getZoomCredentials(client);
  if (!creds) return;

  const token = await getAccessToken(creds.accountId, creds.clientId, creds.clientSecret);
  const res = await fetch(
    `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}/recordings/settings`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_recording: 'publicly' }),
    },
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`Zoom set recording public error ${res.status}: ${await res.text()}`);
  }
}
