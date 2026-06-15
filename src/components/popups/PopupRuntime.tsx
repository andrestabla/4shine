"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getActivePopups, type PublicPopup } from "@/features/popups/client";

// ─── Tarjeta presentacional (reutilizada por el runtime y el preview admin) ──

export function PopupCard({
  title,
  message,
  ctaLabel,
  ctaUrl,
  dismissLabel,
  onCta,
  onDismiss,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  dismissLabel: string;
  onCta?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="relative w-[min(92vw,420px)] rounded-[18px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-full p-1 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
        >
          <X size={16} />
        </button>
      )}
      {title && <h3 className="pr-6 text-lg font-black text-[var(--app-ink)]">{title}</h3>}
      {message && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--app-ink)]/80">{message}</p>
      )}
      <div className="mt-5 flex flex-col gap-2">
        {ctaLabel && ctaUrl && (
          <button
            type="button"
            onClick={onCta}
            className="w-full rounded-full px-5 py-2.5 text-sm font-extrabold transition hover:opacity-90"
            style={{ background: "var(--brand-accent)", color: "var(--brand-on-accent)" }}
          >
            {ctaLabel}
          </button>
        )}
        {dismissLabel && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-full px-5 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
          >
            {dismissLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Supresión por frecuencia (storage por popup) ───────────────────────────

function storageKey(popupId: string): string {
  return `popup_seen_${popupId}`;
}

function isSuppressed(p: PublicPopup): boolean {
  if (typeof window === "undefined") return true;
  const key = storageKey(p.popupId);
  try {
    if (p.frequency === "always") return false;
    if (p.frequency === "session") return sessionStorage.getItem(key) === "1";
    if (p.frequency === "once") return localStorage.getItem(key) === "1";
    if (p.frequency === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(key) === today;
    }
  } catch {
    return false;
  }
  return false;
}

function markSeen(p: PublicPopup): void {
  if (typeof window === "undefined") return;
  const key = storageKey(p.popupId);
  try {
    if (p.frequency === "session") sessionStorage.setItem(key, "1");
    else if (p.frequency === "once") localStorage.setItem(key, "1");
    else if (p.frequency === "daily") localStorage.setItem(key, new Date().toISOString().slice(0, 10));
  } catch {
    /* storage no disponible */
  }
}

function matchesPath(p: PublicPopup, pathname: string): boolean {
  if (p.targetMode === "all") return true;
  return p.targetPaths.some((t) => {
    const path = t.trim();
    if (!path) return false;
    return pathname === path || pathname.startsWith(path.endsWith("/") ? path : `${path}`);
  });
}

// ─── Runtime ─────────────────────────────────────────────────────────────────

export default function PopupRuntime() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<PublicPopup | null>(null);
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    shownRef.current = false;
    setActive(null);

    const cleanups: Array<() => void> = [];

    (async () => {
      const popups = await getActivePopups();
      if (cancelled) return;
      const candidate = popups.find((p) => matchesPath(p, pathname) && !isSuppressed(p));
      if (!candidate) return;

      const show = () => {
        if (cancelled || shownRef.current) return;
        shownRef.current = true;
        markSeen(candidate);
        setActive(candidate);
      };

      switch (candidate.triggerType) {
        case "immediate":
          show();
          break;
        case "time": {
          const id = window.setTimeout(show, Math.max(0, candidate.delaySeconds) * 1000);
          cleanups.push(() => window.clearTimeout(id));
          break;
        }
        case "scroll": {
          const onScroll = () => {
            const doc = document.documentElement;
            const scrolled = (doc.scrollTop + window.innerHeight) / Math.max(doc.scrollHeight, 1);
            if (scrolled * 100 >= candidate.scrollPercent) show();
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          cleanups.push(() => window.removeEventListener("scroll", onScroll));
          onScroll();
          break;
        }
        case "exit_intent": {
          const onLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) show();
          };
          document.addEventListener("mouseout", onLeave);
          cleanups.push(() => document.removeEventListener("mouseout", onLeave));
          break;
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!active) return null;

  const onCta = () => {
    const url = active.ctaUrl.trim();
    setActive(null);
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(15,8,30,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActive(null);
      }}
    >
      <PopupCard
        title={active.title}
        message={active.message}
        ctaLabel={active.ctaLabel}
        ctaUrl={active.ctaUrl}
        dismissLabel={active.dismissLabel}
        onCta={onCta}
        onDismiss={() => setActive(null)}
      />
    </div>
  );
}
