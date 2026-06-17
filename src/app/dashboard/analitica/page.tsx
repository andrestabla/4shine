"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { getAnalytics, type AnalyticsResult, type NameCount, type SeriesPoint } from "@/features/analitica/client";

const PALETTE = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#a855f7"];

type TabKey =
  | "resumen"
  | "usuarios"
  | "mentorias"
  | "descubrimiento"
  | "aprendizaje"
  | "networking"
  | "convocatorias"
  | "workshops";

const TABS: { key: TabKey; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "usuarios", label: "Usuarios" },
  { key: "mentorias", label: "Mentorías" },
  { key: "descubrimiento", label: "Descubrimiento" },
  { key: "aprendizaje", label: "Aprendizaje" },
  { key: "networking", label: "Networking" },
  { key: "convocatorias", label: "Convocatorias" },
  { key: "workshops", label: "Workshops" },
];

function isoToInput(iso: string) {
  return iso.slice(0, 10);
}
function inputToIso(d: string, endOfDay = false) {
  return new Date(`${d}T${endOfDay ? "23:59:59" : "00:00:00"}`).toISOString();
}
function shortDate(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--app-border)] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--app-muted)]">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[var(--app-border)] bg-white p-5">
      <p className="app-section-kicker mb-3">{title}</p>
      {children}
    </div>
  );
}

const NoData = () => <p className="py-10 text-center text-sm text-[var(--app-muted)]">Sin datos en este periodo.</p>;

