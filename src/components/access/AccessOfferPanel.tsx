"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  CommercialProductCode,
  CommercialProductRecord,
} from "@/features/access/types";

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

const PRODUCT_ACTIONS: Record<
  CommercialProductCode,
  { href: string; label: string }
> = {
  program_4shine: {
    href: "/dashboard/trayectoria",
    label: "Ver programa",
  },
  discovery_4shine: {
    href: "/dashboard/descubrimiento",
    label: "Ver diagnóstico",
  },
  mentoring_pack_1: {
    href: "/dashboard/mentorias",
    label: "Ver mentorías",
  },
  mentoring_pack_3: {
    href: "/dashboard/mentorias",
    label: "Ver mentorías",
  },
  mentoring_pack_5: {
    href: "/dashboard/mentorias",
    label: "Ver mentorías",
  },
};

function formatProductPrice(product: CommercialProductRecord): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currencyCode,
    maximumFractionDigits: 0,
  }).format(product.priceAmount);
}

function formatCatalogFromPrice(products: CommercialProductRecord[]): string {
  const minimumPrice = Math.min(...products.map((product) => product.priceAmount));
  const baseProduct =
    products.find((product) => product.priceAmount === minimumPrice) ?? products[0];

  if (!baseProduct) {
    return "N/A";
  }

  return `Desde ${formatProductPrice(baseProduct)}`;
}

function resolveProductAccent(product: CommercialProductRecord): {
  surfaceClassName: string;
  icon: typeof Sparkles;
  eyebrow: string;
  footer: string;
} {
  if (product.productGroup === "program") {
    return {
      surfaceClassName:
        "border-[rgba(103,61,127,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,238,255,0.94)_100%)]",
      icon: Star,
      eyebrow: product.highlightLabel ?? "Programa principal",
      footer: "Desbloquea la experiencia integral 4Shine.",
    };
  }

  if (product.productGroup === "discovery") {
    return {
      surfaceClassName:
        "border-[rgba(177,133,212,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,242,255,0.94)_100%)]",
      icon: Compass,
      eyebrow: product.highlightLabel ?? "Acceso puntual",
      footer: "Ideal para conocer tu punto de partida.",
    };
  }

  return {
    surfaceClassName:
      "border-[rgba(222,169,200,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,245,251,0.94)_100%)]",
    icon: CalendarDays,
    eyebrow: product.highlightLabel ?? "Sesiones adicionales",
    footer: "Acompañamiento flexible con iShiners.",
  };
}

function buildProductMeta(product: CommercialProductRecord): string[] {
  const meta: string[] = [];

  if (product.sessionsIncluded > 0) {
    meta.push(`${product.sessionsIncluded} sesiones incluidas`);
  }

  if (product.productGroup === "program") {
    meta.push("Ruta integral");
  } else if (product.productGroup === "discovery") {
    meta.push("Compra individual");
  } else {
    meta.push("Pack adicional");
  }

  return meta;
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
  const featuredProduct =
    sortedProducts.find((product) => product.productGroup === "program") ??
    sortedProducts[0] ??
    null;

  return (
    <section className="app-panel overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,#472159_0%,#69397e_52%,#dfa8c8_100%)] px-6 py-6 text-white sm:px-7 sm:py-7">
          <div className="absolute inset-y-0 right-[16%] hidden w-24 bg-white/20 blur-3xl md:block" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/74">
              <Lock size={15} />
              <span className="text-[11px] font-black uppercase tracking-[0.28em]">
                {badge}
              </span>
            </div>

            <h3
              className="app-display-title mt-4 max-w-xl text-[2.15rem] font-semibold leading-[0.96] text-white md:text-[2.85rem]"
              data-display-font="true"
            >
              {title}
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/82 md:text-[0.98rem]">
              {description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-white/62">
                  Disponible desde
                </p>
                <p className="mt-2 text-[1.45rem] font-semibold text-white">
                  {formatCatalogFromPrice(sortedProducts)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  Entrada simple para empezar a activar tu experiencia.
                </p>
              </div>

              <div className="rounded-[20px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-white/62">
                  Opciones activables
                </p>
                <p className="mt-2 text-[1.45rem] font-semibold text-white">
                  {sortedProducts.length}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  Planes y compras puntuales organizadas por tipo de acceso.
                </p>
              </div>
            </div>

            {featuredProduct ? (
              <div className="mt-6 rounded-[22px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-white/62">
                  Recomendado
                </p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {featuredProduct.name}
                    </p>
                    <p className="mt-1 text-sm text-white/74">
                      {featuredProduct.headline}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatProductPrice(featuredProduct)}
                  </p>
                </div>
              </div>
            ) : null}

            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#4f2360] transition hover:translate-x-0.5 hover:bg-white/96"
              >
                {primaryAction.label}
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`grid gap-4 ${
              sortedProducts.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {sortedProducts.map((product) => {
              const accent = resolveProductAccent(product);
              const ProductIcon = accent.icon;
              const productAction = PRODUCT_ACTIONS[product.productCode];

              return (
                <article
                  key={product.productCode}
                  className={`group rounded-[22px] border p-5 shadow-[0_18px_34px_rgba(55,32,80,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(55,32,80,0.08)] ${accent.surfaceClassName}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--app-ink)]">
                        <ProductIcon size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                          {accent.eyebrow}
                        </p>
                        <h4 className="mt-3 text-[1.4rem] font-semibold leading-tight text-[var(--app-ink)]">
                          {product.name}
                        </h4>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                          {product.headline}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/88 px-3 py-2 text-right">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                        Precio
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--app-ink)]">
                        {formatProductPrice(product)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-[var(--app-muted)]">
                    {product.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {buildProductMeta(product).map((item) => (
                      <span
                        key={`${product.productCode}-${item}`}
                        className="rounded-full border border-[var(--app-chip-border)] bg-white/88 px-3 py-1 text-xs font-medium text-[var(--app-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                    <p className="text-xs leading-relaxed text-[var(--app-muted)]">
                      {accent.footer}
                    </p>
                    {productAction ? (
                      <Link
                        href={productAction.href}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
                      >
                        {productAction.label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {note ? (
            <div className="rounded-[22px] border border-[var(--app-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,242,255,0.94)_100%)] px-5 py-5">
              <div className="flex items-center gap-2 text-[var(--app-ink)]">
                <Sparkles size={16} className="text-[var(--brand-primary)]" />
                <span className="text-sm font-semibold">Qué desbloqueas</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
                {note}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
