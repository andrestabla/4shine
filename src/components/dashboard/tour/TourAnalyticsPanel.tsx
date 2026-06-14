"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics } from "@/features/tour/client";
import type { TourAnalytics } from "@/features/tour/types";
import { TOUR_ROLES, TOUR_ROLE_LABELS } from "@/features/tour/types";

const ROLE_COLORS: Record<string, string> = {
  lider: "#7c3aed",
  mentor: "#0ea5e9",
  gestor: "#f59e0b",
  admin: "#ef4444",
  invitado: "#10b981",
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="app-panel-soft p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{hint}</p>}
    </div>
  );
}

export function TourAnalyticsPanel() {
  const [data, setData] = React.useState<TourAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await getAnalytics();
      if (res.ok && res.data) setData(res.data);
      else setError(res.error ?? "No se pudo cargar la analítica.");
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="py-10 text-center text-sm text-[var(--app-muted)]">Cargando analítica…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error ?? "Sin datos."}
      </div>
    );
  }

  const { global, byRole, funnel } = data;
  const completedVsDismissed = [
    { name: "Completaron", value: global.completed, color: "#10b981" },
    { name: "Abandonaron", value: global.dismissed, color: "#ef4444" },
    { name: "En progreso", value: global.inProgress, color: "#f59e0b" },
  ];

  const funnelData = funnel.map((s, i) => {
    const row: Record<string, number | string> = { name: `${i + 1}. ${s.title || s.stepKey}` };
    for (const cell of s.perRole) row[cell.role] = cell.views;
    return row;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Iniciaron" value={String(global.started)} />
        <StatCard label="Completaron" value={String(global.completed)} hint={`${global.completionRate}% de finalización`} />
        <StatCard label="Abandonaron" value={String(global.dismissed)} />
        <StatCard label="Avance promedio" value={`${global.avgCompletionPct}%`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="app-panel p-5">
          <h4 className="mb-3 text-sm font-bold text-[var(--app-ink)]">Estado de los recorridos</h4>
          {global.started === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">Aún no hay recorridos registrados para esta versión.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={completedVsDismissed} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {completedVsDismissed.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="app-panel p-5">
          <h4 className="mb-3 text-sm font-bold text-[var(--app-ink)]">Por rol</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[var(--app-muted)]">
                  <th className="py-1.5 pr-2 font-bold">Rol</th>
                  <th className="py-1.5 px-2 font-bold">Iniciaron</th>
                  <th className="py-1.5 px-2 font-bold">Completaron</th>
                  <th className="py-1.5 px-2 font-bold">Abandonaron</th>
                  <th className="py-1.5 pl-2 font-bold">Avance</th>
                </tr>
              </thead>
              <tbody>
                {byRole.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-[var(--app-muted)]">Sin datos.</td>
                  </tr>
                ) : (
                  byRole.map((r) => (
                    <tr key={r.role} className="border-t border-[var(--app-border)]">
                      <td className="py-1.5 pr-2 font-semibold text-[var(--app-ink)]">{TOUR_ROLE_LABELS[r.role] ?? r.role}</td>
                      <td className="py-1.5 px-2">{r.started}</td>
                      <td className="py-1.5 px-2">{r.completed}</td>
                      <td className="py-1.5 px-2">{r.dismissed}</td>
                      <td className="py-1.5 pl-2">{r.avgCompletionPct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="app-panel p-5">
        <h4 className="mb-1 text-sm font-bold text-[var(--app-ink)]">Embudo por paso (vistas por rol)</h4>
        <p className="mb-3 text-[11px] text-[var(--app-muted)]">
          Cuántos usuarios vieron cada paso. La caída entre barras consecutivas indica el abandono.
        </p>
        {funnelData.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">No hay pasos activos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(260, funnelData.length * 42)}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {TOUR_ROLES.map((role) => (
                <Bar key={role} dataKey={role} name={TOUR_ROLE_LABELS[role]} stackId="views" fill={ROLE_COLORS[role]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
