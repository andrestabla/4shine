import type { PoolClient } from 'pg';
import { getIntegrationConfigForActor } from './config';

async function getInstitutionTimezone(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ institution_timezone: string }>(
    `SELECT institution_timezone FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`,
  );
  return rows[0]?.institution_timezone || 'America/Bogota';
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
  const clientSecret = config.secretValue?.trim();
  if (!accountId || !clientId || !clientSecret) return null;

  const timezone = params.timezone ?? await getInstitutionTimezone(client);
  const waitingRoom = params.waitingRoom ?? config.wizardData.waitingRoom !== 'false';
  const autoRecording = (params.autoRecording ?? config.wizardData.autoRecording ?? 'none') as
    | 'none'
    | 'local'
    | 'cloud';

  const token = await getAccessToken(accountId, clientId, clientSecret);

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2,
      start_time: params.startsAt,
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
    }),
  });

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
  const clientSecret = config.secretValue?.trim();
  if (!accountId || !clientId || !clientSecret) return;

  const token = await getAccessToken(accountId, clientId, clientSecret);
  const timezone = await getInstitutionTimezone(client);

  const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: params.startsAt,
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
  const clientSecret = config.secretValue?.trim();
  if (!accountId || !clientId || !clientSecret) return;

  const token = await getAccessToken(accountId, clientId, clientSecret);
  await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
