'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Team } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [addTo, setAddTo] = useState<string | null>(null);
  const [memberWa, setMemberWa] = useState('');
  const [memberRole, setMemberRole] = useState('');

  async function load() {
    setTeams(await api.staff.teams.list());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.staff.teams.list();
        if (active) setTeams(data);
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

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.staff.teams.create({ name, description: desc || undefined });
      setName('');
      setDesc('');
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  async function addMember(teamId: string) {
    if (!memberWa.trim()) return;
    setError(null);
    try {
      await api.staff.teams.addMember(teamId, { waId: memberWa, roleInTeam: memberRole || undefined });
      setMemberWa('');
      setMemberRole('');
      setAddTo(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function removeMember(teamId: string, memberId: string) {
    try {
      await api.staff.teams.removeMember(teamId, memberId);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function removeTeam(id: string) {
    try {
      await api.staff.teams.remove(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Teams &amp; Supervisors</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="teamName" label="Team name">
            <Input id="teamName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crew A — Picking" />
          </Field>
          <Field id="teamDesc" label="Description">
            <Input id="teamDesc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
          </Field>
          <Button type="submit" loading={busy}>+ Create</Button>
        </form>
      </Card>

      {teams.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No teams yet. Create one above.</Card>
      ) : (
        <div className="space-y-3">
          {teams.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#1E293B]">{t.name}</p>
                  <p className="text-xs text-[#64748B]">
                    {t.members.length} member{t.members.length === 1 ? '' : 's'}
                    {t.description ? ` · ${t.description}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setAddTo(addTo === t.id ? null : t.id)}>
                    + Member
                  </Button>
                  <button type="button" onClick={() => removeTeam(t.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Delete team">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>

              {t.members.length > 0 ? (
                <ul className="mt-3 divide-y divide-[#F1F5F9]">
                  {t.members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 py-2 text-sm">
                      <span className="flex-1 text-[#1E293B]">
                        {m.name} <span className="font-mono text-xs text-[#94A3B8]">{m.waId}</span>
                        {m.roleInTeam ? <span className="ml-2 text-xs text-[#64748B]">· {m.roleInTeam}</span> : null}
                      </span>
                      <button type="button" onClick={() => removeMember(t.id, m.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove member">
                        <Icon name="trash" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {addTo === t.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[#E5E7EB] pt-3">
                  <Input value={memberWa} onChange={(e) => setMemberWa(e.target.value)} placeholder="Worker WA-ID" className="max-w-[160px]" />
                  <Input value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="Role (e.g. Lead)" className="max-w-[160px]" />
                  <Button size="sm" onClick={() => addMember(t.id)}>Add</Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
