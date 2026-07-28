"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { getActivePopups, type PublicPopup, type BannerStyle } from "@/features/popups/client";
import { isSuppressed, markSeen } from "@/components/popups/PopupRuntime";
import { useUser } from "@/context/UserContext";

/** Sustituye {{nombre}} por el nombre del usuario; sin nombre, limpia la coma sobrante. */
export function applyNombre(text: string, name: string): string {
  if (!text) return text;
  if (name) return text.replace(/\{\{\s*nombre\s*\}\}/gi, name);
  return text.replace(/,?\s*\{\{\s*nombre\s*\}\}/gi, "").trim();
}

// ─── Tarjeta presentacional del banner (reutilizada por el preview admin) ────

// 'custom' se resuelve en BannerCard a partir de los colores del builder.
const STYLES: Record<
  Exclude<BannerStyle, 'custom'>,
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

export interface BannerVisualOverrides {
  bgStart?: string;
  bgEnd?: string;
  textColor?: string;
  ctaColor?: string;
  imageUrl?: string;
  minHeight?: number;
}

export function BannerCard({
  title,
  message,
  ctaLabel,
  ctaUrl,
  kicker = "",
  style = "brand",
  visuals,
  onCta,
  onDismiss,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  kicker?: string;
  style?: BannerStyle;
  visuals?: BannerVisualOverrides;
  onCta?: () => void;
  onDismiss?: () => void;
}) {
  const base = STYLES[style === "custom" ? "brand" : style] ?? STYLES.brand;
  // Estilo 'custom': los colores del builder mandan (con fallback de marca).
  const v =
    style === "custom"
      ? {
          ...base,
          bg: `linear-gradient(120deg, ${visuals?.bgStart || "var(--brand-primary)"}, ${
            visuals?.bgEnd || visuals?.bgStart || "var(--brand-primary)"
          })`,
          border: `1px solid color-mix(in srgb, ${visuals?.ctaColor || "var(--brand-accent)"} 45%, transparent)`,
          title: visuals?.textColor || "#ffffff",
          text: `color-mix(in srgb, ${visuals?.textColor || "#ffffff"} 78%, transparent)`,
          chipBg: `color-mix(in srgb, ${visuals?.ctaColor || "var(--brand-accent)"} 22%, transparent)`,
          chipColor: visuals?.ctaColor || "var(--brand-accent)",
          cta: visuals?.ctaColor || "var(--brand-accent)",
          ctaText: visuals?.textColor && visuals?.bgStart ? visuals.bgStart : "var(--brand-on-accent, #0D1B2A)",
          dismiss: `color-mix(in srgb, ${visuals?.textColor || "#ffffff"} 60%, transparent)`,
        }
      : base;

  // Imagen de fondo: cover + velo del degradado para mantener la legibilidad.
  const overlayA =
    style === "custom" && visuals?.bgStart
      ? `color-mix(in srgb, ${visuals.bgStart} 82%, transparent)`
      : "color-mix(in srgb, var(--brand-primary) 78%, transparent)";
  const overlayB =
    style === "custom" && (visuals?.bgEnd || visuals?.bgStart)
      ? `color-mix(in srgb, ${visuals.bgEnd || visuals.bgStart} 38%, transparent)`
      : "color-mix(in srgb, var(--brand-primary) 30%, transparent)";
  const background = visuals?.imageUrl
    ? `linear-gradient(120deg, ${overlayA}, ${overlayB}), url("${visuals.imageUrl}") center / cover no-repeat`
    : v.bg;
  const minHeight = visuals?.minHeight && visuals.minHeight > 0 ? `${visuals.minHeight}px` : undefined;
  // Modo hero (altura >= 200): tipografía grande y contenido apilado, como los
  // heros del Inicio. Debajo de eso, formato de franja compacta.
  const isHero = (visuals?.minHeight ?? 0) >= 200;

  if (isHero) {
    return (
      <div
        className="relative flex flex-col justify-center gap-1 overflow-hidden rounded-[1.5rem] px-7 py-7 shadow-lg sm:px-9 sm:py-8"
        style={{ background, border: v.border, minHeight }}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-full p-1 transition hover:opacity-80"
            style={{ color: v.dismiss }}
          >
            <X size={16} />
          </button>
        )}
        {kicker && (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.28em]" style={{ color: v.text }}>
            {kicker}
          </p>
        )}
        {title && (
          <h2 className="mt-1 max-w-xl whitespace-pre-line text-[1.85rem] font-black leading-tight sm:text-[2.1rem]" style={{ color: v.title }}>
            {title}
          </h2>
        )}
        {message && (
          <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: v.text }}>
            {message}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5"
              style={{ background: v.cta, color: v.ctaText }}
            >
              {ctaLabel}
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-[18px] p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-5"
      style={{
        background,
        border: v.border,
        minHeight,
        color: visuals?.imageUrl ? "#ffffff" : undefined,
      }}
    >
      <div
        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] sm:flex"
        style={{ background: v.chipBg, color: v.chipColor }}
      >
        <Sparkles size={20} />
      </div>
      <div className="min-w-0 flex-1 pr-7 sm:pr-0">
        {kicker && (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: v.text }}>
            {kicker}
          </p>
        )}
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
  const { currentUser } = useUser();
  const firstName = (currentUser?.name ?? "").split(" ")[0] ?? "";
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
          kicker={applyNombre(b.bannerKicker, firstName)}
          title={applyNombre(b.title, firstName)}
          message={applyNombre(b.message, firstName)}
          ctaLabel={b.ctaLabel}
          ctaUrl={b.ctaUrl}
          style={b.bannerStyle}
          visuals={{
            bgStart: b.bannerBgStart,
            bgEnd: b.bannerBgEnd,
            textColor: b.bannerTextColor,
            ctaColor: b.bannerCtaColor,
            imageUrl: b.bannerImageUrl,
            minHeight: b.bannerMinHeight,
          }}
          onCta={() => onCta(b)}
          onDismiss={() => dismiss(b)}
        />
      ))}
    </div>
  );
}
