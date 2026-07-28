"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { getActivePopups, type PublicPopup, type BannerStyle } from "@/features/popups/client";
import { isSuppressed, markSeen } from "@/components/popups/PopupRuntime";

// ─── Tarjeta presentacional del banner (reutilizada por el preview admin) ────

const STYLES: Record<
  BannerStyle,
  { bg: string; border: string; title: string; text: string; chipBg: string; chipColor: string; cta: string; ctaText: string; dismiss: string }
> = {
  brand: {
    bg: "linear-gradient(120deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 72%, black))",
    border: "1px solid color-mix(in srgb, var(--brand-accent) 55%, transparent)",
    title: "#ffffff",
    text: "rgba(255,255,255,0.78)",
    chipBg: "color-mix(in srgb, var(--brand-accent) 22%, transparent)",
    chipColor: "var(--brand-accent)",
    cta: "var(--brand-accent)",
    ctaText: "var(--brand-on-accent, #0D1B2A)",
    dismiss: "rgba(255,255,255,0.6)",
  },
  gold: {
    bg: "linear-gradient(120deg, color-mix(in srgb, var(--brand-accent) 88%, white), var(--brand-accent))",
    border: "1px solid color-mix(in srgb, var(--brand-accent) 70%, black)",
    title: "var(--brand-primary)",
    text: "color-mix(in srgb, var(--brand-primary) 78%, transparent)",
    chipBg: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
    chipColor: "var(--brand-primary)",
    cta: "var(--brand-primary)",
    ctaText: "#ffffff",
    dismiss: "color-mix(in srgb, var(--brand-primary) 55%, transparent)",
  },
  navy: {
    bg: "var(--brand-primary)",
    border: "1px solid var(--app-border)",
    title: "#ffffff",
    text: "rgba(255,255,255,0.72)",
    chipBg: "rgba(255,255,255,0.12)",
    chipColor: "#ffffff",
    cta: "#ffffff",
    ctaText: "var(--brand-primary)",
    dismiss: "rgba(255,255,255,0.55)",
  },
  light: {
    bg: "#ffffff",
    border: "1px solid var(--app-border)",
    title: "var(--app-ink)",
    text: "var(--app-muted)",
    chipBg: "color-mix(in srgb, var(--brand-accent) 18%, white)",
    chipColor: "color-mix(in srgb, var(--brand-accent) 70%, black)",
    cta: "var(--brand-accent)",
    ctaText: "var(--brand-on-accent, #0D1B2A)",
    dismiss: "var(--app-muted)",
  },
};

export function BannerCard({
  title,
  message,
  ctaLabel,
  ctaUrl,
  style = "brand",
  onCta,
  onDismiss,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  style?: BannerStyle;
  onCta?: () => void;
  onDismiss?: () => void;
}) {
  const v = STYLES[style] ?? STYLES.brand;
  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-[18px] p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-5"
      style={{ background: v.bg, border: v.border }}
    >
      <div
        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] sm:flex"
        style={{ background: v.chipBg, color: v.chipColor }}
      >
        <Sparkles size={20} />
      </div>
      <div className="min-w-0 flex-1 pr-7 sm:pr-0">
        {title && (
          <p className="text-sm font-black leading-snug sm:text-base" style={{ color: v.title }}>
            {title}
          </p>
        )}
        {message && (
          <p className="mt-0.5 text-xs leading-relaxed sm:text-sm" style={{ color: v.text }}>
            {message}
          </p>
        )}
      </div>
      {ctaLabel && ctaUrl && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-extrabold transition hover:opacity-90"
          style={{ background: v.cta, color: v.ctaText }}
        >
          {ctaLabel}
          <ArrowRight size={15} />
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="absolute right-2.5 top-2.5 rounded-full p-1 transition hover:opacity-80 sm:static sm:shrink-0"
          style={{ color: v.dismiss }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Matching de módulo ──────────────────────────────────────────────────────
// Un banner apunta a MÓDULOS: la ruta objetivo cubre esa ruta y sus subrutas.
// '/dashboard' es especial (es Inicio): solo coincide exacto, para no aparecer
// en todos los módulos.

function bannerMatchesPath(p: PublicPopup, pathname: string): boolean {
  if (p.targetMode === "all") return true;
  return p.targetPaths.some((raw) => {
    const t = raw.trim().replace(/\/+$/, "");
    if (!t) return false;
    if (t === "/dashboard") return pathname === "/dashboard";
    return pathname === t || pathname.startsWith(`${t}/`);
  });
}

// ─── Runtime: banners en línea al tope del módulo ────────────────────────────

export default function BannerRuntime() {
  const pathname = usePathname();
  const [banners, setBanners] = React.useState<PublicPopup[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setBanners([]);
    (async () => {
      const popups = await getActivePopups();
      if (cancelled) return;
      const active = popups
        .filter((p) => p.displayMode === "banner" && bannerMatchesPath(p, pathname) && !isSuppressed(p))
        .slice(0, 2); // máximo 2 banners simultáneos para no saturar
      setBanners(active);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (banners.length === 0) return null;

  const dismiss = (b: PublicPopup) => {
    markSeen(b);
    setBanners((prev) => prev.filter((x) => x.popupId !== b.popupId));
  };

  const onCta = (b: PublicPopup) => {
    const url = b.ctaUrl.trim();
    // El CTA también respeta la frecuencia: si el usuario ya actuó, no insistir.
    markSeen(b);
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="mb-5 space-y-3 animate-fade-in">
      {banners.map((b) => (
        <BannerCard
          key={b.popupId}
          title={b.title}
          message={b.message}
          ctaLabel={b.ctaLabel}
          ctaUrl={b.ctaUrl}
          style={b.bannerStyle}
          onCta={() => onCta(b)}
          onDismiss={() => dismiss(b)}
        />
      ))}
    </div>
  );
}
