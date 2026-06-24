'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { ConversationThread, ConversationView } from '@workarmy/types';
import { Alert, Button, Card, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function MessagesSection() {
  const [convs, setConvs] = useState<ConversationView[]>([]);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConvs() {
    setConvs(await api.support.orgConversations());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadConvs();
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function open(id: string) {
    setError(null);
    try {
      setThread(await api.support.orgThread(id));
      await loadConvs();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!thread || !draft.trim()) return;
    try {
      setThread(await api.support.orgSendMessage(thread.id, { body: draft }));
      setDraft('');
      await loadConvs();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Messages</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {convs.length === 0 ? (
            <Card className="p-4 text-sm text-[#64748B]">No conversations yet. Workers can message you from their dashboard.</Card>
          ) : (
            convs.map((c) => (
              <button key={c.id} type="button" onClick={() => open(c.id)} className="w-full text-left">
                <Card className={cn('p-3 transition hover:bg-[#F8FAFC]', thread?.id === c.id && 'ring-2 ring-[color:var(--accent)]')}>
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium text-[#1E293B]">{c.counterparty.name}</span>
                    {c.unread > 0 ? <span className="rounded-full px-1.5 text-xs text-white" style={{ backgroundColor: 'var(--accent)' }}>{c.unread}</span> : null}
                  </div>
                  <div className="truncate text-xs text-[#64748B]">{c.lastMessage ?? '—'}</div>
                </Card>
              </button>
            ))
          )}
        </div>

        <Card className="flex min-h-[320px] flex-col p-4">
          {thread ? (
            <>
              <div className="border-b border-[#E5E7EB] pb-2 font-medium text-[#1E293B]">{thread.counterparty.name}</div>
              <div className="flex-1 space-y-2 overflow-y-auto py-3">
                {thread.messages.map((m) => (
                  <div key={m.id} className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm', m.mine ? 'ml-auto text-white' : 'bg-[#F1F5F9] text-[#1E293B]')} style={m.mine ? { backgroundColor: 'var(--accent)' } : undefined}>
                    {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-[#E5E7EB] pt-3">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a reply…" />
                <Button type="submit">Send</Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-[#94A3B8]">Select a conversation</div>
          )}
        </Card>
      </div>
    </div>
  );
}
