import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-lg border bg-white px-3 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        invalid
          ? 'border-[#DC2626] focus-visible:ring-[#DC2626]'
          : 'border-[#E5E7EB] focus-visible:ring-[color:var(--accent)]',
        className,
      )}
      {...rest}
    />
  );
});
