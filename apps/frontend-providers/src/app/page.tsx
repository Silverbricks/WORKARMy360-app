import Link from 'next/link';
import { Card, Icon, accentByAccountType, type IconName } from '@workarmy/ui';
import type { AccountType } from '@workarmy/types';

const TYPES: { type: AccountType; title: string; desc: string; icon: IconName }[] = [
  { type: 'EMPLOYER', title: 'Employer', desc: 'Post jobs and hire staff.', icon: 'building' },
  { type: 'FARM', title: 'Farm', desc: 'Recruit seasonal & permanent crews.', icon: 'sprout' },
  { type: 'CONTRACTOR', title: 'Contractor', desc: 'Win projects and supply labour.', icon: 'hardhat' },
  { type: 'LABOUR_HIRE', title: 'Labour Hire Agency', desc: 'Employ and supply workers to clients.', icon: 'users' },
  { type: 'RECRUITMENT_AGENCY', title: 'Recruitment Agency', desc: 'Source and place candidates.', icon: 'search' },
];

export default function HomePage() {
  return (
    <div className="py-14">
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-4xl sm:text-5xl">Hire and manage your workforce.</h1>
        <p className="mx-auto mt-4 max-w-xl text-[#64748B]">
          One platform for employers, farms, contractors and agencies to post work, hire, and manage staff.
        </p>
      </section>
      <section className="mt-12">
        <h2 className="text-center text-2xl">I run a…</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <Link key={t.type} href={`/register?type=${t.type}`} className="block">
              <Card className="group flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: accentByAccountType[t.type] }}
                >
                  <Icon name={t.icon} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-[#1E293B]">{t.title}</span>
                  <span className="mt-0.5 block text-sm text-[#64748B]">{t.desc}</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
