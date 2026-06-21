import Link from 'next/link';
import { accentByAccountType, Card, Icon, PARTICIPANTS, t } from '@workarmy/ui';
import { PROVIDERS_URL } from '@/lib/api';

/** Homepage "I am a…" selector. Job Seeker stays in this app; the five provider
 * types route to the Providers app register (external for now). */
export function ParticipantSelector() {
  return (
    <section aria-labelledby="iam-heading">
      <h2 id="iam-heading" className="text-center text-2xl">
        {t('home.selector.heading')}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTICIPANTS.map((p) => {
          const accent = accentByAccountType[p.accountType];
          const href =
            p.app === 'users'
              ? `/register?type=${p.accountType}`
              : `${PROVIDERS_URL}/register?type=${p.accountType}`;

          const card = (
            <Card className="group flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ backgroundColor: accent }}
              >
                <Icon name={p.icon} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-[#1E293B]">{t(p.titleKey)}</span>
                <span className="mt-0.5 block text-sm text-[#64748B]">{t(p.descKey)}</span>
              </span>
              <Icon
                name="arrowRight"
                className="ml-auto mt-1 shrink-0 text-[#94A3B8] transition group-hover:translate-x-0.5"
              />
            </Card>
          );

          return p.app === 'users' ? (
            <Link key={p.accountType} href={href} className="block">
              {card}
            </Link>
          ) : (
            <a key={p.accountType} href={href} className="block">
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}
