import { Button } from './Button';
import { STRINGS } from '../lib/strings';
import type { Toast as ToastModel } from '../hooks/useGame';

const TONE_CLASS = {
  info: 'border-line bg-raised text-ink',
  success: 'border-good bg-surface text-ink',
  error: 'border-bad bg-surface text-ink',
} as const;

const TONE_PREFIX = {
  info: '',
  success: '',
  error: '',
} as const;

export function ToastHost({
  toast,
  onDismiss,
}: {
  toast: ToastModel | null;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={STRINGS.liveRegionLabel}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toast ? (
        <div
          className={[
            'pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-xl',
            TONE_CLASS[toast.tone],
          ].join(' ')}
        >
          <p className="text-sm leading-relaxed">
            {TONE_PREFIX[toast.tone]}
            {toast.message}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {toast.actionLabel && toast.onAction ? (
              <Button
                variant="secondary"
                className="min-h-10 px-3 py-1 text-sm"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
              >
                {toast.actionLabel}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              aria-label={STRINGS.close}
              className="min-h-10 px-3 py-1 text-sm"
              onClick={onDismiss}
            >
              <span aria-hidden="true">×</span>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
