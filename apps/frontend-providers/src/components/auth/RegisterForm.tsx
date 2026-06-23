'use client';

import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Field, Input, PasswordInput } from '@workarmy/ui';
import { PROVIDER_ACCOUNT_TYPES, type AccountType } from '@workarmy/types';
import { RegisterSchema } from '@workarmy/validation';
import { api } from '@/lib/api';
import { apiFieldErrors, errorMessage, zodFieldErrors, type FieldErrors } from '@/lib/form';

const TYPE_LABELS: Record<string, string> = {
  EMPLOYER: 'Employer',
  FARM: 'Farm',
  CONTRACTOR: 'Contractor',
  LABOUR_HIRE: 'Labour Hire Agency',
  RECRUITMENT_AGENCY: 'Recruitment Agency',
};

function defaultType(raw: string | null): AccountType {
  return raw && (PROVIDER_ACCOUNT_TYPES as readonly string[]).includes(raw)
    ? (raw as AccountType)
    : 'EMPLOYER';
}

export function RegisterForm() {
  const router = useRouter();
  const initialType = defaultType(useSearchParams().get('type'));
  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [values, setValues] = useState({
    companyName: '',
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
    const parsed = RegisterSchema.safeParse({ ...values, accountType });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.auth.register(parsed.data);
      router.push(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
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
      <Field id="accountType" label="I am a">
        <select
          id="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as AccountType)}
          className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]"
        >
          {PROVIDER_ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="companyName" label="Organisation name" error={errors.companyName}>
        <Input
          id="companyName"
          value={values.companyName}
          onChange={update('companyName')}
          invalid={!!errors.companyName}
          autoComplete="organization"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="firstName" label="First name" error={errors.firstName}>
          <Input id="firstName" value={values.firstName} onChange={update('firstName')} invalid={!!errors.firstName} autoComplete="given-name" />
        </Field>
        <Field id="lastName" label="Last name" error={errors.lastName}>
          <Input id="lastName" value={values.lastName} onChange={update('lastName')} invalid={!!errors.lastName} autoComplete="family-name" />
        </Field>
      </div>
      <Field id="email" label="Work email" error={errors.email}>
        <Input id="email" type="email" value={values.email} onChange={update('email')} invalid={!!errors.email} autoComplete="email" />
      </Field>
      <Field id="mobile" label="Mobile number" error={errors.mobile} hint="04xx xxx xxx">
        <Input id="mobile" type="tel" value={values.mobile} onChange={update('mobile')} invalid={!!errors.mobile} autoComplete="tel" />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <PasswordInput id="password" value={values.password} onChange={update('password')} invalid={!!errors.password} autoComplete="new-password" />
      </Field>
      <Button type="submit" fullWidth loading={submitting}>
        Create account
      </Button>
    </form>
  );
}
