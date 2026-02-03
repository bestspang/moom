import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Dumbbell,
  Bell,
  CreditCard,
  QrCode,
  Shield,
  Users,
  MessageSquare,
  Target,
  Check,
  Zap,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { RoadmapCard, FeatureCard } from '@/components/roadmap';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';

const ComingSoon = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const roadmapVersions = [
    {
      version: 'v0.0.1',
      title: t('roadmap.v001.title'),
      description: t('roadmap.v001.description'),
      status: 'completed' as const,
      features: [
        {
          icon: Calendar,
          title: t('roadmap.console.title'),
          description: t('roadmap.console.description'),
          features: [
            t('roadmap.console.features.dashboard'),
            t('roadmap.console.features.members'),
            t('roadmap.console.features.packages'),
            t('roadmap.console.features.schedule'),
            t('roadmap.console.features.finance'),
            t('roadmap.console.features.reports'),
          ],
          status: 'done' as const,
        },
      ],
    },
    {
      version: 'v0.0.2',
      title: t('roadmap.v002.title'),
      description: t('roadmap.v002.description'),
      status: 'inProgress' as const,
      progress: 15,
      features: [
        {
          icon: Smartphone,
          title: t('roadmap.memberApp.title'),
          description: t('roadmap.memberApp.description'),
          features: [
            t('roadmap.memberApp.features.booking'),
            t('roadmap.memberApp.features.packages'),
            t('roadmap.memberApp.features.qrCheckin'),
            t('roadmap.memberApp.features.payments'),
            t('roadmap.memberApp.features.contracts'),
          ],
          status: 'inProgress' as const,
          onPreview: () => navigate('/member-app'),
        },
        {
          icon: Dumbbell,
          title: t('roadmap.trainerApp.title'),
          description: t('roadmap.trainerApp.description'),
          features: [
            t('roadmap.trainerApp.features.todaySchedule'),
            t('roadmap.trainerApp.features.attendance'),
            t('roadmap.trainerApp.features.ptLog'),
            t('roadmap.trainerApp.features.memberView'),
            t('roadmap.trainerApp.features.noShow'),
          ],
          status: 'planned' as const,
          onPreview: () => navigate('/trainer-app'),
        },
        {
          icon: Bell,
          title: t('roadmap.notifications.title'),
          description: t('roadmap.notifications.description'),
          features: [
            t('roadmap.notifications.features.bookingConfirm'),
            t('roadmap.notifications.features.classReminder'),
            t('roadmap.notifications.features.packageExpiry'),
            t('roadmap.notifications.features.promotions'),
          ],
          status: 'planned' as const,
        },
      ],
    },
    {
      version: 'v0.0.3',
      title: t('roadmap.v003.title'),
      description: t('roadmap.v003.description'),
      status: 'planned' as const,
      features: [
        {
          icon: CreditCard,
          title: t('roadmap.payments.title'),
          description: t('roadmap.payments.description'),
          features: [
            t('roadmap.payments.features.promptpay'),
            t('roadmap.payments.features.slipUpload'),
            t('roadmap.payments.features.autoVerify'),
            t('roadmap.payments.features.receipts'),
          ],
          status: 'planned' as const,
        },
        {
          icon: QrCode,
          title: t('roadmap.qrCheckin.title'),
          description: t('roadmap.qrCheckin.description'),
          features: [
            t('roadmap.qrCheckin.features.dynamicQr'),
            t('roadmap.qrCheckin.features.antiFraud'),
            t('roadmap.qrCheckin.features.usageLedger'),
            t('roadmap.qrCheckin.features.realtime'),
          ],
          status: 'planned' as const,
        },
        {
          icon: Shield,
          title: t('roadmap.security.title'),
          description: t('roadmap.security.description'),
          features: [
            t('roadmap.security.features.pdpa'),
            t('roadmap.security.features.consent'),
            t('roadmap.security.features.dataRetention'),
            t('roadmap.security.features.auditLog'),
          ],
          status: 'planned' as const,
        },
      ],
    },
    {
      version: 'v0.1.0',
      title: t('roadmap.v010.title'),
      description: t('roadmap.v010.description'),
      status: 'planned' as const,
      features: [
        {
          icon: Target,
          title: t('roadmap.retention.title'),
          description: t('roadmap.retention.description'),
          features: [
            t('roadmap.retention.features.riskAlert'),
            t('roadmap.retention.features.oneClick'),
            t('roadmap.retention.features.autoMessage'),
            t('roadmap.retention.features.winback'),
          ],
          status: 'planned' as const,
        },
        {
          icon: MessageSquare,
          title: t('roadmap.campaigns.title'),
          description: t('roadmap.campaigns.description'),
          features: [
            t('roadmap.campaigns.features.birthday'),
            t('roadmap.campaigns.features.renewal'),
            t('roadmap.campaigns.features.promo'),
            t('roadmap.campaigns.features.targeting'),
          ],
          status: 'planned' as const,
        },
        {
          icon: Users,
          title: t('roadmap.crm.title'),
          description: t('roadmap.crm.description'),
          features: [
            t('roadmap.crm.features.timeline'),
            t('roadmap.crm.features.interactions'),
            t('roadmap.crm.features.notes'),
            t('roadmap.crm.features.insights'),
          ],
          status: 'planned' as const,
        },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={t('roadmap.title')}
        breadcrumbs={[{ label: t('roadmap.title') }]}
      />

      {/* Hero section */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">MOOM CLUB</h2>
            <p className="text-muted-foreground">
              {t('roadmap.heroSubtitle')}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent-teal" />
              <span className="text-sm font-medium">v0.0.1</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Console Admin
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">v0.0.2</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('roadmap.currentlyBuilding')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">LIFF Apps</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('roadmap.comingSoon')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">LINE Push</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('roadmap.comingSoon')}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Roadmap timeline */}
      <div className="space-y-6">
        {roadmapVersions.map((version) => (
          <RoadmapCard
            key={version.version}
            version={version.version}
            title={version.title}
            description={version.description}
            status={version.status}
            progress={version.progress}
            defaultOpen={version.status === 'inProgress'}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {version.features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  features={feature.features}
                  status={feature.status}
                  onPreview={feature.onPreview}
                />
              ))}
            </div>
          </RoadmapCard>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          {t('roadmap.footerNote')}
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
