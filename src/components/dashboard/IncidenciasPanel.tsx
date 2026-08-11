'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  analyzeIncident,
  listIncidents,
  type IncidentRecord,
  type IncidentsSummary,
} from '@/features/incidencias/client';

const SEVERITY_STYLE: Record<string, { chip: string; dot: string; label: string }> = {
  alta: { chip: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Alta' },
  media: { chip: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Media' },
  baja: { chip: 'border-slate-200 bg-slate-50 text-slate-600', dot: 'bg-slate-400', label: 'Baja' },
};

/** Markdown mínimo del análisis: negritas y viñetas. */
function AnalysisText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').filter((line) => line.trim()).map((line, index) => {
        const clean = line.replace(/^[-*]\s+/, '');
        const parts = clean.split(/(\*\*[^*]+\*\*)/g);
        const bullet = /^[-*]\s+/.test(line);
        return (
          <p key={index} className={`text-[12.6px] leading-relaxed ${bullet ? 'pl-3' : ''}`}>
            {bullet && <span className="mr-1.5 text-[var(--app-muted)]">•</span>}
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={i} className="text-[var(--app-ink)]">{part.slice(2, -2)}</strong>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

function IncidentCard({ incident }: { incident: IncidentRecord }) {
  const [open, setOpen] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [noAi, setNoAi] = React.useState(false);
  const style = SEVERITY_STYLE[incident.severity] ?? SEVERITY_STYLE.baja;

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeIncident({
        type: incident.type,
        title: incident.title,
        summary: incident.summary,
        evidence: incident.evidence,
        checklist: incident.checklist,
      });
      if (res.analysis) setAnalysis(res.analysis);
      else setNoAi(true);
    } catch {
      setNoAi(true);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <article className="rounded-[1rem] border border-[var(--app-border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--app-ink)]">{incident.title}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${style.chip}`}>
              {style.label}
            </span>
          </span>
          <span className="mt-1 block text-[12.6px] leading-relaxed text-[var(--app-muted)]">
            {incident.summary}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`mt-1 shrink-0 text-[var(--app-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-3.5 border-t border-[var(--app-border)] p-3.5">
          <div>
            <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Evidencia
            </p>
            <ul className="space-y-1">
              {incident.evidence.map((item, index) => (
                <li key={index} className="text-[12.6px] text-[var(--app-ink)]">· {item}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Antes de decidir
            </p>
            <ul className="space-y-1">
              {incident.checklist.map((item, index) => (
                <li key={index} className="text-[12.6px] text-[var(--app-ink)]">
                  <span className="mr-1.5 font-bold text-[var(--brand-accent)]">{index + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {analysis && (
            <div className="rounded-[0.9rem] border border-[var(--brand-accent)]/35 bg-[var(--brand-accent)]/[0.06] p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                <Sparkles size={12} /> Lectura del asistente
              </p>
              <AnalysisText text={analysis} />
            </div>
          )}
          {noAi && (
            <p className="text-[11.6px] text-[var(--app-muted)]">
              El asistente IA no está disponible ahora. La guía de arriba te sirve igual para resolver el caso.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {incident.actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={
                  action.primary
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
                }
              >
                {action.label}
                <ExternalLink size={12} />
              </Link>
            ))}
            {!analysis && (
              <button
                type="button"
                onClick={() => void runAnalysis()}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-accent)]/50 px-3.5 py-1.5 text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/10 disabled:opacity-60"
              >
                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {analyzing ? 'Analizando…' : 'Analizar el caso'}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * Casos por solucionar. En el dashboard muestra todo lo detectado; dentro de la
 * ficha de un líder (userId) solo lo que le concierne.
 */
export function IncidenciasPanel({ userId, limit }: { userId?: string; limit?: number }) {
  const { currentRole } = useUser();
  const [data, setData] = React.useState<IncidentsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  const canSee = currentRole === 'admin' || currentRole === 'gestor';

  const load = React.useCallback(async () => {
    if (!canSee) return;
    setLoading(true);
    try {
      setData(await listIncidents(userId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [canSee, userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!canSee) return null;
  // Dentro de la ficha de un líder sin casos, el panel no estorba.
  if (userId && !loading && (data?.incidents.length ?? 0) === 0) return null;

  const incidents = data?.incidents ?? [];
  const visible = showAll ? incidents : incidents.slice(0, limit ?? 5);

  return (
    <section className="app-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
            <AlertTriangle size={18} />
            Casos por solucionar
          </h2>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
            {userId
              ? 'Novedades detectadas en la cuenta de este líder.'
              : 'Incidencias y novedades detectadas en cuentas, planes y avance. Cada caso trae su evidencia y las acciones que lo resuelven.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && incidents.length > 0 && (
            <div className="flex items-center gap-1.5">
              {(['alta', 'media', 'baja'] as const).map((sev) =>
                data.countsBySeverity[sev] > 0 ? (
                  <span
                    key={sev}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${SEVERITY_STYLE[sev].chip}`}
                  >
                    {data.countsBySeverity[sev]} {SEVERITY_STYLE[sev].label}
                  </span>
                ) : null,
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            title="Volver a analizar"
            className="rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="flex items-center gap-2 py-3 text-sm text-[var(--app-muted)]">
          <Loader2 size={14} className="animate-spin" /> Analizando la plataforma…
        </p>
      ) : incidents.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldCheck size={18} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Sin casos pendientes. No se detectaron cuentas duplicadas, planes vencidos ni avances inconsistentes.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((incident) => (
            <IncidentCard key={incident.incidentId} incident={incident} />
          ))}
          {incidents.length > visible.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-[0.9rem] border border-dashed border-[var(--app-border)] py-2 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            >
              Ver los {incidents.length - visible.length} casos restantes
            </button>
          )}
        </div>
      )}
    </section>
  );
}
