'use client';

import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input, PasswordInput, t } from '@workarmy/ui';
import { passwordStrength, RegisterSchema } from '@workarmy/validation';
import { api, setAccessToken, setAuthHint } from '@/lib/api';
import { apiFieldErrors, errorMessage, zodFieldErrors, type FieldErrors } from '@/lib/form';

const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['#DC2626', '#F59E0B', '#65A30D', '#16A34A'];

function StrengthMeter({ score }: { score: number }) {
  if (!score) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex h-1.5 flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-full flex-1 rounded-full"
            style={{ backgroundColor: i < score ? STRENGTH_COLORS[score - 1] : '#E5E7EB' }}
          />
        ))}
      </div>
      <span className="text-xs text-[#64748B]">{STRENGTH_LABELS[score - 1]}</span>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    // Users app registers Job Seekers; provider types route to the Providers app.
    const parsed = RegisterSchema.safeParse({ ...values, accountType: 'JOB_SEEKER' });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Register now issues a session — the user always lands in the dashboard and
      // verifies in-app (the OTP gate at boot blocks everything until verified).
      const res = await api.auth.register(parsed.data);
      setAccessToken(res.accessToken);
      setAuthHint();
      router.push('/dashboard');
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field id="firstName" label={t('auth.firstName.label')} error={errors.firstName}>
          <Input
            id="firstName"
            value={values.firstName}
            onChange={update('firstName')}
            invalid={!!errors.firstName}
            autoComplete="given-name"
          />
        </Field>
        <Field id="lastName" label={t('auth.lastName.label')} error={errors.lastName}>
          <Input
            id="lastName"
            value={values.lastName}
            onChange={update('lastName')}
            invalid={!!errors.lastName}
            autoComplete="family-name"
          />
        </Field>
      </div>
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
      <Field id="mobile" label={t('auth.mobile.label')} error={errors.mobile} hint="04xx xxx xxx">
        <Input
          id="mobile"
          type="tel"
          value={values.mobile}
          onChange={update('mobile')}
          invalid={!!errors.mobile}
          autoComplete="tel"
        />
      </Field>
      <Field id="password" label={t('auth.password.label')} error={errors.password}>
        <PasswordInput
          id="password"
          value={values.password}
          onChange={update('password')}
          invalid={!!errors.password}
          autoComplete="new-password"
        />
        <StrengthMeter score={passwordStrength(values.password)} />
      </Field>
      <Button type="submit" fullWidth loading={submitting}>
        {t('auth.register.submit')}
      </Button>
    </form>
  );
}
