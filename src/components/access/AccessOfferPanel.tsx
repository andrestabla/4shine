"use client";

import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import type { CommercialProductRecord } from "@/features/access/types";

interface AccessOfferPanelProps {
  badge?: string;
  title: string;
  description: string;
  products: CommercialProductRecord[];
  note?: string;
  primaryAction?: {
    href: string;
    label: string;
  };
}

function formatProductPrice(product: CommercialProductRecord): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currencyCode,
    maximumFractionDigits: 0,
  }).format(product.priceAmount);
}

export function AccessOfferPanel({
  badge = "Acceso comercial",
  title,
  description,
  products,
  note,
  primaryAction,
}: AccessOfferPanelProps) {
  const sortedProducts = [...products].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <section className="app-panel overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.95fr)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#4f2360_0%,#6f3d82_58%,#e5a2c7_100%)] px-6 py-7 text-white sm:px-7 sm:py-8">
          <div className="absolute inset-y-0 right-[18%] hidden w-20 bg-white/25 blur-3xl md:block" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-white/76">
              <Lock size={15} />
              <span className="text-xs font-black uppercase tracking-[0.24em]">
                {badge}
              </span>
            </div>
            <h3
              className="app-display-title mt-4 text-[2.4rem] font-semibold leading-[0.95] text-white md:text-[3.1rem]"
              data-display-font="true"
            >
              {title}
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/84 md:text-base">
              {description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {sortedProducts.map((product) => (
                <span
                  key={product.productCode}
                  className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold text-white/92"
                >
                  {product.name} · {formatProductPrice(product)}
                </span>
              ))}
            </div>

            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="mt-7 inline-flex items-center gap-2 rounded-[16px] bg-white px-5 py-3 text-sm font-extrabold text-[#4f2360] transition hover:translate-x-0.5"
              >
                {primaryAction.label}
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 bg-[rgba(255,255,255,0.68)] p-5 sm:p-6">
          {sortedProducts.map((product) => (
            <article
              key={product.productCode}
              className="rounded-[18px] border border-[var(--app-border)] bg-white/88 p-4 shadow-[0_16px_34px_rgba(55,32,80,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold text-[var(--app-ink)]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    {product.headline}
                  </p>
                </div>
                <span className="text-sm font-black text-[var(--app-ink)]">
                  {formatProductPrice(product)}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
                {product.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {product.highlightLabel ? (
                  <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs font-semibold text-[var(--app-ink)]">
                    {product.highlightLabel}
                  </span>
                ) : null}
                {product.sessionsIncluded > 0 ? (
                  <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                    {product.sessionsIncluded} sesiones incluidas
                  </span>
                ) : null}
              </div>
            </article>
          ))}

          {note ? (
            <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm leading-relaxed text-[var(--app-muted)]">
              <div className="flex items-center gap-2 text-[var(--app-ink)]">
                <Sparkles size={16} className="text-[var(--brand-primary)]" />
                <span className="font-semibold">Qué puedes activar</span>
              </div>
              <p className="mt-2">{note}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
