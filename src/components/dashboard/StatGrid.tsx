import React from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stat.value}</p>
          {stat.hint && <p className="text-xs text-slate-500 mt-2">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
