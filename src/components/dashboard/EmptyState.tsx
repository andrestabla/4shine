import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Estado vacío reutilizable. Compatible hacia atrás: `<EmptyState message="..." />`
 * sigue funcionando. Opcionalmente acepta ícono, título y una acción (CTA) para
 * convertir un "no hay nada" frío en una salida clara (auditoría UX B4).
 */
export function EmptyState({
  message,
  title,
  icon: Icon,
  action,
}: {
  message: string;
  title?: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.15rem] border border-dashed border-[var(--app-border-strong)] bg-[rgba(255,255,255,0.82)] p-6 text-center text-sm leading-relaxed text-[var(--app-muted)] shadow-[var(--app-shadow-soft)] sm:p-10">
      {Icon && (
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--app-surface-muted)", color: "var(--app-muted)" }}
        >
          <Icon size={20} />
        </span>
      )}
      {title && <p className="text-sm font-bold text-[var(--app-ink)]">{title}</p>}
      <p>{message}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex items-center rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 inline-flex items-center rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
