/**
 * Integer stepper exposed to assistive technology as a spinbutton with an
 * Arabic name and an Arabic spoken value.
 */

import { formatCount } from '../lib/format';
import { STRINGS } from '../lib/strings';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  valueText: string;
  onChange: (next: number) => void;
}

export function Stepper({ label, value, min, max, valueText, onChange }: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      if (canIncrease) {
        event.preventDefault();
        onChange(value + 1);
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      if (canDecrease) {
        event.preventDefault();
        onChange(value - 1);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      onChange(min);
    } else if (event.key === 'End') {
      event.preventDefault();
      onChange(max);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`${STRINGS.removeHeart}: ${label}`}
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
        className="h-12 w-12 shrink-0 rounded-xl border border-line bg-raised text-2xl leading-none text-ink transition-colors disabled:opacity-35"
      >
        <span aria-hidden="true">−</span>
      </button>

      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        onKeyDown={handleKeyDown}
        className="num flex h-12 min-w-16 flex-1 items-center justify-center rounded-xl border border-line bg-night text-2xl font-bold text-ink"
      >
        {formatCount(value)}
      </div>

      <button
        type="button"
        aria-label={`${STRINGS.addHeart}: ${label}`}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
        className="h-12 w-12 shrink-0 rounded-xl border border-line bg-raised text-2xl leading-none text-ink transition-colors disabled:opacity-35"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
