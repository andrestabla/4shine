"use client";

import React from "react";
import {
  Bot,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { R2UploadButton } from "@/components/ui/R2UploadButton";
import { optimizeAvatarForUpload } from "@/lib/image-processing";
import {
  createFaq,
  deleteFaq,
  getAnalytics,
  getConversationMessages,
  getSettings,
  listConversations,
  listFaqs,
  updateFaq,
  updateSettings,
  type AdminConversation,
  type ChatbotAnalytics,
  type ChatbotFaq,
  type ChatbotSettings,
  type ChatMessage,
} from "@/features/chatbot/client";

type Tab = "config" | "faqs" | "conversaciones" | "analitica";

interface FaqEditorState {
  faqId: string | null;
  question: string;
  answer: string;
  isActive: boolean;
}

function emptyFaqEditor(): FaqEditorState {
  return { faqId: null, question: "", answer: "", isActive: true };
}

export default function AsistenteIaAdminPage() {
  const { alert, confirm } = useAppDialog();
  const [tab, setTab] = React.useState<Tab>("config");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Configuración
  const [settings, setSettings] = React.useState<ChatbotSettings | null>(null);
  const [form, setForm] = React.useState({
    isEnabled: true,
    model: "",
    persona: "",
    avatarUrl: "",
    systemPrompt: "",
    welcomeMessage: "",
    maxContextMessages: 12,
  });

  // FAQs
  const [faqs, setFaqs] = React.useState<ChatbotFaq[]>([]);
  const [faqEditor, setFaqEditor] = React.useState<FaqEditorState | null>(null);

  // Conversaciones
  const [conversations, setConversations] = React.useState<AdminConversation[]>([]);
  const [activeConv, setActiveConv] = React.useState<AdminConversation | null>(null);
  const [convMessages, setConvMessages] = React.useState<ChatMessage[]>([]);
  const [convLoading, setConvLoading] = React.useState(false);

  // Analítica
  const [analytics, setAnalytics] = React.useState<ChatbotAnalytics | null>(null);

  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    const [settingsRes, faqsRes] = await Promise.all([getSettings(), listFaqs()]);
    if (settingsRes.ok && settingsRes.data) {
      const s = settingsRes.data;
      setSettings(s);
      setForm({
        isEnabled: s.isEnabled,
        model: s.model,
        persona: s.persona,
        avatarUrl: s.avatarUrl,
        systemPrompt: s.systemPrompt,
        welcomeMessage: s.welcomeMessage,
        maxContextMessages: s.maxContextMessages,
      });
    }
    if (faqsRes.ok && faqsRes.data) setFaqs(faqsRes.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  React.useEffect(() => {
    if (tab === "conversaciones" && conversations.length === 0) {
      void (async () => {
        const res = await listConversations();
        if (res.ok && res.data) setConversations(res.data);
      })();
    }
    if (tab === "analitica" && !analytics) {
      void (async () => {
        const res = await getAnalytics();
        if (res.ok && res.data) setAnalytics(res.data);
      })();
    }
  }, [tab, conversations.length, analytics]);

  // ── Configuración ──────────────────────────────────────────

  const saveSettings = async () => {
    setSaving(true);
    const res = await updateSettings({
      isEnabled: form.isEnabled,
      model: form.model,
      persona: form.persona,
      avatarUrl: form.avatarUrl,
      systemPrompt: form.systemPrompt,
      welcomeMessage: form.welcomeMessage,
      maxContextMessages: form.maxContextMessages,
    });
    setSaving(false);
    if (res.ok && res.data) {
      setSettings(res.data);
      await alert({ title: "Guardado", message: "La configuración del asistente se actualizó.", tone: "success" });
    } else {
      await alert({ title: "Error", message: res.error ?? "No se pudo guardar.", tone: "error" });
    }
  };

  // ── FAQs ───────────────────────────────────────────────────

  const saveFaq = async () => {
    if (!faqEditor) return;
    if (!faqEditor.question.trim() || !faqEditor.answer.trim()) {
      await alert({ title: "Campos obligatorios", message: "Escribe la pregunta y la respuesta.", tone: "warning" });
      return;
    }
    setSaving(true);
    const res = faqEditor.faqId
      ? await updateFaq(faqEditor.faqId, {
          question: faqEditor.question,
          answer: faqEditor.answer,
          isActive: faqEditor.isActive,
        })
      : await createFaq({ question: faqEditor.question, answer: faqEditor.answer, isActive: faqEditor.isActive });
    setSaving(false);
    if (res.ok && res.data) {
      setFaqEditor(null);
      const listRes = await listFaqs();
      if (listRes.ok && listRes.data) setFaqs(listRes.data);
    } else {
      await alert({ title: "Error", message: res.error ?? "No se pudo guardar la FAQ.", tone: "error" });
    }
  };

  const removeFaq = async (faq: ChatbotFaq) => {
    const ok = await confirm({
      title: "Eliminar FAQ",
      message: `¿Eliminar "${faq.question}"?`,
      tone: "error",
      confirmText: "Eliminar",
    });
    if (!ok) return;
    const res = await deleteFaq(faq.faqId);
    if (res.ok) setFaqs((prev) => prev.filter((f) => f.faqId !== faq.faqId));
  };

  const toggleFaqActive = async (faq: ChatbotFaq) => {
    const res = await updateFaq(faq.faqId, { isActive: !faq.isActive });
    if (res.ok && res.data) setFaqs((prev) => prev.map((f) => (f.faqId === faq.faqId ? res.data! : f)));
  };

  // ── Conversaciones ─────────────────────────────────────────

  const openConversation = async (conv: AdminConversation) => {
    setActiveConv(conv);
    setConvLoading(true);
    setConvMessages([]);
    const res = await getConversationMessages(conv.conversationId);
    if (res.ok && res.data) setConvMessages(res.data);
    setConvLoading(false);
  };

  const TABS: Array<{ key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { key: "config", label: "Configuración", icon: Bot },
    { key: "faqs", label: "Base de conocimiento", icon: MessageSquare },
    { key: "conversaciones", label: "Conversaciones", icon: Users },
    { key: "analitica", label: "Analítica", icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Asistente IA"
        subtitle="Configura el chatbot de soporte 360: estado, persona, instrucciones, base de conocimiento y revisión de conversaciones."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors " +
                (tab === t.key
                  ? "bg-[var(--brand-primary)] text-white"
                  : "border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]")
              }
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : (
        <>
          {/* ── Configuración ── */}
          {tab === "config" && (
            <div className="space-y-5 rounded-[18px] border border-[var(--app-border)] bg-white p-5 md:p-6">
              <label className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                <span>
                  <span className="block text-sm font-extrabold text-[var(--app-ink)]">Asistente activo</span>
                  <span className="block text-xs text-[var(--app-muted)]">
                    Si lo apagas, el widget desaparece para todos los usuarios.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, isEnabled: e.target.checked }))}
                  className="h-5 w-5 accent-[var(--brand-primary)]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-primary)] text-white">
                  {form.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatarUrl} alt="Avatar del asistente" className="h-full w-full object-cover" />
                  ) : (
                    <Bot size={28} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[var(--app-ink)]">Avatar del asistente</p>
                  <p className="mb-2 text-xs text-[var(--app-muted)]">
                    Se muestra en el widget de chat. Recorte cuadrado + optimización 256×256 antes de subir.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <R2UploadButton
                      moduleCode="usuarios"
                      action="manage"
                      accept="image/*"
                      pathPrefix="chatbot/avatar"
                      buttonLabel={form.avatarUrl ? "Cambiar avatar" : "Subir avatar"}
                      className="app-button-secondary inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs"
                      preprocessFile={(file) =>
                        optimizeAvatarForUpload(file, { targetSize: 256, mimeType: "image/jpeg", quality: 0.86 })
                      }
                      onUploaded={async (url) => {
                        setForm((p) => ({ ...p, avatarUrl: url }));
                      }}
                    />
                    {form.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, avatarUrl: "" }))}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={12} /> Quitar
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--app-muted)]">
                    Recuerda guardar para aplicar los cambios.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                    Persona / nombre visible
                  </label>
                  <input
                    className="app-input"
                    value={form.persona}
                    placeholder="Asistente 4Shine"
                    onChange={(e) => setForm((p) => ({ ...p, persona: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                    Modelo (opcional)
                  </label>
                  <input
                    className="app-input"
                    value={form.model}
                    placeholder="Por defecto: el de Integraciones (p. ej. gpt-4.1)"
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Mensaje de bienvenida
                </label>
                <input
                  className="app-input"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Instrucciones del sistema (opcional)
                </label>
                <textarea
                  className="app-input min-h-[140px] resize-y"
                  value={form.systemPrompt}
                  placeholder="Tono, límites y prioridades del asistente. Si lo dejas vacío se usan las instrucciones por defecto (responde, no ejecuta acciones, guía con enlaces)."
                  onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                />
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  El asistente siempre recibe el contexto real del usuario (plan, accesos, días de suscripción, progreso) y
                  el mapa de rutas internas. No ejecuta acciones: guía con enlaces.
                </p>
              </div>

              <div className="max-w-xs">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Mensajes de contexto (memoria)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="app-input"
                  value={form.maxContextMessages}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxContextMessages: Number(e.target.value) || 12 }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={saving}
                  className="app-button-primary inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar configuración
                </button>
              </div>
            </div>
          )}

          {/* ── FAQs ── */}
          {tab === "faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--app-muted)]">
                  Respuestas de referencia que el asistente usa para responder con precisión.
                </p>
                <button
                  type="button"
                  onClick={() => setFaqEditor(emptyFaqEditor())}
                  className="app-button-primary inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Nueva FAQ
                </button>
              </div>

              {faqEditor && (
                <div className="space-y-3 rounded-[18px] border border-[var(--brand-primary)] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[var(--app-ink)]">
                      {faqEditor.faqId ? "Editar FAQ" : "Nueva FAQ"}
                    </h3>
                    <button type="button" onClick={() => setFaqEditor(null)} className="text-[var(--app-muted)]">
                      <X size={18} />
                    </button>
                  </div>
                  <input
                    className="app-input"
                    placeholder="Pregunta"
                    value={faqEditor.question}
                    onChange={(e) => setFaqEditor((p) => (p ? { ...p, question: e.target.value } : p))}
                  />
                  <textarea
                    className="app-input min-h-[120px] resize-y"
                    placeholder="Respuesta (puedes usar Markdown y enlaces internos como /dashboard/perfil)"
                    value={faqEditor.answer}
                    onChange={(e) => setFaqEditor((p) => (p ? { ...p, answer: e.target.value } : p))}
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
                    <input
                      type="checkbox"
                      checked={faqEditor.isActive}
                      onChange={(e) => setFaqEditor((p) => (p ? { ...p, isActive: e.target.checked } : p))}
                      className="h-4 w-4 accent-[var(--brand-primary)]"
                    />
                    Activa
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setFaqEditor(null)}
                      className="rounded-full border border-[var(--app-border)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveFaq()}
                      disabled={saving}
                      className="app-button-primary inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {faqs.length === 0 && (
                  <p className="rounded-[14px] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
                    Aún no hay FAQs.
                  </p>
                )}
                {faqs.map((faq) => (
                  <div
                    key={faq.faqId}
                    className="flex items-start justify-between gap-3 rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--app-ink)]">{faq.question}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--app-muted)]">{faq.answer}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title={faq.isActive ? "Desactivar" : "Activar"}
                        onClick={() => void toggleFaqActive(faq)}
                        className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                      >
                        {faq.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() =>
                          setFaqEditor({
                            faqId: faq.faqId,
                            question: faq.question,
                            answer: faq.answer,
                            isActive: faq.isActive,
                          })
                        }
                        className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => void removeFaq(faq)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Conversaciones ── */}
          {tab === "conversaciones" && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,340px)_1fr]">
              <div className="space-y-2">
                {conversations.length === 0 && (
                  <p className="rounded-[14px] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
                    Aún no hay conversaciones.
                  </p>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.conversationId}
                    type="button"
                    onClick={() => void openConversation(conv)}
                    className={
                      "w-full rounded-[14px] border px-4 py-3 text-left transition-colors " +
                      (activeConv?.conversationId === conv.conversationId
                        ? "border-[var(--brand-primary)] bg-[var(--app-surface-muted)]"
                        : "border-[var(--app-border)] bg-white hover:border-[var(--brand-primary)]")
                    }
                  >
                    <p className="text-sm font-bold text-[var(--app-ink)]">{conv.userName}</p>
                    <p className="line-clamp-1 text-xs text-[var(--app-muted)]">{conv.lastMessage ?? conv.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{conv.messageCount} mensajes</p>
                  </button>
                ))}
              </div>

              <div className="rounded-[18px] border border-[var(--app-border)] bg-white p-4">
                {!activeConv ? (
                  <p className="py-10 text-center text-sm text-[var(--app-muted)]">
                    Selecciona una conversación para verla.
                  </p>
                ) : convLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                    <Loader2 size={16} className="animate-spin" /> Cargando…
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-extrabold text-[var(--app-ink)]">{activeConv.userName}</p>
                    {convMessages.map((m) => (
                      <div
                        key={m.messageId}
                        className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={
                            "max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3 py-2 text-[13px] " +
                            (m.role === "user"
                              ? "bg-[var(--brand-primary)] text-white"
                              : "border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-ink)]")
                          }
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Analítica ── */}
          {tab === "analitica" && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Conversaciones", value: analytics?.conversations ?? 0 },
                { label: "Mensajes", value: analytics?.messages ?? 0 },
                { label: "Usuarios activos", value: analytics?.activeUsers ?? 0 },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-[18px] border border-[var(--app-border)] bg-white p-5 text-center"
                >
                  <p className="text-3xl font-black text-[var(--app-ink)]">{card.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">{card.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
