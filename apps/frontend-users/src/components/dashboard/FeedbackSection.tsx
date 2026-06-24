'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Feedback } from '@workarmy/types';
import { Alert, Button, Card, Field } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const COPY = {
  feedback: {
    title: 'Feedback',
    intro: 'Tell us how WorkArmy is working for you — the good and the not-so-good.',
    label: 'Your feedback',
    placeholder: 'What worked well, what didn’t…',
    kind: 'feedback',
  },
  suggestion: {
    title: 'Suggestion Box',
    intro: 'Got an idea or a feature request? We read every one.',
    label: 'Your suggestion',
    placeholder: 'I’d love it if WorkArmy could…',
    kind: 'suggestion',
  },
} as const;

export function FeedbackSection({ variant }: { variant: 'feedback' | 'suggestion' }) {
  const copy = COPY[variant];
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.community
      .myFeedback()
      .then((f) => active && setItems(f.filter((x) => x.kind === copy.kind)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [copy.kind]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    if (message.trim().length < 2) {
      setError('Please write a little more.');
      return;
    }
    setBusy(true);
    try {
      const created = await api.community.submitFeedback({ kind: copy.kind, message: message.trim() });
      setItems((prev) => [created, ...prev]);
      setMessage('');
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
          {sent ? <Alert tone="success">Thanks — we&apos;ve received it.</Alert> : null}
          <Field id="message" label={copy.label}>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.placeholder}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]"
            />
          </Field>
          <Button type="submit" loading={busy}>
            Submit
          </Button>
        </form>
      </Card>

      {items.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-[#1E293B]">Previously submitted</h2>
          <div className="space-y-2">
            {items.map((f) => (
              <Card key={f.id} className="p-4">
                <p className="text-sm text-[#1E293B]">{f.message}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {new Date(f.createdAt).toLocaleDateString('en-AU')}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
