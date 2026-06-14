"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { AppliedTourStep } from "@/features/tour/types";
import { finishTour as apiFinishTour, recordStepView } from "@/features/tour/client";

interface TourRunnerProps {
  steps: AppliedTourStep[];
  startIndex: number;
  forceSidebarOpen: (open: boolean) => void;
  onClose: () => void;
  onComplete: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 360;
const CARD_GAP = 16;
const HOLE_PADDING = 8;

/** Espera a que un elemento exista y tenga tamaño, tolerando la navegación
 * async del App Router (el DOM de la nueva ruta monta tras varios ticks). */
function waitForElement(selector: string, timeoutMs: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    let rafId = 0;
    let observer: MutationObserver | null = null;

    const cleanup = () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };

    const check = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          cleanup();
          resolve(el);
          return true;
        }
      }
      if (performance.now() - start > timeoutMs) {
        cleanup();
        resolve(null);
        return true;
      }
      return false;
    };

    if (check()) return;
    observer = new MutationObserver(() => check());
    observer.observe(document.body, { childList: true, subtree: true });
    const loop = () => {
      if (check()) return;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  });
}

export default function TourRunner({
  steps,
  startIndex,
  forceSidebarOpen,
  onClose,
  onComplete,
}: TourRunnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [index, setIndex] = React.useState(() =>
    Math.min(Math.max(startIndex, 0), Math.max(steps.length - 1, 0)),
  );
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [locating, setLocating] = React.useState(true);
  const recordedRef = React.useRef<Set<string>>(new Set());
  const total = steps.length;
  const step = steps[index];

  // Localiza el objetivo del paso actual (navega si hace falta) y mide su rect.
  React.useEffect(() => {
    if (!step) return;
    let cancelled = false;
    setLocating(true);
    setRect(null);

    const anchor = step.anchor;
    // En móvil el menú lateral es off-canvas: ábrelo para los pasos del sidebar
    // y ciérralo para los de la barra superior (si no, el panel abierto los tapa).
    forceSidebarOpen(anchor.area === "sidebar");
    if (anchor.route && pathname !== anchor.route) {
      router.push(anchor.route);
    }

    (async () => {
      const el = await waitForElement(anchor.selector, 4500);
      if (cancelled) return;
      if (el) {
        try {
          el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        } catch {
          /* noop */
        }
        // Pequeño respiro para que el scroll asiente antes de medir.
        await new Promise((r) => setTimeout(r, 220));
        if (cancelled) return;
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null); // fallback: tarjeta centrada sin spotlight
      }
      setLocating(false);

      // Registrar la vista (idempotente en el server).
      if (!recordedRef.current.has(step.stepKey)) {
        recordedRef.current.add(step.stepKey);
        void recordStepView({ stepKey: step.stepKey, stepIndex: index, totalSteps: total });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Recalcular el rect al hacer scroll / resize.
  React.useEffect(() => {
    if (!step) return;
    const remeasure = () => {
      const el = document.querySelector(step.anchor.selector) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, step?.anchor.selector]);

  const handleClose = React.useCallback(() => {
    forceSidebarOpen(false);
    void apiFinishTour({
      status: "dismissed",
      lastStepKey: step?.stepKey,
      lastStepIndex: index,
      totalSteps: total,
    });
    onClose();
  }, [index, onClose, step?.stepKey, total, forceSidebarOpen]);

  const handleComplete = React.useCallback(() => {
    forceSidebarOpen(false);
    void apiFinishTour({
      status: "completed",
      lastStepKey: step?.stepKey,
      lastStepIndex: index,
      totalSteps: total,
    });
    onComplete();
  }, [index, onComplete, step?.stepKey, total, forceSidebarOpen]);

  // Restaura el menú lateral si el componente se desmonta sin pasar por los handlers.
  React.useEffect(() => () => forceSidebarOpen(false), [forceSidebarOpen]);

  const goNext = React.useCallback(() => {
    if (index >= total - 1) {
      handleComplete();
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, total, handleComplete]);

  const goPrev = React.useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Teclado: Esc cierra, flechas navegan.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, goNext, goPrev]);

  if (!step) return null;

  // Posición de la tarjeta: a la derecha del objetivo (sidebar) o debajo;
  // con respaldo centrado si no hay rect.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const isNarrow = vw < 768;

  let cardStyle: React.CSSProperties;
  if (isNarrow) {
    // Móvil: hoja inferior (bottom sheet) a ancho completo, con scroll propio.
    // Evita solaparse con el menú off-canvas abierto y los desbordes de texto.
    cardStyle = {
      left: 12,
      right: 12,
      bottom: 12,
      maxHeight: "62vh",
      overflowY: "auto",
    };
  } else if (!rect) {
    cardStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(CARD_WIDTH, vw - 32),
      maxHeight: "80vh",
      overflowY: "auto",
    };
  } else if (rect.left + rect.width + CARD_GAP + CARD_WIDTH < vw) {
    // a la derecha
    cardStyle = {
      top: Math.min(Math.max(rect.top, 16), vh - 240),
      left: rect.left + rect.width + CARD_GAP,
      width: CARD_WIDTH,
      maxHeight: "80vh",
      overflowY: "auto",
    };
  } else {
    // debajo (o encima si no cabe), centrado horizontalmente respecto al objetivo
    const below = rect.top + rect.height + CARD_GAP;
    const fitsBelow = below + 220 < vh;
    const width = Math.min(CARD_WIDTH, vw - 32);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.min(Math.max(left, 16), vw - width - 16);
    cardStyle = {
      top: fitsBelow ? below : Math.max(16, rect.top - CARD_GAP - 220),
      left,
      width,
      maxHeight: "80vh",
      overflowY: "auto",
    };
  }

  return (
    <div className="fixed inset-0 z-[130]" aria-live="polite" role="dialog" aria-modal="true">
      {/* Capa que bloquea la interacción con la app (tour forzado). El spotlight
          se pinta con el box-shadow del recorte; el resto queda oscurecido. */}
      <div className="absolute inset-0 bg-transparent" />

      {rect ? (
        <div
          className="pointer-events-none absolute rounded-[14px] transition-all duration-300"
          style={{
            top: rect.top - HOLE_PADDING,
            left: rect.left - HOLE_PADDING,
            width: rect.width + HOLE_PADDING * 2,
            height: rect.height + HOLE_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(15, 8, 30, 0.66)",
            outline: "2px solid rgba(255,255,255,0.9)",
            outlineOffset: "2px",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[rgba(15,8,30,0.66)]" />
      )}

      {/* Tarjeta */}
      <div
        className="absolute rounded-[18px] border border-[var(--app-border)] bg-white p-5 shadow-2xl"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-[var(--brand-primary)]/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
            Paso {index + 1} de {total}
          </span>
          <button
            type="button"
            onClick={handleClose}
            title="Cerrar tour"
            aria-label="Cerrar tour"
            className="rounded-full p-1 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
          >
            <X size={16} />
          </button>
        </div>

        {step.title && (
          <h3 className="mt-3 text-lg font-bold text-[var(--app-ink)]">{step.title}</h3>
        )}

        <div
          className="prose prose-sm mt-2 max-w-none text-sm leading-relaxed text-[var(--app-ink)]/85 [&_a]:text-[var(--brand-primary)] [&_a]:underline"
          dangerouslySetInnerHTML={{
            __html: step.bodyHtml || (locating ? "<p>Cargando…</p>" : ""),
          }}
        />

        {/* Barra de progreso */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
          >
            Saltar tour
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <ArrowLeft size={13} />
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="app-button-primary inline-flex items-center gap-1 px-4 py-1.5 text-xs"
            >
              {index >= total - 1 ? (
                <>
                  <Check size={13} />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
