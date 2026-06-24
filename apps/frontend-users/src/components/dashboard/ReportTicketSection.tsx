'use client';

import { type FormEvent, useState } from 'react';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const COPY = {
  incident: {
    title: 'Incident Form',
    intro: 'Report a workplace incident — injury, safety hazard or near miss. We treat these urgently.',
    subjectLabel: 'What happened?',
    subjectPlaceholder: 'e.g. Slip hazard in cold store',
    category: 'Incident',
  },
  report: {
    title: 'Report Form',
    intro: 'Report an issue with pay, conditions, accommodation, transport or conduct.',
    subjectLabel: 'What would you like to report?',
    subjectPlaceholder: 'e.g. Underpaid for last shift',
    category: 'Report',
  },
} as const;

export function ReportTicketSection({ variant }: { variant: 'incident' | 'report' }) {
  const copy = COPY[variant];
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    if (subject.trim().length < 2 || body.trim().length < 2) {
      setError('Please complete both fields.');
      return;
    }
    setBusy(true);
    try {
      await api.support.createTicket({
        category: copy.category,
        subject: subject.trim(),
        body: body.trim(),
      });
      setSubject('');
      setBody('');
      setSent(true);
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">{copy.title}</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">{copy.intro}</p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {sent ? (
            <Alert tone="success">
              Submitted — our support team will follow up. Track it under Support → Report issues.
            </Alert>
          ) : null}
          <Field id="subject" label={copy.subjectLabel}>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={copy.subjectPlaceholder}
            />
          </Field>
          <Field id="body" label="Details">
            <textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Include dates, locations and anyone involved."
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]"
            />
          </Field>
          <Button type="submit" loading={busy}>
            Submit {copy.category.toLowerCase()}
          </Button>
        </form>
      </Card>
    </div>
  );
}
