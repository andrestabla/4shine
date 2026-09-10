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
  /**
   * Para sesiones 1:1: fuerza grabación en la nube y transcripción automática,
   * independientemente del ajuste por defecto de la integración.
   */
  enableAutoTranscription?: boolean;
}

/**
 * Habilita (best-effort) la grabación en la nube + transcripción de audio en los
 * ajustes del usuario "me" de la cuenta Zoom, para que las grabaciones generen
 * transcripción automáticamente. No interrumpe el flujo si falla (scopes/permits).
 */
async function ensureCloudTranscriptSettings(token: string): Promise<void> {
  try {
    await fetch('https://api.zoom.us/v2/users/me/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording: {
          cloud_recording: true,
          auto_recording: 'cloud',
          recording_audio_transcript: true,
        },
      }),
    });
  } catch (err) {
    console.error('[zoom] no se pudo activar transcripción automática en ajustes:', err);
  }
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
  // En 1:1 se fuerza grabación en la nube (requisito para la transcripción automática).
  const autoRecording = params.enableAutoTranscription
    ? 'cloud'
    : ((params.autoRecording ?? config.wizardData.autoRecording ?? 'none') as 'none' | 'local' | 'cloud');

  const token = await getAccessToken(accountId, clientId, clientSecret);

  if (params.enableAutoTranscription) {
    await ensureCloudTranscriptSettings(token);
  }

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

  // The Advisor host can start the meeting when set as an alternative host.
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

// ─── Grabaciones compartidas: enlace de un clic ────────────────────────────
//
// Zoom pide un código de acceso al abrir una grabación compartida. La única
// forma oficial de saltárselo es incluir en la URL el `recording_play_passcode`
// (un token cifrado, distinto del código que ve la gente) como `?pwd=...`.
// Ese token solo lo entrega la API, así que aquí buscamos la grabación en la
// cuenta conectada y devolvemos la URL lista para abrirse sin pedir nada.

