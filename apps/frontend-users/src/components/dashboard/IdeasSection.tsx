'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Feedback } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function IdeasSection() {
  const [text, setText] = useState('');
  const [items, setItems] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.community
      .myFeedback()
      .then((f) => active && setItems(f.filter((x) => x.kind === 'idea')))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 2) {
      setError('Please write a little more.');
      return;
    }
    setBusy(true);
    try {
      const created = await api.community.submitFeedback({ kind: 'idea', message: text.trim() });
      setItems((prev) => [created, ...prev]);
      setText('');
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Share Your Ideas</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Suggest features and improvements — we read every one.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Field id="idea" label="Your idea">
              <Input id="idea" value={text} onChange={(e) => setText(e.target.value)} placeholder="I’d love it if WorkArmy could…" />
            </Field>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={busy}>
              <Icon name="plus" size={16} /> Submit
            </Button>
          </div>
        </form>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </Card>

      <Card className="p-0">
        <div className="border-b border-[#E5E7EB] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#1E293B]">Your ideas</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">No ideas yet — be the first to share one.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <Icon name="lightbulb" size={18} className="text-[#854D0E]" />
                <p className="flex-1 text-sm text-[#1E293B]">{i.message}</p>
                <span className="text-xs text-[#94A3B8]">{new Date(i.createdAt).toLocaleDateString('en-AU')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
