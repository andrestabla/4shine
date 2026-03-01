import React from 'react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
      {message}
    </div>
  );
}
