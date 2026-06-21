import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'error' | 'success' | 'info' | 'warning';

const tones: Record<Tone, string> = {
  error: 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]',
  success: 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]',
  info: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]',
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
};

export interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', children, className }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone], className)}
    >
      {children}
    </div>
  );
}
