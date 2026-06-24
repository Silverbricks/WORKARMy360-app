'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { KnowledgeSummary } from '@workarmy/types';
import { Button, Card, Icon } from '@workarmy/ui';
import { api } from '@/lib/api';

export function GrowSection() {
  const [articles, setArticles] = useState<KnowledgeSummary[]>([]);

  useEffect(() => {
    let active = true;
    api.community
      .knowledge()
      .then((a) => active && setArticles(a.slice(0, 5)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Grow Time</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Develop your skills and career.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#1E293B]">📚 Personal development</h2>
          <p className="text-sm text-[#64748B]">Short courses, skills tracking and goals.</p>
          <Link href="/dashboard/community?tab=knowledge" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">Browse Knowledge Hub</Button>
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#1E293B]">💡 Share your ideas</h2>
          <p className="text-sm text-[#64748B]">Suggest improvements and vote on community ideas.</p>
          <Link href="/dashboard/ideas" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">Open ideas</Button>
          </Link>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-[#E5E7EB] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#1E293B]">Recommended reading</h2>
        </div>
        {articles.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {articles.map((a) => (
              <li key={a.slug} className="flex items-center gap-3 px-5 py-3">
                <Icon name="file" size={18} className="text-[#64748B]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{a.title}</p>
                  <p className="text-xs text-[#94A3B8]">{a.category}</p>
                </div>
                <Link href="/dashboard/community?tab=knowledge" className="text-sm" style={{ color: 'var(--accent)' }}>
                  Read
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
