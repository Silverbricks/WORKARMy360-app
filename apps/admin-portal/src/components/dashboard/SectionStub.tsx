import { Card } from '@workarmy/ui';
import type { AdminSection } from '@/lib/dashboard-sections';

export function SectionStub({ section }: { section: AdminSection }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">{section.title}</h1>
        {section.intro ? <p className="mt-1 text-sm text-[#64748B]">{section.intro}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(section.groups ?? []).map((group) => (
          <Card key={group.title} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]" style={{ fontFamily: 'var(--font-body)' }}>
                {group.title}
              </h2>
              <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">Planned</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-[#64748B]">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
