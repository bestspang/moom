import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { PersonStanding, Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MemberRunClubPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={t('member.runClub')} />
      <Section className="mt-8">
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PersonStanding className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t('member.runClub')}</h2>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Construction className="h-4 w-4" />
            <p className="text-sm">{t('member.comingSoonRunClub')}</p>
          </div>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            {t('member.runClubDescription')}
          </p>
        </div>
      </Section>
    </div>
  );
}
