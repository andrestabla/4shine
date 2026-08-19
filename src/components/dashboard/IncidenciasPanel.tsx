'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  analyzeIncident,
  closeIncident,
  listClosedIncidents,
  listIncidents,
  reopenIncident,
  type DismissedIncident,
  type IncidentRecord,
  type IncidentResolution,
  type IncidentsSummary,
} from '@/features/incidencias/client';

const SEVERITY_STYLE: Record<string, { chip: string; dot: string; label: string }> = {
  alta: { chip: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Alta' },
  media: { chip: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Media' },
  baja: { chip: 'border-slate-200 bg-slate-50 text-slate-600', dot: 'bg-slate-400', label: 'Baja' },
};

const RESOLUTION_LABEL: Record<IncidentResolution, string> = {
  resuelto: 'Resuelto',
  descartado: 'Descartado',
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

/**
 * Cierre de un caso. Se pregunta CÓMO se cierra porque no es lo mismo haberlo
 * arreglado que haber concluido que no era un caso: la nota queda para quien
 * revise después por qué este caso ya no aparece.
 */
function CloseCaseForm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (resolution: IncidentResolution, note: string) => void;
}) {
  const [resolution, setResolution] = React.useState<IncidentResolution>('resuelto');
  const [note, setNote] = React.useState('');

  return (
    <div className="space-y-2.5 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
      <p className="text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        Cerrar el caso
      </p>
      <div className="flex flex-wrap gap-2">
        {(['resuelto', 'descartado'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setResolution(option)}
            className={
              resolution === option
                ? 'rounded-full border border-[var(--app-ink)] bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white'
                : 'rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
            }
          >
            {option === 'resuelto' ? 'Ya lo resolví' : 'No es un caso'}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        placeholder="Nota para el equipo (opcional): qué hiciste o por qué se descarta"
        className="w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[12.6px] text-[var(--app-ink)] outline-none focus:border-[var(--brand-accent)]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onConfirm(resolution, note)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          <Check size={12} /> Cerrar y no mostrar más
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)]"
        >
          Cancelar
        </button>
      </div>
      <p className="text-[11.4px] text-[var(--app-muted)]">
        Podrás reabrirlo desde “casos cerrados” si te equivocas.
      </p>
    </div>
  );
}

function IncidentCard({
  incident,
  onClose,
}: {
  incident: IncidentRecord;
  onClose: (incident: IncidentRecord, resolution: IncidentResolution, note: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
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

  const confirmClose = async (resolution: IncidentResolution, note: string) => {
    setSaving(true);
    try {
      await onClose(incident, resolution, note);
    } finally {
      setSaving(false);
      setClosing(false);
    }
  };

  return (
    <article className="rounded-[1rem] border border-[var(--app-border)] bg-white">
      <div className="flex items-start">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-3 p-3.5 text-left"
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
        <button
          type="button"
          onClick={() => setClosing((v) => !v)}
          disabled={saving}
          title="Cerrar el caso y no volver a mostrarlo"
          aria-label="Cerrar el caso"
          className="m-2.5 ml-0 shrink-0 rounded-full border border-[var(--app-border)] p-1.5 text-[var(--app-muted)] hover:border-[var(--app-ink)] hover:text-[var(--app-ink)] disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
        </button>
      </div>

      {closing && <CloseCaseForm onCancel={() => setClosing(false)} onConfirm={confirmClose} />}

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
            <button
              type="button"
              onClick={() => setClosing(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-60"
            >
              <Check size={12} /> Cerrar el caso
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/** Quita el caso del resumen ya cargado, sin esperar a que el panel recargue. */
function removeIncident(summary: IncidentsSummary, incidentId: string): IncidentsSummary {
  const target = summary.incidents.find((item) => item.incidentId === incidentId);
  if (!target) return summary;
  return {
    ...summary,
    incidents: summary.incidents.filter((item) => item.incidentId !== incidentId),
    countsBySeverity: {
      ...summary.countsBySeverity,
      [target.severity]: Math.max(0, summary.countsBySeverity[target.severity] - 1),
    },
    dismissedCount: summary.dismissedCount + 1,
  };
}

/**
 * Casos por solucionar. En el dashboard muestra todo lo detectado; dentro de la
 * ficha de un líder (userId) solo lo que le concierne.
 *
 * Los casos se detectan en cada carga, así que "cerrar" un caso no borra nada:
 * guarda la decisión (resuelto o descartado) para que el detector deje de
 * mostrarlo. Siempre se puede reabrir desde la lista de casos cerrados.
 */
export function IncidenciasPanel({
  userId,
  limit,
  defaultCollapsed = false,
}: {
  userId?: string;
  limit?: number;
  /** El panel arranca plegado: solo el encabezado con el conteo por severidad. */
  defaultCollapsed?: boolean;
}) {
  const { currentRole } = useUser();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [data, setData] = React.useState<IncidentsSummary | null>(null);
  const [closedCases, setClosedCases] = React.useState<DismissedIncident[]>([]);
  const [showClosed, setShowClosed] = React.useState(false);
  const [reopening, setReopening] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSee = currentRole === 'admin' || currentRole === 'gestor';

  const load = React.useCallback(async () => {
    if (!canSee) return;
    setLoading(true);
    try {
      const [summary, closed] = await Promise.all([
        listIncidents(userId),
        listClosedIncidents(userId).catch(() => [] as DismissedIncident[]),
      ]);
      setData(summary);
      setClosedCases(closed);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [canSee, userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleClose = React.useCallback(
    async (incident: IncidentRecord, resolution: IncidentResolution, note: string) => {
      setError(null);
      try {
        const record = await closeIncident({
          incidentId: incident.incidentId,
          type: incident.type,
          title: incident.title,
          resolution,
          note: note.trim() || null,
          userIds: incident.userIds,
        });
        setData((prev) => (prev ? removeIncident(prev, incident.incidentId) : prev));
        setClosedCases((prev) => [
          record,
          ...prev.filter((item) => item.incidentId !== record.incidentId),
        ]);
      } catch {
        setError('No se pudo cerrar el caso. Intenta de nuevo.');
      }
    },
    [],
  );

  const handleReopen = React.useCallback(
    async (incidentId: string) => {
      setError(null);
      setReopening(incidentId);
      try {
        await reopenIncident(incidentId);
        setClosedCases((prev) => prev.filter((item) => item.incidentId !== incidentId));
        // El caso vuelve solo si el detector lo sigue encontrando: hay que releer.
        await load();
      } catch {
        setError('No se pudo reabrir el caso. Intenta de nuevo.');
      } finally {
        setReopening(null);
      }
    },
    [load],
  );

  if (!canSee) return null;
  // Dentro de la ficha de un líder sin casos, el panel no estorba.
  if (userId && !loading && (data?.incidents.length ?? 0) === 0 && closedCases.length === 0) return null;

  const incidents = data?.incidents ?? [];
  const visible = showAll ? incidents : incidents.slice(0, limit ?? 5);

  return (
    <section className="app-panel p-5">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${collapsed ? '' : 'mb-4'}`}>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="min-w-0 flex-1 text-left"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
            <AlertTriangle size={18} />
            Casos por solucionar
            <ChevronDown
              size={16}
              className={`text-[var(--app-muted)] transition-transform ${collapsed ? '' : 'rotate-180'}`}
            />
          </h2>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
            {collapsed
              ? loading && !data
                ? 'Analizando la plataforma…'
                : incidents.length === 0
                  ? 'Sin casos pendientes.'
                  : `${incidents.length} ${incidents.length === 1 ? 'caso pendiente' : 'casos pendientes'}. Ábrelo para revisarlos.`
              : userId
                ? 'Novedades detectadas en la cuenta de este líder.'
                : 'Incidencias y novedades detectadas en cuentas, planes y avance. Cada caso trae su evidencia y las acciones que lo resuelven.'}
          </p>
        </button>
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

      {!collapsed && (
        <>
        {error && (
          <p className="mb-3 rounded-[0.9rem] border border-red-200 bg-red-50 px-3.5 py-2 text-[12.6px] font-semibold text-red-700">
            {error}
          </p>
        )}

        {loading && !data ? (
          <p className="flex items-center gap-2 py-3 text-sm text-[var(--app-muted)]">
            <Loader2 size={14} className="animate-spin" /> Analizando la plataforma…
          </p>
        ) : incidents.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
            <ShieldCheck size={18} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">
              {(data?.dismissedCount ?? 0) > 0
                ? `Sin casos pendientes. Los ${data?.dismissedCount} detectados hoy ya están cerrados.`
                : 'Sin casos pendientes. No se detectaron cuentas duplicadas, planes vencidos ni avances inconsistentes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((incident) => (
              <IncidentCard key={incident.incidentId} incident={incident} onClose={handleClose} />
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

        {closedCases.length > 0 && (
          <div className="mt-4 border-t border-[var(--app-border)] pt-3">
            <button
              type="button"
              onClick={() => setShowClosed((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            >
              <ChevronDown size={13} className={`transition-transform ${showClosed ? 'rotate-180' : ''}`} />
              {closedCases.length} {closedCases.length === 1 ? 'caso cerrado' : 'casos cerrados'}
            </button>

            {showClosed && (
              <ul className="mt-2.5 space-y-1.5">
                {closedCases.map((item) => (
                  <li
                    key={item.incidentId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.6px] font-semibold text-[var(--app-ink)]">
                        {item.title}
                        <span className="ml-2 rounded-full border border-[var(--app-border)] bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--app-muted)]">
                          {RESOLUTION_LABEL[item.resolution]}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11.4px] text-[var(--app-muted)]">
                        {new Date(item.closedAt).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {item.closedByName ? ` · ${item.closedByName}` : ''}
                        {item.note ? ` · ${item.note}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleReopen(item.incidentId)}
                      disabled={reopening === item.incidentId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)] disabled:opacity-60"
                    >
                      {reopening === item.incidentId ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Undo2 size={12} />
                      )}
                      Reabrir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        </>
      )}
    </section>
  );
}
