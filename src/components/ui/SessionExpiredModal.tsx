'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { SESSION_IDLE_TIMEOUT_MESSAGE, SESSION_IDLE_TIMEOUT_TITLE } from '@/lib/session-timeout';

interface Props {
  onConfirm: () => void;
}

export function SessionExpiredModal({ onConfirm }: Props) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-message"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">4Shine</p>
          <h2 id="session-expired-title" className="text-lg font-bold text-slate-900">
            {SESSION_IDLE_TIMEOUT_TITLE}
          </h2>
          <p id="session-expired-message" className="text-sm text-slate-600 mt-2 leading-relaxed">
            {SESSION_IDLE_TIMEOUT_MESSAGE}
          </p>
        </div>
        <div className="px-6 pb-6">
          <button
            ref={buttonRef}
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Iniciar sesión nuevamente
          </button>
        </div>
      </div>
    </div>
  );
}
