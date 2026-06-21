import { t } from '@workarmy/ui';
import { ParticipantSelector } from '@/components/ParticipantSelector';

export default function HomePage() {
  return (
    <div className="py-14">
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-4xl sm:text-5xl">{t('home.hero.title')}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[#64748B]">{t('home.hero.subtitle')}</p>
      </section>
      <div className="mt-14">
        <ParticipantSelector />
      </div>
    </div>
  );
}
