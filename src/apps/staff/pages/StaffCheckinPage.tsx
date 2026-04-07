import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { Monitor, QrCode, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StaffCheckinPage() {
  const { t } = useTranslation();

  const handleLaunchKiosk = () => {
    window.open('/checkin-display', '_blank');
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={t('staff.checkinTitle')}
        subtitle={t('staff.checkinSubtitle')}
      />

      <Section className="mt-4">
        <div className="flex flex-col items-center text-center py-8 space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <QrCode className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2 max-w-[280px]">
            <h2 className="text-lg font-bold text-foreground">
              {t('staff.checkinKioskTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('staff.checkinKioskDescription')}
            </p>
          </div>

          <Button onClick={handleLaunchKiosk} size="lg" className="gap-2">
            <Monitor className="h-5 w-5" />
            {t('staff.launchKiosk')}
            <ExternalLink className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground max-w-[260px]">
            {t('staff.checkinKioskHint')}
          </p>
        </div>
      </Section>
    </div>
  );
}
