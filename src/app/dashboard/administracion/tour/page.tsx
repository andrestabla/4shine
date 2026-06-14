"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { TourAnalyticsPanel } from "@/components/dashboard/tour/TourAnalyticsPanel";
import {
  createStep,
  deleteStep,
  getSettings,
  listSteps,
  reorderSteps,
  resetTour,
  updateSettings,
  updateStep,
  type TourStepRecord,
  type TourSettingsRecord,
} from "@/features/tour/client";
import { TOUR_ANCHORS, getAnchor } from "@/features/tour/catalog";
import { TOUR_ROLES, TOUR_ROLE_LABELS, type TourRole } from "@/features/tour/types";

type Tab = "pasos" | "analitica" | "config";

interface EditorState {
  stepId: string | null;
  anchorKey: string;
  title: string;
  bodyHtml: string;
  visibleRoles: TourRole[];
  isActive: boolean;
}

const SIDEBAR_ANCHORS = TOUR_ANCHORS.filter((a) => a.area === "sidebar");
const HEADER_ANCHORS = TOUR_ANCHORS.filter((a) => a.area === "header");

function emptyEditor(): EditorState {
  return {
    stepId: null,
    anchorKey: SIDEBAR_ANCHORS[0]?.key ?? "",
    title: "",
    bodyHtml: "",
    visibleRoles: ["lider"],
    isActive: true,
  };
}

