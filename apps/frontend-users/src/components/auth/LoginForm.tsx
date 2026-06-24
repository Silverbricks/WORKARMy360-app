'use client';

import { type ChangeEvent, type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Field, Input, PasswordInput, t } from '@workarmy/ui';
import { LoginSchema } from '@workarmy/validation';
import { api, setAccessToken, setAuthHint } from '@/lib/api';
import { errorMessage, zodFieldErrors, type FieldErrors } from '@/lib/form';

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/dashboard';
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (name: 'email' | 'password') => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = LoginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Unverified users may log in — they land in the dashboard and the boot OTP
      // gate blocks everything until they verify.
      const res = await api.auth.login(parsed.data);
      setAccessToken(res.accessToken);
      setAuthHint();
      router.push(next);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <Field id="email" label={t('auth.email.label')} error={errors.email}>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={update('email')}
          invalid={!!errors.email}
          autoComplete="email"
        />
      </Field>
      <Field id="password" label={t('auth.password.label')} error={errors.password}>
        <PasswordInput
          id="password"
          value={values.password}
          onChange={update('password')}
          invalid={!!errors.password}
          autoComplete="current-password"
        />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm" style={{ color: 'var(--accent)' }}>
          {t('auth.login.forgot')}
        </Link>
      </div>
      <Button type="submit" fullWidth loading={submitting}>
        {t('auth.login.submit')}
      </Button>
    </form>
  );
}
