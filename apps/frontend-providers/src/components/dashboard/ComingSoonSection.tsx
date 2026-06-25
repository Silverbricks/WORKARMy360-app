'use client';

import { Card, Icon } from '@workarmy/ui';
import { navLabelForSlug } from '@/lib/dashboard-nav';

/** Temporary placeholder for Business dashboard sections not yet wired to a component. */
export function ComingSoonSection({ slug }: { slug: string }) {
  const label = navLabelForSlug(slug);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{label}</h1>
      <Card className="p-10 text-center">
        <span
          className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Icon name="zap" size={22} />
        </span>
        <p className="mx-auto max-w-md text-sm text-[#64748B]">
          <span className="font-medium text-[#1E293B]">{label}</span> is being wired up. It&apos;s part of
          the Business dashboard build and will be live shortly.
        </p>
      </Card>
    </div>
  );
}
