'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Icon, OtpInput } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

/**
 * Boot gate (Gate 1): until the account verifies its email/mobile OTP, this is the
 * only usable content in the dashboard. On success we reload so the shell unlocks.
 */
export function VerifyScreen({ email }: { email: string }) {
  const [channel, setChannel] = useState<'email' | 'mobile'>('email');
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSent, setMobileSent] = useState(false);

  async function selectChannel(ch: 'email' | 'mobile') {
    setChannel(ch);
    setCode('');
    setInvalid(false);
    setError(null);
    setInfo(null);
    // First time the user picks Mobile, text them a code automatically.
    if (ch === 'mobile' && !mobileSent) {
      try {
        await api.auth.sendMobileOtp({ email });
        setMobileSent(true);
        setInfo('We’ve texted a 6-digit code to your mobile.');
      } catch (err) {
        setError(errorMessage(err));
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (code.length !== 6) {
      setInvalid(true);
      setError('Enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    try {
      if (channel === 'mobile') await api.auth.verifyMobile({ email, code });
      else await api.auth.verifyEmail({ email, code });
      // Reload so the shell re-reads /me and unlocks the dashboard.
      window.location.href = '/dashboard';
    } catch (err) {
      setInvalid(true);
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      if (channel === 'mobile') {
        await api.auth.sendMobileOtp({ email });
        setInfo('A fresh code has been texted to you.');
      } else {
        await api.auth.resendOtp({ email });
        setInfo('A fresh code is on its way.');
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="mb-6 text-center">
        <span
          className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Icon name="shield" size={26} />
        </span>
        <h1 className="text-2xl">Verify your account to continue</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          For everyone&apos;s safety, confirm your contact details before using your dashboard.
        </p>
      </div>

      {/* Step 1 — OTP (unlocks the whole dashboard) */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            1
          </span>
          <h2 className="text-lg text-[#1E293B]">Verify your email or mobile</h2>
        </div>

        <div className="mb-4 flex gap-2">
          {(['email', 'mobile'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => selectChannel(ch)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition"
              style={
                channel === ch
                  ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 8%, white)' }
                  : { borderColor: '#E5E7EB', color: '#64748B' }
              }
            >
              {ch}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {info ? <Alert tone="success">{info}</Alert> : null}
          <p className="text-sm text-[#64748B]">
            {channel === 'mobile' ? (
              <>Enter the 6-digit code we texted to your mobile.</>
            ) : (
              <>Enter the 6-digit code we sent to <span className="font-medium text-[#1E293B]">{email}</span>.</>
            )}
          </p>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setInvalid(false);
            }}
            invalid={invalid}
            autoFocus
          />
          <Button type="submit" fullWidth loading={submitting}>
            Verify &amp; unlock dashboard
          </Button>
          <button
            type="button"
            onClick={resend}
            className="w-full text-center text-sm"
            style={{ color: 'var(--accent)' }}
          >
            Resend code
          </button>
        </form>
      </Card>

      {/* Step 2 — profile + 100-pt ID (needed to apply only) */}
      <Card className="mt-4 p-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E5E7EB] text-xs font-semibold text-[#64748B]">
            2
          </span>
          <h2 className="text-lg text-[#1E293B]">Verify your profile &amp; 100-point ID</h2>
        </div>
        <p className="text-sm text-[#64748B]">
          This is only needed to <span className="font-medium text-[#1E293B]">apply for jobs</span> —
          you can browse jobs, shifts and tasks as soon as step 1 is done. Complete it any time from
          your dashboard.
        </p>
        <div className="mt-4">
          <Link href="/dashboard/profile">
            <Button variant="secondary">Complete my profile →</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
