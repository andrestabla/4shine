'use client';

import React from 'react';
import { BarChart3, Users } from 'lucide-react';
import {
  getActivityForContentAdmin,
  getActivityStats,
  listActivityUsers,
  type ActivityAggregateStats,
  type ActivityUserResult,
} from '@/features/aprendizaje/activities/client';

export function ActivityResultsPanel({ contentId }: { contentId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [activityId, setActivityId] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<ActivityAggregateStats | null>(null);
  const [users, setUsers] = React.useState<ActivityUserResult[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const activity = await getActivityForContentAdmin(contentId);
        if (!activity) {
          setActivityId(null);
          return;
        }
        setActivityId(activity.activityId);
        const [s, u] = await Promise.all([
          getActivityStats(activity.activityId),
          listActivityUsers(activity.activityId),
        ]);
        setStats(s);
        setUsers(u);
      } finally {
        setLoading(false);
      }
    })();
  }, [contentId]);

  if (loading) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando resultados…</p>;
  }
  if (!activityId) {
    return (
      <p className="text-sm text-[var(--app-muted)]">
        Este contenido aún no tiene una actividad configurada.
      </p>
    );
  }
  if (!stats) {
    return <p className="text-sm text-[var(--app-muted)]">Sin datos.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Cards de stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Intentos totales" value={String(stats.totalAttempts)} />
        <StatCard label="Líderes únicos" value={String(stats.uniqueUsers)} />
        <StatCard
          label="Puntaje promedio"
          value={stats.avgScore != null ? `${Math.round(stats.avgScore)}%` : '—'}
        />
        <StatCard
          label="% aprobación"
          value={stats.passRate != null ? `${Math.round(stats.passRate * 100)}%` : '—'}
        />
      </div>

      {/* Estadísticas por pregunta */}
      <section className="app-panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Desempeño por pregunta</p>
        </div>
        {stats.questionStats.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">Sin preguntas.</p>
        ) : (
          <ul className="space-y-2">
            {stats.questionStats.map((q, i) => (
              <li
                key={q.questionId}
                className="rounded-[12px] border border-[var(--app-border)] bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-sm font-semibold text-[var(--app-ink)]">
                    {i + 1}. {q.prompt}
                  </p>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[var(--app-muted)]">
                      {q.totalAnswers} respuesta{q.totalAnswers === 1 ? '' : 's'}
                    </p>
                    <p
                      className={`text-sm font-black ${
                        q.correctRate != null && q.correctRate >= 0.7
                          ? 'text-emerald-600'
                          : q.correctRate != null && q.correctRate >= 0.4
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {q.correctRate != null ? `${Math.round(q.correctRate * 100)}%` : '—'} aciertos
                    </p>
                  </div>
                </div>
                {/* Barra */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className="h-full bg-[var(--brand-primary)]"
                    style={{ width: `${(q.correctRate ?? 0) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tabla de usuarios */}
      <section className="app-panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Resultados por líder</p>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">Aún no hay intentos completados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                <tr>
                  <th className="px-3 py-2">Líder</th>
                  <th className="px-3 py-2">Intentos</th>
                  <th className="px-3 py-2">Mejor</th>
                  <th className="px-3 py-2">Último</th>
                  <th className="px-3 py-2">Última fecha</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-t border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]/40"
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[var(--app-ink)]">{u.userName}</p>
                      <p className="text-xs text-[var(--app-muted)]">{u.userEmail}</p>
                    </td>
                    <td className="px-3 py-2 text-[var(--app-ink)]">{u.attempts}</td>
                    <td className="px-3 py-2 font-bold text-[var(--app-ink)]">
                      {u.bestScore != null ? `${u.bestScore}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--app-ink)]">
                      {u.lastScore != null ? `${u.lastScore}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--app-muted)]">
                      {u.lastSubmittedAt
                        ? new Date(u.lastSubmittedAt).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.passed ? 'Aprobó' : 'No aprobó'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-panel p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{value}</p>
    </div>
  );
}
