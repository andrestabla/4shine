'use client';

import React from 'react';
import {
  Activity,
  Clock,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  listUserSessions,
  listUserAuditLogs,
  type UserSessionRecord,
  type AuditLogRecord,
} from '@/features/usuarios/client';
import { formatDate, formatDateTime } from '@/lib/format-date';

function fmtRelative(iso: string | null): string {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `hace ${days}d`;
  return formatDate(iso);
}

function fmtAbsolute(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDateTime(iso);
}

/**
 * Mapeo action → frase corta en lenguaje natural.
 * Default: usa el action crudo formateado.
 */
function humanizeLog(log: AuditLogRecord): { label: string; detail?: string } {
  const action = log.action.toLowerCase();
  const module = log.moduleCode ?? '';

  // Sesiones / auth
  if (action === 'auth_login_success') return { label: 'Inició sesión' };
  if (action === 'auth_login_failed') return { label: 'Intento de login fallido' };
  if (action === 'auth_login_locked') return { label: 'Cuenta bloqueada (demasiados intentos)' };
  if (action === 'auth_logout') return { label: 'Cerró sesión' };
  if (action === 'auth_invitado_promoted_to_lider')
    return { label: 'Promovido de invitado a líder' };
  if (action === 'auth_login_invalid_json' || action === 'auth_login_missing_fields')
    return { label: 'Login mal formado' };

  // Notificaciones / mensajes
  if (action === 'broadcast_message_sent') return { label: 'Envió un mensaje masivo' };
  if (action === 'create_notification_template') return { label: 'Creó una plantilla de mensaje' };
  if (action === 'send_discovery_reminder_email')
    return { label: 'Envió recordatorio de diagnóstico' };
  if (action === 'send_discovery_report_email')
    return { label: 'Envió un informe de diagnóstico' };
  if (action === 'resend_discovery_invitation')
    return { label: 'Reenvió una invitación de diagnóstico' };

  // Pagos / suscripciones
  if (action === 'user_password_reset_email_sent')
    return { label: 'Envió correo de reseteo de contraseña' };

  // Genéricas por prefijo
  if (action.startsWith('create_')) return { label: `Creó ${prettyModule(module) || 'un recurso'}` };
  if (action.startsWith('update_')) return { label: `Actualizó ${prettyModule(module) || 'un recurso'}` };
  if (action.startsWith('delete_')) return { label: `Eliminó ${prettyModule(module) || 'un recurso'}` };
  if (action.startsWith('view_')) return { label: `Visitó ${prettyModule(module)}` };

  // Fallback
  const pretty = log.action.replace(/_/g, ' ');
  return {
    label: pretty.charAt(0).toUpperCase() + pretty.slice(1),
    detail: module || undefined,
  };
}

function prettyModule(code: string): string {
  if (!code) return '';
  const map: Record<string, string> = {
    usuarios: 'usuarios',
    descubrimiento: 'Descubrimiento',
    mentorias: 'Mentorías',
    aprendizaje: 'Aprendizaje',
    convocatorias: 'Convocatorias',
    networking: 'Networking',
    workshops: 'Workshops',
    mensajes: 'Mensajes',
    notificaciones: 'Notificaciones',
    planes: 'Planes',
    branding: 'Branding',
  };
  return map[code] ?? code;
}

export function SessionsTabSection() {
  const [sessions, setSessions] = React.useState<UserSessionRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [onlyOnline, setOnlyOnline] = React.useState(false);
  const [selected, setSelected] = React.useState<UserSessionRecord | null>(null);
  const [logs, setLogs] = React.useState<AuditLogRecord[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUserSessions({ onlyOnline });
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [onlyOnline]);

  React.useEffect(() => {
    void load();
    // Auto-refresh online status cada 30s
    const t = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(t);
  }, [load]);

  const openLogs = async (s: UserSessionRecord) => {
    setSelected(s);
    setLogsLoading(true);
    try {
      const data = await listUserAuditLogs(s.userId, 100);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const onlineCount = sessions.filter((s) => s.isOnline).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {onlineCount} conectado{onlineCount === 1 ? '' : 's'} ahora
          </span>
          <span className="text-xs text-[var(--app-muted)]">
            {sessions.length} usuario{sessions.length === 1 ? '' : 's'} con acceso registrado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={onlyOnline}
              onChange={(e) => setOnlyOnline(e.target.checked)}
            />
            Solo conectados ahora
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Actualizar
          </button>
        </div>
      </div>

      <section className="app-table-shell">
        <div className="overflow-x-auto">
          <table className="app-table min-w-[900px] text-sm">
            <thead>
              <tr className="text-left">
                <th>Estado</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Sesiones activas</th>
                <th>IP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.userId}>
                  <td>
                    {s.isOnline ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <Wifi size={12} />
                        En línea
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--app-muted)]">
                        <WifiOff size={12} />
                        Desconectado
                      </span>
                    )}
                  </td>
                  <td>
                    <p className="font-semibold text-[var(--app-ink)]">{s.displayName}</p>
                    <p className="text-xs text-[var(--app-muted)]">{s.email}</p>
                  </td>
                  <td className="text-xs text-[var(--app-ink)]">{s.primaryRole}</td>
                  <td>
                    <p className="text-xs font-semibold text-[var(--app-ink)]">
                      {fmtRelative(s.lastSessionAt)}
                    </p>
                    <p className="text-[11px] text-[var(--app-muted)]">
                      {fmtAbsolute(s.lastSessionAt)}
                    </p>
                  </td>
                  <td className="text-xs">{s.activeSessionsCount}</td>
                  <td className="font-mono text-[11px] text-[var(--app-muted)]">
                    {s.lastIpAddress ?? '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void openLogs(s)}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[var(--app-chip)]"
                    >
                      <Activity size={12} />
                      Logs
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-[var(--app-muted)]">
                    No hay usuarios con sesiones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de logs */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Logs de navegación
                </p>
                <h2 className="mt-1 text-xl font-bold text-[var(--app-ink)]">
                  {selected.displayName}
                </h2>
                <p className="text-xs text-[var(--app-muted)]">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-[var(--app-muted)] hover:bg-[var(--app-chip)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {logsLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-[var(--app-muted)]">
                  <Loader2 size={16} className="mr-2 animate-spin" /> Cargando logs…
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-sm text-[var(--app-muted)]">
                  Sin actividad reciente registrada.
                </p>
              ) : (
                <ul className="space-y-2">
                  {logs.map((log) => {
                    const h = humanizeLog(log);
                    return (
                      <li
                        key={log.auditId}
                        className="flex items-start gap-3 rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5"
                      >
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--app-ink)]">{h.label}</p>
                          {h.detail && (
                            <p className="text-xs text-[var(--app-muted)]">{h.detail}</p>
                          )}
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                            <Clock size={10} />
                            {fmtAbsolute(log.occurredAt)}
                            {' · '}
                            {fmtRelative(log.occurredAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
