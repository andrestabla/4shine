import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';
import { getPusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const text = await request.text();
  const params = new URLSearchParams(text);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
  }

  const pusher = getPusherServer();

  // private-user-{userId} — solo el propio usuario
  if (channelName.startsWith('private-user-')) {
    const userId = channelName.slice('private-user-'.length);
    if (userId !== identity.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
  }

  // private-thread-{threadId} — verificar participación
  if (channelName.startsWith('private-thread-')) {
    const threadId = channelName.slice('private-thread-'.length);
    try {
      const allowed = await withClient(async (client) => {
        const { rows } = await client.query<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT 1 FROM app_networking.thread_participants
            WHERE thread_id = $1 AND user_id = $2
          ) AS exists`,
          [threadId, identity.userId],
        );
        return rows[0]?.exists ?? false;
      });

      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
    } catch {
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Channel not allowed' }, { status: 403 });
}
