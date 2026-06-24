'use client';

import { useEffect, useState } from 'react';
import type { EmployerSummary } from '@workarmy/types';
import { Alert, Card, Icon, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useTabParam } from '@/lib/use-tab-param';

type Tab = 'current' | 'previous';
const TABS = ['current', 'previous'] as const;

export function EmployersSection() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'current');
  const [employers, setEmployers] = useState<EmployerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.persons
      .employers()
      .then((e) => active && setEmployers(e))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visible = employers.filter((e) => (tab === 'current' ? e.current : !e.current));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">My Employers</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Who you work with now, and where you&apos;ve worked.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn('rounded-lg px-3 py-1.5 text-sm', tab === t ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t === 'current' ? 'Current' : 'Previous'} ({employers.filter((e) => (t === 'current' ? e.current : !e.current)).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#64748B]">Loading…</div>
      ) : visible.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">
          {tab === 'current' ? 'No current employers yet.' : 'No previous employers yet.'}
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[#F1F5F9]">
            {visible.map((e) => (
              <li key={e.orgId} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F1F5F9]">
                  <Icon name="building" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{e.name}</p>
                  <p className="text-xs text-[#64748B]">
                    {e.accountType.replace(/_/g, ' ')} · {e.shiftsCount} shift(s)
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: e.current ? '#DCFCE7' : '#F1F5F9',
                    color: e.current ? '#166534' : '#64748B',
                  }}
                >
                  {e.current ? 'Active' : 'Ended'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
