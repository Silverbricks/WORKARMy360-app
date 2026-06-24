'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Group, GroupKind } from '@workarmy/types';
import { Alert, Button, Card, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function PoolsTeamsSection() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<Record<GroupKind, string>>({ POOL: '', TEAM: '' });

  async function load() {
    setGroups(await api.community.groups());
  }

  useEffect(() => {
    let active = true;
    load()
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function create(kind: GroupKind, e: FormEvent) {
    e.preventDefault();
    const name = names[kind].trim();
    if (!name) return;
    setError(null);
    try {
      await api.community.createGroup({ kind, name });
      setNames((n) => ({ ...n, [kind]: '' }));
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }

  async function toggle(g: Group) {
    setError(null);
    try {
      if (g.joined) await api.community.leaveGroup(g.id);
      else await api.community.joinGroup(g.id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Pools &amp; Teams</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Create or join staff pools and teams.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {(['POOL', 'TEAM'] as const).map((kind) => {
          const list = groups.filter((g) => g.kind === kind);
          return (
            <Card key={kind} className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">
                {kind === 'POOL' ? '🏊 Staff pools' : '👥 Teams'}
              </h2>
              <form onSubmit={(e) => create(kind, e)} className="mb-3 flex gap-2">
                <Input
                  value={names[kind]}
                  onChange={(e) => setNames((n) => ({ ...n, [kind]: e.target.value }))}
                  placeholder={kind === 'POOL' ? 'Pool name' : 'Team name'}
                />
                <Button type="submit" size="sm">
                  Create
                </Button>
              </form>
              {list.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#94A3B8]">No {kind.toLowerCase()}s yet.</p>
              ) : (
                <ul className="divide-y divide-[#F1F5F9]">
                  {list.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F1F5F9]">
                        <Icon name="users" size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1E293B]">{g.name}</p>
                        <p className="text-xs text-[#94A3B8]">{g.memberCount} member(s)</p>
                      </div>
                      <Button size="sm" variant={g.joined ? 'secondary' : 'primary'} onClick={() => toggle(g)}>
                        {g.joined ? 'Leave' : 'Join'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
