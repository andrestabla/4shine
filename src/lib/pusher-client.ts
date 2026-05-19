import PusherJS from 'pusher-js';

let _client: PusherJS | null = null;

export function getPusherClient(): PusherJS | null {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return null;
  if (!_client) {
    _client = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/v1/pusher/auth',
    });
  }
  return _client;
}
