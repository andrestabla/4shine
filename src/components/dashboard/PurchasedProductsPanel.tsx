"use client";

import React from "react";
import { Package, Sparkles, Shield, CalendarClock, Info, ArchiveRestore } from "lucide-react";
import { formatDate as formatDateCanonical } from "@/lib/format-date";
import type { UserPurchaseRecord } from "@/features/access/types";

/**
 * Productos del catálogo histórico que ya no son planes vendibles. Sus
 * compras quedan archivadas y los accesos se conservan, pero la fuente
 * de verdad para suscripciones pasa a ser app_billing.subscription_plans
 * (lo configurado en /dashboard/administracion/planes).
 *
 * Para agregar nuevos legacy basta con incluirlos en este set.
 */
const LEGACY_PRODUCT_CODES = new Set<string>(["program_4shine"]);

function isLegacyProgramPurchase(
  purchase: UserPurchaseRecord,
  hasActivePlan: boolean,
): boolean {
  if (!hasActivePlan) return false;
  if (LEGACY_PRODUCT_CODES.has(purchase.productCode)) return true;
  // Cualquier compra del grupo 'program' queda relegada a histórico
  // cuando el usuario ya tiene un plan asignado en subscription_plans.
  return purchase.productGroup === "program";
}

export interface ActivePlanSummary {
  planId: string;
  planCode: string;
  planGroup: string | null;
  name: string;
  highlightLabel: string | null;
  priceAmount: number | null;
  currencyCode: string | null;
  expiresAt: string | null;
}

interface PurchasedProductsPanelProps {
  purchases: UserPurchaseRecord[];
  primaryRole: string;
  planType: string | null;
  activePlan?: ActivePlanSummary | null;
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

function planGroupLabel(group: string | null): string {
  if (group === "program") return "Programa";
  if (group === "circulo") return "Círculo";
  if (group === "custom") return "Personalizado";
  return "Plan";
}

function userTypeSummary(
  role: string,
  planType: string | null,
  activePlanName: string | null,
): { label: string; detail: string } {
  if (role === "invitado") {
    return {
      label: "Invitado",
      detail: "Acceso exclusivo al módulo de Descubrimiento.",
    };
  }
  if (role === "lider") {
    if (activePlanName) {
      return {
        label: "Líder con suscripción",
        detail: `Plan activo: ${activePlanName}. El acceso a cada módulo se rige por las directivas configuradas para este plan en /administracion/planes.`,
      };
    }
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
        "Sin plan de programa activo. El acceso se limita a los productos puntuales contratados que aparecen abajo.",
    };
  }
  if (role === "mentor") {
    return { label: "Advisor", detail: "Acompañamiento a líderes." };
  }
  if (role === "gestor") {
    return { label: "Gestor", detail: "Gestión operativa de la plataforma." };
  }
  if (role === "admin") {
    return { label: "Administrador", detail: "Acceso completo al panel." };
  }
  return { label: role, detail: "" };
}

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateCanonical(value);
}

export function PurchasedProductsPanel({
  purchases,
  primaryRole,
  planType,
  activePlan,
  emptyHint,
}: PurchasedProductsPanelProps) {
  const summary = userTypeSummary(primaryRole, planType, activePlan?.name ?? null);
  const hasActivePlan = !!activePlan;

  const { vigentes, archivadas } = React.useMemo(() => {
    const v: UserPurchaseRecord[] = [];
    const a: UserPurchaseRecord[] = [];
    for (const purchase of purchases) {
      if (isLegacyProgramPurchase(purchase, hasActivePlan)) {
        a.push(purchase);
      } else {
        v.push(purchase);
      }
    }
    return { vigentes: v, archivadas: a };
  }, [purchases, hasActivePlan]);

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

      {activePlan && (
        <div className="mt-4 overflow-hidden rounded-[14px] border border-[var(--brand-primary)]/30 bg-gradient-to-br from-[var(--brand-primary)]/5 via-white to-[var(--brand-accent)]/10 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  <Sparkles size={11} />
                  Plan activo
                </span>
                {activePlan.highlightLabel && (
                  <span className="rounded-full bg-[var(--brand-accent)]/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                    {activePlan.highlightLabel}
                  </span>
                )}
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--app-muted)] ring-1 ring-[var(--app-border)]">
                  {planGroupLabel(activePlan.planGroup)}
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-[var(--app-ink)]">
                {activePlan.name}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                Código: <code className="font-mono">{activePlan.planCode}</code>
              </p>
              {activePlan.expiresAt && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]">
                  <CalendarClock size={12} />
                  Vigente hasta {formatDate(activePlan.expiresAt)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-[var(--brand-primary)]">
                {formatMoney(activePlan.priceAmount, activePlan.currencyCode)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--app-muted)]">
                Precio del plan
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          <Shield size={12} />
          Productos contratados vigentes ({vigentes.length})
        </p>
        <p className="mt-1 text-[11px] text-[var(--app-muted)]">
          Compras puntuales (Diagnóstico, paquetes de mentoría) que se suman a tu plan.
          Lo que ya pagaste se conserva como acceso permanente.
        </p>

        {vigentes.length === 0 ? (
          <p className="mt-2 rounded-[10px] border border-dashed border-[var(--app-border)] p-3 text-xs text-[var(--app-muted)]">
            {emptyHint ?? "Sin productos contratados aún."}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {vigentes.map((purchase) => (
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

        {activePlan && vigentes.length > 0 && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <Info size={12} className="mt-0.5 shrink-0" />
            Tu acceso combina lo que incluye tu plan actual con los productos que
            ya adquiriste.
          </p>
        )}
      </div>

      {archivadas.length > 0 && (
        <div className="mt-5 rounded-[12px] border border-slate-200 bg-slate-50/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <ArchiveRestore size={12} />
            Reemplazados por el plan actual ({archivadas.length})
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Estos productos ya no se venden. Tus accesos quedaron incorporados en el
            plan{" "}
            <strong className="text-slate-700">{activePlan?.name}</strong>.
          </p>
          <ul className="mt-2 space-y-2">
            {archivadas.map((purchase) => (
              <li
                key={`legacy-${purchase.productCode}-${purchase.purchasedAt ?? "na"}`}
                className="rounded-[10px] border border-slate-200 bg-white p-3 opacity-80"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {purchase.productName}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                        Reemplazado por plan
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                        Legacy
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Código: <code className="font-mono">{purchase.productCode}</code>
                      {purchase.sessionsIncluded
                        ? ` · ${purchase.sessionsIncluded} sesión${purchase.sessionsIncluded === 1 ? "" : "es"} incluida${purchase.sessionsIncluded === 1 ? "" : "s"}`
                        : ""}
                    </p>
                    {purchase.source && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Origen original: {purchase.source.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-600">
                      {formatMoney(purchase.priceAmount, purchase.currencyCode)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(purchase.purchasedAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
