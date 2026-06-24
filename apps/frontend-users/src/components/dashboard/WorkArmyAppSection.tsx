'use client';

import { useState } from 'react';
import { Button, Card, Field, Input } from '@workarmy/ui';

export function WorkArmyAppSection() {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">WorkArmy App</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Take WorkArmy with you — clock in, find shifts and get notified on the go.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#1E293B]">📱 Get the app</h2>
          <p className="mb-4 text-sm text-[#64748B]">
            Manage shifts, clock in with GPS, get instant job alerts and message employers — all from
            your phone.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">App Store</Button>
            <Button variant="secondary" size="sm">Google Play</Button>
          </div>
          <div className="mt-5">
            <Field id="appPhone" label="Or text yourself a link">
              <div className="flex gap-2">
                <Input id="appPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" />
                <Button type="button" onClick={() => setSent(true)}>
                  Send link
                </Button>
              </div>
            </Field>
            {sent ? <p className="text-sm text-[#16A34A]">Download link sent to {phone || 'your phone'}.</p> : null}
          </div>
        </Card>

        <Card className="p-5 text-center">
          <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Scan to download</h2>
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-xs text-[#94A3B8]">
            QR code
          </div>
          <p className="mt-3 text-xs text-[#94A3B8]">Point your camera at the code</p>
        </Card>
      </div>
    </div>
  );
}
