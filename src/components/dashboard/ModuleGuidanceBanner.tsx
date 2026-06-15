"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type Tone = "brand" | "emerald" | "amber" | "blue" | "slate";

type Cta = { label: string; href: string } | { label: string; onClick: () => void };

interface Props {
  kicker: string;
  title: string;
  message?: string;
  tone?: Tone;
  cta?: Cta;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const TONE: Record<Tone, { panel: string; kicker: string; cta: string }> = {
  brand: {
    panel: "border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5",
    kicker: "text-[var(--brand-primary)]",
    cta: "bg-[var(--brand-primary)] text-white hover:opacity-90",
  },
  emerald: {
    panel: "border-emerald-200 bg-emerald-50",
    kicker: "text-emerald-700",
    cta: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  amber: {
    panel: "border-amber-200 bg-amber-50",
    kicker: "text-amber-700",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
  },
  blue: {
    panel: "border-sky-200 bg-sky-50",
    kicker: "text-sky-700",
    cta: "bg-sky-600 text-white hover:bg-sky-700",
  },
  slate: {
    panel: "border-slate-200 bg-slate-50",
    kicker: "text-slate-700",
    cta: "bg-slate-700 text-white hover:bg-slate-800",
  },
};

export function ModuleGuidanceBanner({ kicker, title, message, tone = "brand", cta, icon: Icon = Sparkles }: Props) {
  const t = TONE[tone];
  const ctaClass =
    "inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold transition whitespace-nowrap " +
    t.cta;

  return (
    <section className={`rounded-[1.15rem] border px-5 py-5 sm:px-6 ${t.panel}`}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 hidden sm:inline-flex ${t.kicker}`}>
            <Icon size={20} />
          </span>
          <div>
            <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${t.kicker}`}>{kicker}</p>
            <h2 className="mt-1.5 text-lg font-black text-[var(--app-ink)] sm:text-xl">{title}</h2>
            {message && <p className="mt-1.5 text-sm leading-relaxed text-[var(--app-muted)]">{message}</p>}
          </div>
        </div>
        {cta &&
          ("href" in cta ? (
            <Link href={cta.href} className={ctaClass}>
              {cta.label}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button type="button" onClick={cta.onClick} className={ctaClass}>
              {cta.label}
              <ArrowRight size={16} />
            </button>
          ))}
      </div>
    </section>
  );
}
