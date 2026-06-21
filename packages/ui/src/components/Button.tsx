import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const variants: Record<Variant, string> = {
  // primary background comes from var(--accent) via inline style
  primary: 'text-white shadow-sm hover:brightness-95 focus-visible:ring-[color:var(--accent)]',
  secondary:
    'border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F8FAFC] focus-visible:ring-[color:var(--accent)]',
  ghost: 'text-[#1E293B] hover:bg-[#F1F5F9] focus-visible:ring-[color:var(--accent)]',
  danger: 'bg-[#DC2626] text-white hover:brightness-95 focus-visible:ring-[#DC2626]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, style, ...rest },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';
  const accentStyle = variant === 'primary' ? { backgroundColor: 'var(--accent)', ...style } : style;
  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], fullWidth && 'w-full', className)}
      style={accentStyle}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Icon name="spinner" className="animate-spin" /> : children}
    </button>
  );
});
