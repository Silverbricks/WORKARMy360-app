'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Icon, Input } from '@workarmy/ui';
import { useMe } from './DashboardShell';

export function ShareJobsSection() {
  const me = useMe();
  const waId = me?.person?.waId ?? '';
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/j/share/${waId.toLowerCase()}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Share Jobs &amp; Shifts</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Refer friends to jobs and shifts.</p>
      </div>

      <Card className="p-5">
        <p className="mb-3 text-sm text-[#64748B]">
          Share your referral link with a friend — you both earn rewards when they&apos;re placed.
        </p>
        <div className="flex items-center gap-2">
          <Input readOnly value={link} className="font-mono text-xs" />
          <Button type="button" variant="secondary" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={16} />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-[#1E293B]">How referrals work</h2>
        <ul className="space-y-2 text-sm text-[#64748B]">
          <li className="flex gap-2"><span>1.</span> Share your link with a mate looking for work.</li>
          <li className="flex gap-2"><span>2.</span> They sign up and get placed in a job or shift.</li>
          <li className="flex gap-2"><span>3.</span> You both earn referral rewards.</li>
        </ul>
      </Card>
    </div>
  );
}
