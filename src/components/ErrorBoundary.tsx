import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { STRINGS } from '../lib/strings';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Arabic fatal fallback. Never shows an English stack trace to the user. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="safe-x flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-ink">{STRINGS.fatalTitle}</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-dim">{STRINGS.fatalBody}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-12 rounded-xl border border-gold bg-gold px-6 py-3 font-bold text-night"
        >
          {STRINGS.fatalReload}
        </button>
      </div>
    );
  }
}
