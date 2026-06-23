'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Field, PasswordInput } from '@workarmy/ui';
import { ResetPasswordSchema } from '@workarmy/validation';
import { api } from '@/lib/api';
import { errorMessage, zodFieldErrors, type FieldErrors } from '@/lib/form';

export function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = ResetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.auth.resetPassword(parsed.data);
      setDone(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success">Your password has been updated. You can log in now.</Alert>
        <Link href="/login" className="block text-center text-sm" style={{ color: 'var(--accent)' }}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      {!token ? <Alert tone="warning">This reset link is missing its token.</Alert> : null}
      <Field id="password" label="New password" error={errors.password}>
        <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} autoComplete="new-password" />
      </Field>
      <Button type="submit" fullWidth loading={submitting} disabled={!token}>
        Update password
      </Button>
    </form>
  );
}
