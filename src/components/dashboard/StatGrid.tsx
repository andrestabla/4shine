import React from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
          <p className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">{stat.value}</p>
          {stat.hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
