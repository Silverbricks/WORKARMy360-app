'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean;
}

/** Password field with a show/hide eye toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { invalid, className, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 pr-10 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          invalid
            ? 'border-[#DC2626] focus-visible:ring-[#DC2626]'
            : 'border-[#E5E7EB] focus-visible:ring-[color:var(--accent)]',
          className,
        )}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[#94A3B8] transition hover:text-[#64748B]"
      >
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
});
