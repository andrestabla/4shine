import React from "react";

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  const surfaces = [
    "from-[rgba(255,255,255,0.96)] via-[rgba(255,255,255,0.92)] to-[rgba(244,236,255,0.92)]",
    "from-[rgba(255,255,255,0.96)] via-[rgba(248,240,255,0.92)] to-[rgba(245,183,209,0.18)]",
    "from-[rgba(255,255,255,0.96)] via-[rgba(239,230,255,0.68)] to-[rgba(255,255,255,0.96)]",
    "from-[rgba(255,255,255,0.96)] via-[rgba(255,248,252,0.9)] to-[rgba(241,231,255,0.94)]",
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`min-w-0 rounded-[20px] border border-[var(--app-border)] bg-gradient-to-br p-4 shadow-[0_16px_40px_rgba(55,32,80,0.06)] sm:p-5 ${surfaces[index % surfaces.length]}`}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
            {stat.label}
          </p>
          <p className="mt-3 text-2xl font-black text-[var(--app-ink)] sm:text-[2rem]">
            {stat.value}
          </p>
          {stat.hint && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--app-muted)]">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
