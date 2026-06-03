"use client";

import Link from "next/link";
import { ArrowRight, Lock, type LucideIcon } from "lucide-react";

interface ModuleLockedScreenProps {
  /** Nombre visible del módulo: "Aprendizaje", "Mentorías", etc. */
  moduleName: string;
  /** Ícono del módulo (lucide-react). */
  icon: LucideIcon;
  /** Una o dos frases que describen para qué sirve el módulo. */
  description: string;
  /** Lista corta (3-5 ítems) de lo que el usuario podrá hacer cuando lo desbloquee. */
  features: string[];
  /** Texto opcional al pie, debajo del CTA. */
  footnote?: string;
}

/**
 * Pantalla mostrada a un usuario (líder sin suscripción / invitado promovido)
 * cuando intenta acceder a un módulo que no tiene contratado.
 *
 * Reglas de diseño:
 * - Describe qué es el módulo y qué se desbloquea al comprar.
 * - NO sugiere un plan específico ni muestra precios.
 * - Un único CTA: "Ver planes y precios" → /planes-precios.
 */
export function ModuleLockedScreen({
  moduleName,
  icon: Icon,
  description,
  features,
  footnote,
}: ModuleLockedScreenProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="app-panel overflow-hidden">
        {/* Cabecera con icono y badge */}
        <div
          className="relative px-6 py-10 sm:px-10 sm:py-12 text-white"
          style={{
            background:
              "linear-gradient(140deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 70%, #1e293b) 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-white/75">
            <Lock size={14} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em]">
              Módulo bloqueado
            </span>
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
              <Icon size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {moduleName} aún no está disponible para tu cuenta
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo: lo que desbloqueas + CTA */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
            Qué desbloquearás al activar tu plan
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3"
              >
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
                <span className="text-sm leading-relaxed text-[var(--app-ink)]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/planes-precios"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: "var(--brand-primary)" }}
            >
              Ver planes y precios
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-[var(--app-muted)]">
              Elige el plan que mejor se adapte a ti y desbloquéalo al instante.
            </p>
          </div>

          {footnote ? (
            <p className="mt-6 border-t border-[var(--app-border)] pt-5 text-xs leading-relaxed text-[var(--app-muted)]">
              {footnote}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
