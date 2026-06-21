import type { ReactNode } from 'react';

export interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + control + error/hint. Labels are always visible (never placeholder-only). */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#1E293B]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-[#64748B]">{hint}</p>
      ) : null}
    </div>
  );
}
