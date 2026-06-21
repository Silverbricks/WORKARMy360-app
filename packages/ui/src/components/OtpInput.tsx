'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from './cn';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid = false,
  autoFocus = false,
  disabled = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  function setChar(index: number, char: string) {
    const next = chars.slice();
    next[index] = char;
    onChange(next.join('').slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setChar(index, digit);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[index] && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div
      className={cn('flex gap-2', invalid && 'animate-[wa-shake_0.4s_ease-in-out]')}
      onPaste={handlePaste}
    >
      {chars.map((char, i) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={char}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            'h-12 w-12 rounded-lg border bg-white text-center text-lg font-semibold text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            invalid
              ? 'border-[#DC2626] focus-visible:ring-[#DC2626]'
              : 'border-[#E5E7EB] focus-visible:ring-[color:var(--accent)]',
          )}
        />
      ))}
    </div>
  );
}
