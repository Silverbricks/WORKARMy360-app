'use client';

import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input, PasswordInput } from '@workarmy/ui';
import { LoginSchema } from '@workarmy/validation';
import { api, clearAuthHint, setAccessToken, setAuthHint } from '@/lib/api';
import { errorMessage, zodFieldErrors, type FieldErrors } from '@/lib/form';

export function LoginForm() {
  const router = useRouter();
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
      const res = await api.auth.login(parsed.data);
      setAccessToken(res.accessToken);
      // Only admins may use this portal.
      const me = await api.auth.me();
      if (!me.user.adminRole) {
        setAccessToken(null);
        setFormError('This account is not an administrator.');
        return;
      }
      setAuthHint();
      router.push('/dashboard');
    } catch (err) {
      clearAuthHint();
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <Field id="email" label="Email" error={errors.email}>
        <Input id="email" type="email" value={values.email} onChange={update('email')} invalid={!!errors.email} autoComplete="email" />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <PasswordInput id="password" value={values.password} onChange={update('password')} invalid={!!errors.password} autoComplete="current-password" />
      </Field>
      <Button type="submit" fullWidth loading={submitting}>
        Log in
      </Button>
    </form>
  );
}
