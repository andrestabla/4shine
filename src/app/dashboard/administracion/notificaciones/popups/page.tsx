"use client";

import React from "react";
import { Edit3, Eye, EyeOff, MousePointerClick, Plus, Save, Trash2, X } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { PopupCard } from "@/components/popups/PopupRuntime";
import {
  createPopup,
  deletePopup,
  listPopups,
  updatePopup,
  type PopupRecord,
} from "@/features/popups/client";
import {
  POPUP_FREQUENCY_LABELS,
  POPUP_ROLE_LABELS,
  POPUP_ROLES,
  POPUP_TRIGGER_LABELS,
  type PopupFrequency,
  type PopupRole,
  type PopupTargetMode,
  type PopupTrigger,
} from "@/features/popups/types";
import { listPlans as listSubscriptionPlans } from "@/features/planes/client";
import type { SubscriptionPlanWithFeatures } from "@/features/planes/client";

interface EditorState {
  popupId: string | null;
  name: string;
  isActive: boolean;
  triggerType: PopupTrigger;
  delaySeconds: number;
  scrollPercent: number;
  targetMode: PopupTargetMode;
  targetPathsText: string;
  targetRoles: PopupRole[];
  targetPlans: string[];
  frequency: PopupFrequency;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  dismissLabel: string;
}

function emptyEditor(): EditorState {
  return {
    popupId: null,
    name: "",
    isActive: false,
    triggerType: "time",
    delaySeconds: 8,
    scrollPercent: 40,
    targetMode: "all",
    targetPathsText: "",
    targetRoles: [],
    targetPlans: [],
    frequency: "session",
    title: "",
    message: "",
    ctaLabel: "",
    ctaUrl: "",
    dismissLabel: "No, gracias",
  };
}

function fromRecord(p: PopupRecord): EditorState {
  return {
    popupId: p.popupId,
    name: p.name,
    isActive: p.isActive,
    triggerType: p.triggerType,
    delaySeconds: p.delaySeconds,
    scrollPercent: p.scrollPercent,
    targetMode: p.targetMode,
    targetPathsText: p.targetPaths.join("\n"),
    targetRoles: p.targetRoles,
    targetPlans: p.targetPlans,
    frequency: p.frequency,
    title: p.title,
    message: p.message,
    ctaLabel: p.ctaLabel,
    ctaUrl: p.ctaUrl,
    dismissLabel: p.dismissLabel,
  };
}

const TRIGGERS: PopupTrigger[] = ["time", "scroll", "exit_intent", "immediate"];
const FREQUENCIES: PopupFrequency[] = ["session", "daily", "once", "always"];

