'use client';

import { type FormEvent, useState } from 'react';
import { Alert, Button, Field, Input } from '@workarmy/ui';
import { ForgotPasswordSchema } from '@workarmy/validation';
import { api } from '@/lib/api';
import { zodFieldErrors, type FieldErrors } from '@/lib/form';

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(parsed.data);
    } catch {
      // never reveal whether the email exists
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  }

  if (sent) return <Alert tone="success">If that email exists, a reset link is on its way.</Alert>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field id="email" label="Work email" error={errors.email}>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} autoComplete="email" />
      </Field>
      <Button type="submit" fullWidth loading={submitting}>
        Send reset link
      </Button>
    </form>
  );
}
