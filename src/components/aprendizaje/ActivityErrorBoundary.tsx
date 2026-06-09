'use client';

import React from 'react';

interface State {
  error: Error | null;
}

export class ActivityErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ActivityPlayer] crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <section className="app-panel border-2 border-rose-200 bg-rose-50 p-5">
          <p className="mb-2 text-sm font-bold text-rose-900">Error al renderizar la actividad</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-[10px] border border-rose-200 bg-white p-3 text-xs text-rose-900">
            {this.state.error.message}
            {this.state.error.stack ? `\n\n${this.state.error.stack.split('\n').slice(0, 8).join('\n')}` : ''}
          </pre>
          <button
            type="button"
            className="mt-3 rounded-[10px] bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
