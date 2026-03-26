import React from "react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.15rem] border border-dashed border-[var(--app-border-strong)] bg-[rgba(255,255,255,0.82)] p-6 text-center text-sm leading-relaxed text-[var(--app-muted)] shadow-[var(--app-shadow-soft)] sm:p-10">
      {message}
    </div>
  );
}