function Donut({ data }: { data: NameCount[] }) {
  if (data.length === 0) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Bars({ data }: { data: NameCount[] }) {
  if (data.length === 0) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--app-border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Trend({ data, color = PALETTE[0] }: { data: SeriesPoint[]; color?: string }) {
  if (data.length === 0) return <NoData />;
  const gid = `g${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -10, right: 12 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--app-border)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(d) => `Fecha: ${d}`} />
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gid})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PillarRadar({ data }: { data: NameCount[] }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm text-[var(--app-muted)]">Sin diagnósticos completados.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar dataKey="value" stroke={PALETTE[0]} fill={PALETTE[0]} fillOpacity={0.4} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 lg:grid-cols-2">{children}</div>
);
const Kpis = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
);

export default function AnaliticaPage() {
  const today = new Date();
  const ninetyAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  const [fromInput, setFromInput] = React.useState(isoToInput(ninetyAgo.toISOString()));
  const [toInput, setToInput] = React.useState(isoToInput(today.toISOString()));
  const [tab, setTab] = React.useState<TabKey>("resumen");
  const [data, setData] = React.useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalytics(inputToIso(fromInput), inputToIso(toInput, true));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la analítica.");
    } finally {
      setLoading(false);
    }
  }, [fromInput, toInput]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const preset = (days: number) => {
    const now = new Date();
    setFromInput(isoToInput(new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()));
    setToInput(isoToInput(now.toISOString()));
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Analítica"
        subtitle="Indicadores e insights de cada módulo de la plataforma, con filtros por periodo."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-[18px] border border-[var(--app-border)] bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Desde</label>
          <input type="date" className="app-input" value={fromInput} max={toInput} onChange={(e) => setFromInput(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">Hasta</label>
          <input type="date" className="app-input" value={toInput} min={fromInput} onChange={(e) => setToInput(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {[
            { d: 30, l: "30d" },
            { d: 90, l: "90d" },
            { d: 365, l: "1 año" },
          ].map((p) => (
            <button
              key={p.d}
              type="button"
              onClick={() => preset(p.d)}
              className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs font-bold text-[var(--app-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              {p.l}
            </button>
          ))}
        </div>
        {loading && <Loader2 size={16} className="ml-auto animate-spin text-[var(--app-muted)]" />}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] transition-colors " +
              (tab === t.key
                ? "bg-[var(--brand-primary)] text-white"
                : "border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      ) : !data ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : (
        <>
          {tab === "resumen" && <Resumen d={data} />}
          {tab === "usuarios" && <Usuarios d={data} />}
          {tab === "mentorias" && <Mentorias d={data} />}
          {tab === "descubrimiento" && <Descubrimiento d={data} />}
          {tab === "aprendizaje" && <Aprendizaje d={data} />}
          {tab === "networking" && <Networking d={data} />}
          {tab === "convocatorias" && <Convocatorias d={data} />}
          {tab === "workshops" && <Workshops d={data} />}
        </>
      )}
    </div>
  );
}

function Resumen({ d }: { d: AnalyticsResult }) {
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Usuarios activos" value={d.usuarios.active} hint={`${d.usuarios.total} totales`} />
        <Kpi label="Nuevos (periodo)" value={d.usuarios.newInRange} />
        <Kpi label="Sesiones mentoría" value={d.mentorias.totalSessions} hint={`${d.mentorias.completedSessions} completadas`} />
        <Kpi label="Diagnósticos" value={d.descubrimiento.total} hint={`${d.descubrimiento.completionRate}% completados`} />
        <Kpi label="Conexiones" value={d.networking.totalConnections} />
        <Kpi label="Convocatorias" value={d.convocatorias.total} hint={`${d.convocatorias.totalApplications} aplicaciones`} />
        <Kpi label="Workshops" value={d.workshops.total} />
        <Kpi label="Avance workbooks" value={`${d.aprendizaje.workbookAvgCompletion}%`} />
      </Kpis>
      <Grid>
        <Panel title="Nuevos usuarios en el tiempo">
          <Trend data={d.usuarios.signupsSeries} />
        </Panel>
        <Panel title="Usuarios por rol">
          <Donut data={d.usuarios.byRole} />
        </Panel>
        <Panel title="Sesiones de mentoría en el tiempo">
          <Trend data={d.mentorias.sessionsSeries} color={PALETTE[1]} />
        </Panel>
        <Panel title="Líderes por plan">
          <Bars data={d.usuarios.byPlan} />
        </Panel>
      </Grid>
    </div>
  );
}

function Usuarios({ d }: { d: AnalyticsResult }) {
  const u = d.usuarios;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Total" value={u.total} />
        <Kpi label="Activos" value={u.active} />
        <Kpi label="Nuevos (periodo)" value={u.newInRange} />
      </Kpis>
      <Grid>
        <Panel title="Nuevos usuarios en el tiempo">
          <Trend data={u.signupsSeries} />
        </Panel>
        <Panel title="Por rol">
          <Donut data={u.byRole} />
        </Panel>
        <Panel title="Líderes por plan">
          <Bars data={u.byPlan} />
        </Panel>
        <Panel title="Vigencia de suscripción (líderes)">
          <Donut data={u.vigencia} />
        </Panel>
        <Panel title="Por país (top 12)">
          <Bars data={u.byCountry} />
        </Panel>
      </Grid>
    </div>
  );
}

function Mentorias({ d }: { d: AnalyticsResult }) {
  const m = d.mentorias;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Sesiones totales" value={m.totalSessions} />
        <Kpi label="Completadas" value={m.completedSessions} />
        <Kpi label="Asistencia" value={`${m.attendanceRate}%`} hint="mentees que asistieron" />
      </Kpis>
      <Grid>
        <Panel title="Sesiones en el tiempo">
          <Trend data={m.sessionsSeries} color={PALETTE[1]} />
        </Panel>
        <Panel title="Por estado">
          <Donut data={m.byStatus} />
        </Panel>
        <Panel title="Individual vs Grupal">
          <Donut data={m.individualVsGroup} />
        </Panel>
        <Panel title="Participación en sesiones grupales">
          <Bars data={m.groupParticipation} />
        </Panel>
      </Grid>
    </div>
  );
}

function Descubrimiento({ d }: { d: AnalyticsResult }) {
  const x = d.descubrimiento;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Diagnósticos" value={x.total} />
        <Kpi label="Completados" value={x.completed} />
        <Kpi label="Tasa de completitud" value={`${x.completionRate}%`} />
      </Kpis>
      <Grid>
        <Panel title="Promedio por pilar (0–100)">
          <PillarRadar data={x.avgPillars} />
        </Panel>
        <Panel title="Por estado">
          <Donut data={x.byStatus} />
        </Panel>
        <Panel title="Diagnósticos completados en el tiempo">
          <Trend data={x.completionsSeries} color={PALETTE[2]} />
        </Panel>
      </Grid>
    </div>
  );
}

function Aprendizaje({ d }: { d: AnalyticsResult }) {
  const a = d.aprendizaje;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Avance promedio workbooks" value={`${a.workbookAvgCompletion}%`} />
        <Kpi label="Workbooks completados" value={a.workbooksCompleted} />
      </Kpis>
      <Grid>
        <Panel title="Completados de contenido en el tiempo">
          <Trend data={a.completionsSeries} color={PALETTE[3]} />
        </Panel>
        <Panel title="Contenido por tipo">
          <Donut data={a.contentByType} />
        </Panel>
        <Panel title="Contenido por estado">
          <Bars data={a.contentByStatus} />
        </Panel>
      </Grid>
    </div>
  );
}

function Networking({ d }: { d: AnalyticsResult }) {
  const n = d.networking;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Conexiones totales" value={n.totalConnections} />
      </Kpis>
      <Grid>
        <Panel title="Conexiones en el tiempo">
          <Trend data={n.connectionsSeries} color={PALETTE[5]} />
        </Panel>
        <Panel title="Por estado">
          <Donut data={n.byStatus} />
        </Panel>
      </Grid>
    </div>
  );
}

function Convocatorias({ d }: { d: AnalyticsResult }) {
  const c = d.convocatorias;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Convocatorias" value={c.total} />
        <Kpi label="Aplicaciones" value={c.totalApplications} />
      </Kpis>
      <Grid>
        <Panel title="Aplicaciones en el tiempo">
          <Trend data={c.applicationsSeries} color={PALETTE[6]} />
        </Panel>
        <Panel title="Por estado">
          <Donut data={c.byStatus} />
        </Panel>
        <Panel title="Top por aplicaciones">
          <Bars data={c.topByApplications} />
        </Panel>
      </Grid>
    </div>
  );
}

function Workshops({ d }: { d: AnalyticsResult }) {
  const w = d.workshops;
  return (
    <div className="space-y-4">
      <Kpis>
        <Kpi label="Workshops" value={w.total} />
      </Kpis>
      <Grid>
        <Panel title="Inscripciones en el tiempo">
          <Trend data={w.registrationsSeries} color={PALETTE[7]} />
        </Panel>
        <Panel title="Por estado">
          <Donut data={w.byStatus} />
        </Panel>
        <Panel title="Por estado de asistencia">
          <Bars data={w.byAttendance} />
        </Panel>
      </Grid>
    </div>
  );
}
