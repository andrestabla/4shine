import React from "react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--app-border-strong)] bg-[rgba(255,255,255,0.74)] p-6 text-center text-sm leading-relaxed text-[var(--app-muted)] shadow-[0_16px_36px_rgba(55,32,80,0.04)] backdrop-blur sm:p-10">
      {message}
    </div>
  );
}
