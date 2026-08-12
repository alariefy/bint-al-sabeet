/**
 * Accessible application dialog. Replaces window.confirm entirely: focus moves
 * in on open, stays inside while open, and returns to the trigger on close.
 */

import { useCallback, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { STRINGS } from '../lib/strings';

export interface DialogProps {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = STRINGS.cancel,
  destructive = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onCancel],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl safe-bottom"
      >
        <h2 id={titleId} className="text-lg font-bold text-ink">
          {title}
        </h2>
        {body ? (
          <div id={bodyId} className="mt-2 text-sm leading-relaxed text-ink-dim">
            {body}
          </div>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <Button variant={destructive ? 'danger' : 'primary'} block onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" block onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
