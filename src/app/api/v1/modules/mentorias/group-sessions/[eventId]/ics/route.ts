import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  const event = await withClient(async (client) => {
    const { rows } = await client.query<{
      title: string;
      starts_at: string;
      ends_at: string;
      description: string | null;
      zoom_join_url: string | null;
    }>(
      `SELECT gse.title, ms.starts_at, ms.ends_at, gse.description, gse.zoom_join_url
       FROM app_mentoring.group_session_events gse
       JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
       WHERE gse.event_id = $1::uuid`,
      [eventId],
    );
    return rows[0] ?? null;
  });

  if (!event) return new NextResponse('Not found', { status: 404 });

  const now = toIcsDate(new Date().toISOString());
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//4Shine Platform//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}@4shine.co`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(event.starts_at)}`,
    `DTEND:${toIcsDate(event.ends_at)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : null,
    event.zoom_join_url ? `LOCATION:${escapeIcs(event.zoom_join_url)}` : null,
    event.zoom_join_url ? `URL:${escapeIcs(event.zoom_join_url)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="sesion-grupal.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
