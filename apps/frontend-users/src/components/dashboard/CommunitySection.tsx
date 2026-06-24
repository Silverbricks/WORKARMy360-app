'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Feedback, Group, GroupKind, KnowledgeArticle, KnowledgeSummary } from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'knowledge' | 'groups' | 'feedback';

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';
const areaCls =
  'min-h-[90px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

export function CommunitySection() {
  const [tab, setTab] = useState<Tab>('knowledge');
  const [articles, setArticles] = useState<KnowledgeSummary[]>([]);
  const [open, setOpen] = useState<KnowledgeArticle | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [gKind, setGKind] = useState<GroupKind>('POOL');
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');

  const [fbKind, setFbKind] = useState('idea');
  const [fbMsg, setFbMsg] = useState('');
  const [fbDone, setFbDone] = useState(false);

  async function loadAll() {
    const [a, g, f] = await Promise.all([
      api.community.knowledge(),
      api.community.groups(),
      api.community.myFeedback(),
    ]);
    setArticles(a);
    setGroups(g);
    setFeedback(f);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadAll();
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

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await loadAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function openArticle(slug: string) {
    setError(null);
    try {
      setOpen(await api.community.article(slug));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    await act('create', async () => {
      await api.community.createGroup({ kind: gKind, name: gName, description: gDesc || undefined });
      setGName('');
      setGDesc('');
      setShowGroupForm(false);
    });
  }

  async function submitFeedback(e: FormEvent) {
    e.preventDefault();
    setBusy('fb');
    setError(null);
    try {
      await api.community.submitFeedback({ kind: fbKind, message: fbMsg });
      setFbMsg('');
      setFbDone(true);
      setFeedback(await api.community.myFeedback());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'knowledge', label: 'Knowledge hub' },
    { key: 'groups', label: 'Pools & teams' },
    { key: 'feedback', label: 'Feedback' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Community &amp; Career Development</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Knowledge, learning, worker pools and your ideas.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm', tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'knowledge' &&
        (open ? (
          <Card className="p-6">
            <button type="button" onClick={() => setOpen(null)} className="mb-3 text-sm" style={{ color: 'var(--accent)' }}>
              ← Back to articles
            </button>
            <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{open.category}</span>
            <h2 className="mt-2 text-xl text-[#1E293B]">{open.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{open.body}</p>
          </Card>
        ) : articles.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No articles yet.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {articles.map((a) => (
              <button key={a.slug} type="button" onClick={() => openArticle(a.slug)} className="text-left">
                <Card className="h-full p-5 transition hover:bg-[#F8FAFC]">
                  <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{a.category}</span>
                  <div className="mt-2 font-medium text-[#1E293B]">{a.title}</div>
                  <p className="mt-1 text-sm text-[#64748B]">{a.excerpt}</p>
                </Card>
              </button>
            ))}
          </div>
        ))}

      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowGroupForm((s) => !s)}>{showGroupForm ? 'Cancel' : 'Create pool / team'}</Button>
          </div>
          {showGroupForm ? (
            <Card className="p-6">
              <form onSubmit={createGroup} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="gkind" label="Type">
                  <select id="gkind" value={gKind} onChange={(e) => setGKind(e.target.value as GroupKind)} className={inputCls}>
                    <option value="POOL">Worker pool</option>
                    <option value="TEAM">Team</option>
                  </select>
                </Field>
                <Field id="gname" label="Name">
                  <Input id="gname" value={gName} onChange={(e) => setGName(e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field id="gdesc" label="Description">
                    <textarea id="gdesc" value={gDesc} onChange={(e) => setGDesc(e.target.value)} className={areaCls} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy === 'create'}>Create</Button>
                </div>
              </form>
            </Card>
          ) : null}

          {groups.length === 0 ? (
            <Card className="p-6 text-sm text-[#64748B]">No pools or teams yet. Create one to connect with other workers.</Card>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <Card key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1E293B]">{g.name}</span>
                      <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{g.kind === 'POOL' ? 'Pool' : 'Team'}</span>
                    </div>
                    <div className="text-sm text-[#64748B]">{g.memberCount} member{g.memberCount === 1 ? '' : 's'}{g.description ? ` · ${g.description}` : ''}</div>
                  </div>
                  {g.joined ? (
                    <Button size="sm" variant="ghost" loading={busy === g.id} onClick={() => act(g.id, () => api.community.leaveGroup(g.id))}>Leave</Button>
                  ) : (
                    <Button size="sm" variant="secondary" loading={busy === g.id} onClick={() => act(g.id, () => api.community.joinGroup(g.id))}>Join</Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'feedback' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Share your ideas</h2>
            {fbDone ? <div className="mb-3"><Alert tone="success">Thanks — your feedback was submitted.</Alert></div> : null}
            <form onSubmit={submitFeedback} className="space-y-4">
              <Field id="fbkind" label="Type">
                <select id="fbkind" value={fbKind} onChange={(e) => setFbKind(e.target.value)} className={inputCls}>
                  <option value="idea">Idea</option>
                  <option value="product">Product feedback</option>
                  <option value="feature">Feature request</option>
                </select>
              </Field>
              <Field id="fbmsg" label="Message">
                <textarea id="fbmsg" value={fbMsg} onChange={(e) => { setFbMsg(e.target.value); setFbDone(false); }} className={areaCls} />
              </Field>
              <Button type="submit" loading={busy === 'fb'}>Submit</Button>
            </form>
          </Card>

          {feedback.length > 0 ? (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-medium text-[#1E293B]">Your submissions</h3>
              <ul className="space-y-2">
                {feedback.map((f) => (
                  <li key={f.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{f.kind}</span>
                    <p className="mt-1 text-[#475569]">{f.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
