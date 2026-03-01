import type { ModuleCode } from '@/lib/permissions';

interface TrackAuditEventInput {
  action: string;
  moduleCode?: ModuleCode;
  entityTable?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export function trackAuditEvent(input: TrackAuditEventInput): void {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    action: input.action,
    moduleCode: input.moduleCode,
    entityTable: input.entityTable ?? 'ui.events',
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  void fetch('/api/v1/audit/event', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  });
}
