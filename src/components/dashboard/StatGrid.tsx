import React from "react";

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  const accents = [
    "from-[#4f2360] to-[#8d5ca6]",
    "from-[#7a4a8e] to-[#e0a1c9]",
    "from-[#5f4b9f] to-[#b698d7]",
    "from-[#c58ab6] to-[#efc3d8]",
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <article
          key={stat.label}
          className="min-w-0 rounded-[22px] border border-[var(--app-border)] bg-white/90 p-5 shadow-[0_14px_30px_rgba(55,32,80,0.05)]"
        >
          <div
            className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${accents[index % accents.length]}`}
          />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
            {stat.label}
          </p>
          <p className="mt-4 text-[1.9rem] font-semibold leading-none text-[var(--app-ink)] sm:text-[2.15rem]">
            {stat.value}
          </p>
          {stat.hint && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
              {stat.hint}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
