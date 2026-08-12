import type { ReactNode } from 'react';
import { STRINGS } from '../lib/strings';

export interface ToggleProps {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Text shown next to the switch so state is never conveyed by colour alone. */
  onText?: string;
  offText?: string;
  accessibleLabel: string;
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
  onText = STRINGS.yes,
  offText = STRINGS.no,
  accessibleLabel,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={accessibleLabel}
      onClick={() => onChange(!checked)}
      className={[
        'flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right transition-colors',
        checked ? 'border-gold bg-gold-soft/20' : 'border-line bg-raised',
      ].join(' ')}
    >
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-base text-ink">{label}</span>
        {hint ? <span className="text-xs text-ink-dim">{hint}</span> : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={checked ? 'text-sm font-bold text-gold' : 'text-sm text-ink-dim'}>
          {checked ? onText : offText}
        </span>
        <span
          aria-hidden="true"
          className={[
            'relative h-7 w-12 rounded-full border transition-colors',
            checked ? 'border-gold bg-gold' : 'border-line bg-night',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full transition-all duration-150',
              checked ? 'right-0.5 bg-night' : 'right-6 bg-ink-dim',
            ].join(' ')}
          />
        </span>
      </span>
    </button>
  );
}

export interface ChoiceProps {
  legend: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

/** Two-option yes/no control built as a radio group. */
export function YesNoChoice({
  legend,
  value,
  onChange,
  yesLabel = STRINGS.yes,
  noLabel = STRINGS.no,
}: ChoiceProps) {
  return (
    <div role="radiogroup" aria-label={legend} className="flex gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        onClick={() => onChange(true)}
        className={[
          'min-h-12 flex-1 rounded-xl border px-4 py-3 text-base transition-colors',
          value === true
            ? 'border-gold bg-gold text-night font-bold'
            : 'border-line bg-raised text-ink',
        ].join(' ')}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === false}
        onClick={() => onChange(false)}
        className={[
          'min-h-12 flex-1 rounded-xl border px-4 py-3 text-base transition-colors',
          value === false
            ? 'border-ink bg-ink text-night font-bold'
            : 'border-line bg-raised text-ink',
        ].join(' ')}
      >
        {noLabel}
      </button>
    </div>
  );
}