export default function TourAdminPage() {
  const { alert, confirm } = useAppDialog();
  const [tab, setTab] = React.useState<Tab>("pasos");
  const [steps, setSteps] = React.useState<TourStepRecord[]>([]);
  const [settings, setSettings] = React.useState<TourSettingsRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [saving, setSaving] = React.useState(false);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    const [stepsRes, settingsRes] = await Promise.all([listSteps(), getSettings()]);
    if (stepsRes.ok && stepsRes.data) setSteps(stepsRes.data);
    if (settingsRes.ok && settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
    const res = await reorderSteps(next.map((s) => s.stepId));
    if (res.ok && res.data) setSteps(res.data);
  };

  const toggleActive = async (step: TourStepRecord) => {
    const res = await updateStep(step.stepId, { isActive: !step.isActive });
    if (res.ok && res.data) {
      setSteps((prev) => prev.map((s) => (s.stepId === step.stepId ? res.data! : s)));
    } else {
      await alert({ title: "Error", message: res.error ?? "No se pudo actualizar.", tone: "error" });
    }
  };

  const removeStep = async (step: TourStepRecord) => {
    const ok = await confirm({
      title: "Eliminar paso",
      message: `¿Eliminar el paso "${step.title || step.stepKey}"? Esta acción no se puede deshacer.`,
      tone: "warning",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    const res = await deleteStep(step.stepId);
    if (res.ok) setSteps((prev) => prev.filter((s) => s.stepId !== step.stepId));
    else await alert({ title: "Error", message: res.error ?? "No se pudo eliminar.", tone: "error" });
  };

  const openEdit = (step: TourStepRecord) => {
    setEditor({
      stepId: step.stepId,
      anchorKey: step.anchorKey,
      title: step.title,
      bodyHtml: step.bodyHtml,
      visibleRoles: step.visibleRoles,
      isActive: step.isActive,
    });
  };

  const saveEditor = async () => {
    if (!editor) return;
    if (editor.visibleRoles.length === 0) {
      await alert({ title: "Roles requeridos", message: "Selecciona al menos un rol.", tone: "warning" });
      return;
    }
    setSaving(true);
    const payload = {
      anchorKey: editor.anchorKey,
      title: editor.title,
      bodyHtml: editor.bodyHtml,
      visibleRoles: editor.visibleRoles,
      isActive: editor.isActive,
    };
    const res = editor.stepId
      ? await updateStep(editor.stepId, payload)
      : await createStep(payload);
    setSaving(false);
    if (!res.ok) {
      await alert({ title: "Error al guardar", message: res.error ?? "Inténtalo de nuevo.", tone: "error" });
      return;
    }
    setEditor(null);
    await loadAll();
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: "Reiniciar tour para todos",
      message:
        "Todos los usuarios volverán a ver el tour en su próximo ingreso. El progreso anterior se conserva para histórico. ¿Continuar?",
      tone: "warning",
      confirmText: "Sí, reiniciar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    const res = await resetTour();
    if (res.ok && res.data) {
      setSettings(res.data);
      await alert({
        title: "Tour reiniciado",
        message: `Nueva versión activa: v${res.data.currentVersion}.`,
        tone: "success",
      });
    } else {
      await alert({ title: "Error", message: res.error ?? "No se pudo reiniciar.", tone: "error" });
    }
  };

  const toggleEnabled = async () => {
    if (!settings) return;
    const res = await updateSettings({ isEnabled: !settings.isEnabled });
    if (res.ok && res.data) setSettings(res.data);
    else await alert({ title: "Error", message: res.error ?? "No se pudo actualizar.", tone: "error" });
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
        tab === id
          ? "bg-[var(--app-ink)] text-white"
          : "border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Tour de Onboarding"
        subtitle="Configura el recorrido guiado del primer ingreso, por rol, con analítica de vistas."
      />

      <div className="flex flex-wrap items-center gap-2">
        {tabBtn("pasos", "Pasos")}
        {tabBtn("analitica", "Analítica")}
        {tabBtn("config", "Configuración")}
      </div>

      {tab === "pasos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditor(emptyEditor())}
              className="app-button-primary inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              Añadir paso
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-[var(--app-muted)]">Cargando pasos…</div>
          ) : steps.length === 0 ? (
            <div className="app-panel flex flex-col items-center gap-2 p-10 text-center">
              <Compass size={28} className="text-[var(--app-muted)]" />
              <p className="text-sm text-[var(--app-muted)]">
                Aún no hay pasos. Crea el primero o ejecuta el seed por defecto.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, idx) => {
                const anchor = getAnchor(step.anchorKey);
                return (
                  <div
                    key={step.stepId}
                    className={`app-list-card flex items-start gap-3 p-4 ${!step.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => void move(idx, -1)}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-30"
                        aria-label="Subir"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void move(idx, 1)}
                        disabled={idx === steps.length - 1}
                        className="rounded p-0.5 text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-30"
                        aria-label="Bajar"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black text-[var(--app-muted)]">#{idx + 1}</span>
                        <span className="font-semibold text-[var(--app-ink)]">
                          {step.title || <em className="text-[var(--app-muted)]">Sin título</em>}
                        </span>
                        {step.isSystem && (
                          <span className="rounded-full bg-[var(--app-chip)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                            Sistema
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                        Objetivo: {anchor?.label ?? step.anchorKey}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {step.visibleRoles.map((r) => (
                          <span
                            key={r}
                            className="rounded-full border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]"
                          >
                            {TOUR_ROLE_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void toggleActive(step)}
                        title={step.isActive ? "Desactivar" : "Activar"}
                        className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                      >
                        {step.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(step)}
                        title="Editar"
                        className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                      >
                        <Edit3 size={15} />
                      </button>
                      {!step.isSystem && (
                        <button
                          type="button"
                          onClick={() => void removeStep(step)}
                          title="Eliminar"
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "analitica" && <TourAnalyticsPanel />}

      {tab === "config" && (
        <div className="space-y-4">
          <section className="app-panel flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h4 className="font-bold text-[var(--app-ink)]">Tour habilitado</h4>
              <p className="text-xs text-[var(--app-muted)]">
                Si lo desactivas, ningún usuario verá el recorrido en su primer ingreso.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggleEnabled()}
              className={`relative h-7 w-12 rounded-full transition ${
                settings?.isEnabled ? "bg-[var(--brand-primary)]" : "bg-[var(--app-border)]"
              }`}
              aria-pressed={settings?.isEnabled ?? false}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  settings?.isEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </section>

          <section className="app-panel flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h4 className="font-bold text-[var(--app-ink)]">Reiniciar tour para todos</h4>
              <p className="text-xs text-[var(--app-muted)]">
                Versión actual: <strong>v{settings?.currentVersion ?? "—"}</strong>. Al reiniciar, todos
                volverán a verlo en su próximo ingreso.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleReset()}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
            >
              <RotateCcw size={14} />
              Reiniciar para todos
            </button>
          </section>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(22,10,38,0.55)] p-4 backdrop-blur-sm">
          <div className="mt-6 w-[min(94vw,640px)] rounded-[20px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--app-ink)]">
                {editor.stepId ? "Editar paso" : "Nuevo paso"}
              </h3>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="app-field-label">Objetivo a resaltar</span>
                <select
                  className="app-select"
                  value={editor.anchorKey}
                  onChange={(e) => setEditor({ ...editor, anchorKey: e.target.value })}
                >
                  <optgroup label="Menú lateral">
                    {SIDEBAR_ANCHORS.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Barra superior">
                    {HEADER_ANCHORS.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>

              <label className="block">
                <span className="app-field-label">Título</span>
                <input
                  className="app-input"
                  value={editor.title}
                  onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                  placeholder="Ej: Tu panel de inicio"
                />
              </label>

              <div>
                <span className="app-field-label">Contenido</span>
                <RichTextEditor
                  value={editor.bodyHtml}
                  onChange={(html) => setEditor({ ...editor, bodyHtml: html })}
                  placeholder="Describe qué encontrará el usuario en esta sección…"
                  minHeight="140px"
                />
              </div>

              <div>
                <span className="app-field-label">Roles que verán este paso</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {TOUR_ROLES.map((role) => {
                    const checked = editor.visibleRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setEditor({
                            ...editor,
                            visibleRoles: checked
                              ? editor.visibleRoles.filter((r) => r !== role)
                              : [...editor.visibleRoles, role],
                          })
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          checked
                            ? "bg-[var(--brand-primary)] text-white"
                            : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                        }`}
                      >
                        {TOUR_ROLE_LABELS[role]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
                <input
                  type="checkbox"
                  checked={editor.isActive}
                  onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })}
                />
                Paso activo
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditor(null)} className="app-button-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveEditor()}
                disabled={saving}
                className="app-button-primary inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
