'use client';

import { type FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, OtpInput } from '@workarmy/ui';
import { VerifyEmailSchema } from '@workarmy/validation';
import { api, setAccessToken, setAuthHint } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = VerifyEmailSchema.safeParse({ email, code });
    if (!parsed.success) {
      setInvalid(true);
      setError('Enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.auth.verifyEmail(parsed.data);
      setAccessToken(res.accessToken);
      setAuthHint();
      router.push('/dashboard');
    } catch (err) {
      setInvalid(true);
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await api.auth.resendOtp({ email });
      setInfo('A new code is on its way.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}
      <p className="text-sm text-[#64748B]">Enter the 6-digit code we sent to {email}.</p>
      <OtpInput value={code} onChange={(v) => { setCode(v); setInvalid(false); }} invalid={invalid} autoFocus />
      <Button type="submit" fullWidth loading={submitting}>
        Verify email
      </Button>
      <button type="button" onClick={resend} className="w-full text-center text-sm" style={{ color: 'var(--accent)' }}>
        Resend code
      </button>
    </form>
  );
}
