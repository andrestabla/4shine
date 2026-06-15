"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";
import { getMyChatbot, sendChatMessage } from "@/features/chatbot/client";
import type { ChatMessage, ChatbotSuggestion } from "@/features/chatbot/types";

interface UiMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Sanea los enlaces del asistente: si apunta a cualquier dominio 4shine.* (p. ej.
 * el modelo escribió 4shine.com en vez de .co) lo fuerza al MISMO origen actual
 * usando solo la ruta. Devuelve { href, external } para decidir el target.
 */
function normalizeHref(href?: string): { href: string; external: boolean } {
  if (!href) return { href: "#", external: false };
  if (href.startsWith("/")) return { href, external: false };
  if (/^(mailto:|tel:)/i.test(href)) return { href, external: false };
  try {
    const url = new URL(href, window.location.origin);
    if (/(^|\.)4shine\.[a-z]+$/i.test(url.hostname) || url.origin === window.location.origin) {
      return { href: `${url.pathname}${url.search}${url.hash}` || "/", external: false };
    }
    return { href: url.toString(), external: true };
  } catch {
    return { href, external: false };
  }
}

export default function ChatWidget() {
  const { isAuthenticated, isHydrating } = useUser();
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [welcome, setWelcome] = useState("");
  const [persona, setPersona] = useState("Asistente 4Shine");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Carga inicial: settings públicos + última conversación.
  useEffect(() => {
    if (isHydrating || !isAuthenticated || didLoad.current) return;
    didLoad.current = true;
    void (async () => {
      const res = await getMyChatbot();
      if (res.ok && res.data) {
        setEnabled(res.data.enabled);
        setWelcome(res.data.welcomeMessage);
        setPersona(res.data.persona || "Asistente 4Shine");
        setAvatarUrl(res.data.avatarUrl || "");
        setConversationId(res.data.conversationId);
        setMessages(res.data.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })));
        setBriefing(res.data.briefing ?? null);
        setSuggestions(res.data.suggestions ?? []);
      }
      setReady(true);
    })();
  }, [isAuthenticated, isHydrating]);

  // Autoscroll al final cuando hay mensajes nuevos o abre el panel.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, sending]);

  if (isHydrating || !isAuthenticated || !ready || !enabled) return null;

  const openingText = [welcome, briefing].filter(Boolean).join("\n\n");
  const isFresh = messages.length === 0;
  const visibleMessages: UiMessage[] =
    !isFresh || !openingText ? messages : [{ role: "assistant", content: openingText }];

  const handleSend = async (textArg?: string) => {
    const text = (textArg ?? draft).trim();
    if (!text || sending) return;
    setError(null);
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await sendChatMessage({ conversationId, text });
      if (res.ok && res.data) {
        setConversationId(res.data.conversationId);
        setMessages((prev) => [...prev, { role: "assistant", content: res.data!.reply }]);
      } else {
        setError(res.error ?? "No se pudo enviar el mensaje");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, hubo un problema al responder. Inténtalo de nuevo." },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatbot-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .chatbot-typing-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background-color: var(--brand-primary);
          animation: chatbot-typing 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Botón flotante */}
      <button
        type="button"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {open ? (
          <X size={24} />
        ) : avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={persona} className="h-full w-full object-cover" />
        ) : (
          <MessageCircle size={26} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-[90] flex w-[min(92vw,400px)] flex-col overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-white shadow-2xl"
          style={{ height: "min(72vh, 620px)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/20">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={persona} className="h-full w-full object-cover" />
              ) : (
                <Bot size={20} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold leading-tight">{persona}</p>
              <p className="text-[11px] leading-tight text-white/80">Soporte 360 · te guío en todo</p>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[var(--app-surface-muted)] px-3 py-4 [-webkit-overflow-scrolling:touch]"
          >
            {visibleMessages.map((m, i) => (
              <div
                key={i}
                className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={clsx(
                    "max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "rounded-br-sm bg-[var(--brand-primary)] text-white"
                      : "rounded-bl-sm border border-[var(--app-border)] bg-white text-[var(--app-ink)]",
                  )}
                >
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <div className="chatbot-prose">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          a: ({ href, children }) => {
                            const safe = normalizeHref(href);
                            return (
                              <a
                                href={safe.href}
                                {...(safe.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="font-semibold underline"
                                style={{ color: "var(--brand-primary)" }}
                              >
                                {children}
                              </a>
                            );
                          },
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                          strong: ({ children }) => <strong className="font-extrabold">{children}</strong>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[16px] rounded-bl-sm border border-[var(--app-border)] bg-white px-4 py-3 shadow-sm">
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="chatbot-typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}

            {isFresh && !sending && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void handleSend(s.prompt)}
                    className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-left text-[12px] font-semibold text-[var(--brand-primary)] shadow-sm transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,white)]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-[var(--app-border)] bg-white px-3 py-2.5">
            {error && <p className="mb-1.5 text-[11px] font-semibold text-red-600">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder="Escribe tu pregunta…"
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[13px] text-[var(--app-ink)] outline-none focus:border-[var(--brand-primary)]"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
