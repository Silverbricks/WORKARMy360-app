import Link from 'next/link';
import { Card, t } from '@workarmy/ui';

export default function FindWorkPage() {
  return (
    <div className="py-14">
      <h1 className="text-3xl">{t('nav.findWork')}</h1>
      <p className="mt-3 max-w-xl text-[#64748B]">
        Job search is coming in a later sprint. Create your account now so you’re ready to apply the
        moment matching work appears.
      </p>
      <Card className="mt-8 max-w-md p-6">
        <p className="text-sm text-[#64748B]">Get set up in under 30 seconds.</p>
        <Link
          href="/register"
          className="mt-4 inline-flex rounded-lg px-4 py-2 font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {t('nav.register')}
        </Link>
      </Card>
    </div>
  );
}
