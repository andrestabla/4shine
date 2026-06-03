"use client";

import React from "react";
import { Package } from "lucide-react";
import type { UserPurchaseRecord } from "@/features/access/types";

interface PurchasedProductsPanelProps {
  purchases: UserPurchaseRecord[];
  primaryRole: string;
  planType: string | null;
  emptyHint?: string;
}

function productGroupLabel(group: UserPurchaseRecord["productGroup"]): string {
  switch (group) {
    case "program":
      return "Programa";
    case "discovery":
      return "Diagnóstico";
    case "mentoring_pack":
      return "Pack de mentorías";
    default:
      return group;
  }
}

function userTypeSummary(role: string, planType: string | null): {
  label: string;
  detail: string;
} {
  if (role === "invitado") {
    return {
      label: "Invitado",
      detail: "Acceso exclusivo al módulo de Descubrimiento.",
    };
  }
  if (role === "lider") {
    const isSubscribed =
      planType === "premium" || planType === "vip" || planType === "empresa_elite";
    if (isSubscribed) {
      return {
        label: "Líder con suscripción",
        detail: "Acceso al programa completo según el plan asignado.",
      };
    }
    return {
      label: "Líder sin suscripción",
      detail:
        "Sin plan de programa activo. Acceso limitado a los productos puntuales contratados (ver lista abajo).",
    };
  }
  if (role === "mentor") {
    return { label: "Adviser", detail: "Acompañamiento a líderes." };
  }
  if (role === "gestor") {
    return { label: "Gestor", detail: "Gestión operativa de la plataforma." };
  }
  if (role === "admin") {
    return { label: "Administrador", detail: "Acceso completo al panel." };
  }
  return { label: role, detail: "" };
}

function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PurchasedProductsPanel({
  purchases,
  primaryRole,
  planType,
  emptyHint,
}: PurchasedProductsPanelProps) {
  const summary = userTypeSummary(primaryRole, planType);

  return (
    <section className="app-panel p-5">
      <div className="flex items-center gap-2">
        <Package size={18} className="text-[var(--brand-primary)]" />
        <h4 className="text-lg font-bold text-[var(--app-ink)]">
          Acceso y productos contratados
        </h4>
      </div>

      <div className="mt-3 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
          Tipo de usuario
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--app-ink)]">{summary.label}</p>
        {summary.detail && (
          <p className="mt-1 text-xs text-[var(--app-muted)] leading-relaxed">
            {summary.detail}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          Productos activos ({purchases.length})
        </p>

        {purchases.length === 0 ? (
          <p className="mt-2 rounded-[10px] border border-dashed border-[var(--app-border)] p-3 text-xs text-[var(--app-muted)]">
            {emptyHint ?? "Aún no hay productos contratados."}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {purchases.map((purchase) => (
              <li
                key={`${purchase.productCode}-${purchase.purchasedAt ?? "na"}`}
                className="rounded-[12px] border border-[var(--app-border)] bg-white p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[var(--app-ink)]">
                        {purchase.productName}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                        Activo
                      </span>
                      <span className="rounded-full bg-[var(--app-chip)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                        {productGroupLabel(purchase.productGroup)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      Código: <code className="font-mono">{purchase.productCode}</code>
                      {purchase.sessionsIncluded
                        ? ` · ${purchase.sessionsIncluded} sesión${purchase.sessionsIncluded === 1 ? "" : "es"} incluida${purchase.sessionsIncluded === 1 ? "" : "s"}`
                        : ""}
                    </p>
                    {purchase.source && (
                      <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                        Origen: {purchase.source.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--app-ink)]">
                      {formatMoney(purchase.priceAmount, purchase.currencyCode)}
                    </p>
                    <p className="text-xs text-[var(--app-muted)]">
                      {formatDate(purchase.purchasedAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