export default function PopupsAdminPage() {
  const { alert, confirm } = useAppDialog();
  const [popups, setPopups] = React.useState<PopupRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [plans, setPlans] = React.useState<SubscriptionPlanWithFeatures[]>([]);

  React.useEffect(() => {
    (async () => {
      const res = await listSubscriptionPlans(false);
      if (res.ok && res.data) setPlans(res.data);
    })();
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await listPopups();
    if (res.ok && res.data) setPopups(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (p: PopupRecord) => {
    const res = await updatePopup(p.popupId, { isActive: !p.isActive });
    if (res.ok && res.data) setPopups((prev) => prev.map((x) => (x.popupId === p.popupId ? res.data! : x)));
    else await alert({ title: "Error", message: res.error ?? "No se pudo actualizar.", tone: "error" });
  };

  const removePopup = async (p: PopupRecord) => {
    const ok = await confirm({
      title: "Eliminar popup",
      message: `¿Eliminar el popup "${p.name || p.title || "sin nombre"}"?`,
      tone: "warning",
      confirmText: "Eliminar",
    });
    if (!ok) return;
    const res = await deletePopup(p.popupId);
    if (res.ok) setPopups((prev) => prev.filter((x) => x.popupId !== p.popupId));
    else await alert({ title: "Error", message: res.error ?? "No se pudo eliminar.", tone: "error" });
  };

  const save = async () => {
    if (!editor) return;
    const targetPaths = editor.targetPathsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: editor.name,
      isActive: editor.isActive,
      triggerType: editor.triggerType,
      delaySeconds: Number(editor.delaySeconds) || 0,
      scrollPercent: Number(editor.scrollPercent) || 0,
      targetMode: editor.targetMode,
      targetPaths,
      targetRoles: editor.targetRoles,
      targetPlans: editor.targetPlans,
      frequency: editor.frequency,
      title: editor.title,
      message: editor.message,
      ctaLabel: editor.ctaLabel,
      ctaUrl: editor.ctaUrl,
      dismissLabel: editor.dismissLabel,
    };
    setSaving(true);
    const res = editor.popupId
      ? await updatePopup(editor.popupId, payload)
      : await createPopup(payload);
    setSaving(false);
    if (!res.ok) {
      await alert({ title: "Error al guardar", message: res.error ?? "Inténtalo de nuevo.", tone: "error" });
      return;
    }
    setEditor(null);
    await load();
  };

  const field = (label: string, node: React.ReactNode) => (
    <label className="block">
      <span className="app-field-label">{label}</span>
      {node}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Popup Builder"
          subtitle="Crea y edita mensajes emergentes para el sitio público y el dashboard."
        />
        {!editor && (
          <button type="button" onClick={() => setEditor(emptyEditor())} className="app-button-primary inline-flex items-center gap-1.5">
            <Plus size={15} />
            Nuevo popup
          </button>
        )}
      </div>

      {editor ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          {/* Formulario */}
          <div className="app-panel space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--app-ink)]">
                {editor.popupId ? "Editar popup" : "Nuevo popup"}
              </h3>
              <button type="button" onClick={() => setEditor(null)} className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]">
                <X size={18} />
              </button>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--app-border)] p-3">
              <div>
                <span className="text-sm font-bold text-[var(--app-ink)]">Popup activo</span>
                <p className="text-xs text-[var(--app-muted)]">Si está desactivado, no se muestra a los visitantes.</p>
              </div>
              <input type="checkbox" checked={editor.isActive} onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })} />
            </label>

            {field("Nombre interno", <input className="app-input" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="Ej: Captación diagnóstico" />)}

            <div className="grid grid-cols-2 gap-3">
              {field(
                "Trigger",
                <select className="app-select" value={editor.triggerType} onChange={(e) => setEditor({ ...editor, triggerType: e.target.value as PopupTrigger })}>
                  {TRIGGERS.map((t) => (
                    <option key={t} value={t}>{POPUP_TRIGGER_LABELS[t]}</option>
                  ))}
                </select>,
              )}
              {field(
                "Frecuencia",
                <select className="app-select" value={editor.frequency} onChange={(e) => setEditor({ ...editor, frequency: e.target.value as PopupFrequency })}>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{POPUP_FREQUENCY_LABELS[f]}</option>
                  ))}
                </select>,
              )}
              {field("Delay (segundos)", <input type="number" min={0} className="app-input" value={editor.delaySeconds} onChange={(e) => setEditor({ ...editor, delaySeconds: Number(e.target.value) })} disabled={editor.triggerType !== "time"} />)}
              {field("Scroll %", <input type="number" min={0} max={100} className="app-input" value={editor.scrollPercent} onChange={(e) => setEditor({ ...editor, scrollPercent: Number(e.target.value) })} disabled={editor.triggerType !== "scroll"} />)}
            </div>

            {field(
              "Páginas objetivo",
              <select className="app-select" value={editor.targetMode} onChange={(e) => setEditor({ ...editor, targetMode: e.target.value as PopupTargetMode })}>
                <option value="all">Todo el sitio</option>
                <option value="include">Páginas específicas</option>
              </select>,
            )}
            {editor.targetMode === "include" &&
              field(
                "Rutas (una por línea, por prefijo)",
                <textarea className="app-textarea min-h-20" value={editor.targetPathsText} onChange={(e) => setEditor({ ...editor, targetPathsText: e.target.value })} placeholder={"/\n/metodologia\n/dashboard/descubrimiento"} />,
              )}

            <div>
              <span className="app-field-label">Segmentar por rol</span>
              <p className="mb-1 text-[11px] text-[var(--app-muted)]">Sin selección = todos. Los visitantes anónimos solo ven popups sin segmentación.</p>
              <div className="flex flex-wrap gap-2">
                {POPUP_ROLES.map((role) => {
                  const checked = editor.targetRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          targetRoles: checked
                            ? editor.targetRoles.filter((r) => r !== role)
                            : [...editor.targetRoles, role],
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        checked
                          ? "bg-[var(--brand-primary)] text-white"
                          : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                      }`}
                    >
                      {POPUP_ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="app-field-label">Segmentar por plan</span>
              <p className="mb-1 text-[11px] text-[var(--app-muted)]">Sin selección = cualquier plan.</p>
              {plans.length === 0 ? (
                <p className="text-xs text-[var(--app-muted)]">No hay planes disponibles.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => {
                    const checked = editor.targetPlans.includes(plan.planId);
                    return (
                      <button
                        key={plan.planId}
                        type="button"
                        onClick={() =>
                          setEditor({
                            ...editor,
                            targetPlans: checked
                              ? editor.targetPlans.filter((id) => id !== plan.planId)
                              : [...editor.targetPlans, plan.planId],
                          })
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          checked
                            ? "bg-[var(--brand-primary)] text-white"
                            : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                        }`}
                      >
                        {plan.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {field("Título popup", <input className="app-input" value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} />)}
            {field("Mensaje popup", <textarea className="app-textarea min-h-24" value={editor.message} onChange={(e) => setEditor({ ...editor, message: e.target.value })} />)}
            <div className="grid grid-cols-2 gap-3">
              {field("CTA label", <input className="app-input" value={editor.ctaLabel} onChange={(e) => setEditor({ ...editor, ctaLabel: e.target.value })} />)}
              {field("CTA URL", <input className="app-input" value={editor.ctaUrl} onChange={(e) => setEditor({ ...editor, ctaUrl: e.target.value })} placeholder="https://wa.me/57..." />)}
            </div>
            {field("Label botón dismiss", <input className="app-input" value={editor.dismissLabel} onChange={(e) => setEditor({ ...editor, dismissLabel: e.target.value })} />)}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditor(null)} className="app-button-secondary">Cancelar</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="app-button-primary inline-flex items-center gap-1.5 disabled:opacity-60">
                <Save size={15} />
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">Preview</p>
            <div className="flex items-center justify-center rounded-[18px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-6">
              <PopupCard
                title={editor.title || "Título del popup"}
                message={editor.message || "Mensaje del popup…"}
                ctaLabel={editor.ctaLabel}
                ctaUrl={editor.ctaUrl}
                dismissLabel={editor.dismissLabel}
              />
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando popups…</div>
      ) : popups.length === 0 ? (
        <div className="app-panel flex flex-col items-center gap-2 p-10 text-center">
          <MousePointerClick size={28} className="text-[var(--app-muted)]" />
          <p className="text-sm text-[var(--app-muted)]">Aún no hay popups. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {popups.map((p) => (
            <div key={p.popupId} className={`app-list-card flex items-center gap-3 p-4 ${!p.isActive ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--app-ink)]">{p.name || p.title || "Sin nombre"}</span>
                  <span className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
                    {POPUP_TRIGGER_LABELS[p.triggerType]}
                  </span>
                  <span className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
                    {POPUP_FREQUENCY_LABELS[p.frequency]}
                  </span>
                  <span className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
                    {p.targetMode === "all" ? "Todo el sitio" : `${p.targetPaths.length} ruta(s)`}
                  </span>
                  {(p.targetRoles.length > 0 || p.targetPlans.length > 0) && (
                    <span className="rounded-full bg-[var(--app-chip)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-primary)]">
                      Segmentado
                    </span>
                  )}
                </div>
                {p.title && <p className="mt-0.5 truncate text-xs text-[var(--app-muted)]">{p.title}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => void toggleActive(p)} title={p.isActive ? "Desactivar" : "Activar"} className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]">
                  {p.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button type="button" onClick={() => setEditor(fromRecord(p))} title="Editar" className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]">
                  <Edit3 size={15} />
                </button>
                <button type="button" onClick={() => void removePopup(p)} title="Eliminar" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
