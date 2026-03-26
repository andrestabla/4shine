import React from "react";

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  const accents = [
    "from-[#4f2360] to-[#7c5f93]",
    "from-[#6d4a84] to-[#caa2c7]",
    "from-[#5f4b9f] to-[#a99dd1]",
    "from-[#b687b4] to-[#e4c4da]",
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <article
          key={stat.label}
          className="app-panel min-w-0 p-5"
        >
          <div
            className={`mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r ${accents[index % accents.length]}`}
          />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
            {stat.label}
          </p>
          <p className="mt-3 text-[1.8rem] font-semibold leading-none text-[var(--app-ink)] sm:text-[2.05rem]">
            {stat.value}
          </p>
          {stat.hint && (
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--app-muted)]">
              {stat.hint}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
