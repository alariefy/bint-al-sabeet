import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gold text-night border-gold hover:bg-[#d8b23a] active:bg-[#b8931f] font-bold',
  secondary: 'bg-raised text-ink border-line hover:border-gold-soft active:bg-surface',
  ghost: 'bg-transparent text-ink-dim border-transparent hover:text-ink active:bg-surface',
  danger: 'bg-transparent text-bad border-line hover:border-bad active:bg-surface',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 py-3',
        'text-base leading-tight transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