const ZOOM_RECORDING_URL_RE = /zoom\.[a-z.]+\/rec\/(share|play)\/([^?#/]+)/i;
const ZOOM_WINDOW_DAYS = 29; // la API admite rangos de hasta 30 días
const ZOOM_MAX_WINDOWS = 12; // ~un año hacia atrás

export function isZoomRecordingUrl(url: string): boolean {
  return ZOOM_RECORDING_URL_RE.test(url.trim());
}

export function zoomUrlHasEmbeddedPasscode(url: string): boolean {
  return /[?&]pwd=[^&#]+/i.test(url.trim());
}

export type ZoomRecordingLookupResult =
  | { status: 'resolved'; url: string; topic: string | null }
  | { status: 'already_one_click'; url: string }
  | { status: 'not_zoom' }
  | { status: 'not_configured' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

interface ZoomRecordingFile {
  play_url?: string;
}

interface ZoomRecordingMeeting {
  topic?: string;
  share_url?: string;
  recording_play_passcode?: string;
  recording_files?: ZoomRecordingFile[];
}

function formatZoomDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function appendPasscode(url: string, passcode: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('pwd', passcode);
  return parsed.toString();
}

async function listZoomUserIds(token: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.zoom.us/v2/users?status=active&page_size=300', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return ['me'];
    const data = (await res.json()) as { users?: Array<{ id?: string }> };
    const ids = (data.users ?? []).map((u) => u.id).filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : ['me'];
  } catch {
    return ['me'];
  }
}

/**
 * Busca una grabación compartida de Zoom en la cuenta conectada y devuelve la
 * URL con el código de acceso incrustado (`?pwd=`), para que quien la abra no
 * tenga que escribirlo. Recorre las grabaciones de los usuarios de la cuenta
 * por ventanas de 30 días, de la más reciente hacia atrás, hasta `maxRequests`
 * llamadas a la API.
 */
// Caché en memoria por URL: evita repetir hasta decenas de llamadas a Zoom
// cuando el mismo enlace se guarda varias veces seguidas (editor + guardado).
const zoomLookupCache = new Map<string, { result: ZoomRecordingLookupResult; expiresAt: number }>();
const ZOOM_CACHE_TTL_MS = { resolved: 24 * 60 * 60 * 1000, not_found: 10 * 60 * 1000 };

export async function resolveZoomRecordingOneClickUrl(
  client: PoolClient,
  rawUrl: string,
  options: { maxRequests?: number } = {},
): Promise<ZoomRecordingLookupResult> {
  const url = rawUrl.trim();
  const match = url.match(ZOOM_RECORDING_URL_RE);
  if (!match) return { status: 'not_zoom' };
  if (zoomUrlHasEmbeddedPasscode(url)) return { status: 'already_one_click', url };

  const cached = zoomLookupCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const creds = await getZoomCredentials(client);
  if (!creds) return { status: 'not_configured' };

  const result = await lookupZoomRecording(url, match[1].toLowerCase(), match[2], creds, options);
  if (result.status === 'resolved' || result.status === 'already_one_click') {
    zoomLookupCache.set(url, { result, expiresAt: Date.now() + ZOOM_CACHE_TTL_MS.resolved });
  } else if (result.status === 'not_found') {
    zoomLookupCache.set(url, { result, expiresAt: Date.now() + ZOOM_CACHE_TTL_MS.not_found });
  }
  return result;
}

async function lookupZoomRecording(
  url: string,
  kind: string,
  id: string,
  creds: { accountId: string; clientId: string; clientSecret: string },
  options: { maxRequests?: number },
): Promise<ZoomRecordingLookupResult> {

  const maxRequests = Math.max(1, options.maxRequests ?? 60);
  // Traza de la búsqueda: sale al log cuando no se resuelve, para poder
  // diagnosticar desde Vercel (scopes faltantes, usuario equivocado, etc.).
  const trace: string[] = [];
  const finish = (result: ZoomRecordingLookupResult): ZoomRecordingLookupResult => {
    if (result.status !== 'resolved') {
      console.error(`[zoom lookup] ${kind}/${id.slice(0, 12)}… → ${result.status}`, trace.join(' | '));
    }
    return result;
  };

  try {
    const token = await getAccessToken(creds.accountId, creds.clientId, creds.clientSecret);
    const userIds = await listZoomUserIds(token);
    trace.push(`users=${userIds.length}${userIds[0] === 'me' && userIds.length === 1 ? ' (solo me: sin permiso para listar usuarios)' : ''}`);
    let requests = 0;

    const matches = (meeting: ZoomRecordingMeeting): boolean => {
      if (kind === 'share') {
        return typeof meeting.share_url === 'string' && meeting.share_url.includes(`/rec/share/${id}`);
      }
      return (meeting.recording_files ?? []).some(
        (file) => typeof file.play_url === 'string' && file.play_url.includes(`/rec/play/${id}`),
      );
    };

    const today = new Date();
    for (let window = 0; window < ZOOM_MAX_WINDOWS; window += 1) {
      const to = new Date(today);
      to.setUTCDate(to.getUTCDate() - window * ZOOM_WINDOW_DAYS);
      const from = new Date(to);
      from.setUTCDate(from.getUTCDate() - ZOOM_WINDOW_DAYS);

      for (const userId of userIds) {
        if (requests >= maxRequests) {
          trace.push(`tope de ${maxRequests} consultas alcanzado`);
          return finish({ status: 'not_found' });
        }
        requests += 1;
        const range = `${formatZoomDate(from)}..${formatZoomDate(to)}`;
        const res = await fetch(
          `https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/recordings?from=${formatZoomDate(from)}&to=${formatZoomDate(to)}&page_size=300`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.status === 401 || res.status === 403) {
          // Sin permiso para leer grabaciones: no tiene sentido seguir.
          const detail = (await res.text()).slice(0, 200);
          trace.push(`${userId} ${range} → ${res.status} ${detail}`);
          return finish({ status: 'error', message: `Zoom no permitió leer grabaciones (${res.status}): ${detail}` });
        }
        if (!res.ok) {
          trace.push(`${userId} ${range} → ${res.status} ${(await res.text()).slice(0, 120)}`);
          continue;
        }
        const data = (await res.json()) as { meetings?: ZoomRecordingMeeting[] };
        const meetings = data.meetings ?? [];
        trace.push(`${userId} ${range} → ${meetings.length} grabaciones`);
        const meeting = meetings.find(matches);
        if (!meeting) continue;
        const passcode = meeting.recording_play_passcode?.trim();
        if (!passcode) {
          // Grabación sin código: el enlace ya abre directo.
          trace.push('encontrada sin recording_play_passcode');
          return finish({ status: 'already_one_click', url });
        }
        return finish({ status: 'resolved', url: appendPasscode(url, passcode), topic: meeting.topic ?? null });
      }
    }
    return finish({ status: 'not_found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    trace.push(`excepción: ${message}`);
    return finish({ status: 'error', message });
  }
}
