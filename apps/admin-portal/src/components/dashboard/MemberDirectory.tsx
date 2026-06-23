'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { MemberDirectoryItem } from '@workarmy/types';
import { Alert, Button, Card, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function MemberDirectory() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<MemberDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(query = '') {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.members(query);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load('');
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Member Directory</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form onSubmit={onSearch} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, WA ID or email…" />
        <Button type="submit">Search</Button>
      </form>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              <th className="px-4 py-2 font-medium">WA ID</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#64748B]">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#64748B]">No members found.</td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={`${m.kind}-${m.id}`} className="border-t border-[#E5E7EB]">
                  <td className="px-4 py-2 font-mono text-xs">{m.waId}</td>
                  <td className="px-4 py-2 text-[#1E293B]">
                    {m.name}{' '}
                    <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] uppercase text-[#94A3B8]">
                      {m.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#64748B]">{m.accountType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2 text-[#64748B]">{m.email ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
      <p className="text-sm text-[#64748B]">{total} member(s)</p>
    </div>
  );
}
