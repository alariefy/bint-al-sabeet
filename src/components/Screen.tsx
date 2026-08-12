import type { ReactNode } from 'react';
import { Button } from './Button';
import { STRINGS } from '../lib/strings';

export interface ScreenProps {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  /** Sticky footer holding the primary action within thumb reach. */
  footer?: ReactNode;
}

export function Screen({
  title,
  subtitle,
  onBack,
  backLabel = STRINGS.back,
  children,
  footer,
}: ScreenProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="safe-top safe-x pb-3">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} className="mb-1 px-2">
            <span aria-hidden="true">→</span>
            {backLabel}
          </Button>
        ) : null}
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-ink-dim">{subtitle}</p> : null}
      </header>

      <main
        aria-label={STRINGS.mainLandmark}
        className="safe-x flex-1 pb-6"
        style={footer ? { paddingBottom: '1.5rem' } : undefined}
      >
        {children}
      </main>

      {footer ? (
        <div className="safe-x safe-bottom sticky bottom-0 border-t border-line bg-night/95 pt-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'li';
}) {
  return (
    <Tag
      className={['rounded-card border border-line bg-surface p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-sm font-bold tracking-wide text-ink-dim">{children}</h2>;
}
