import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Package,
  QrCode,
  CreditCard,
  FileText,
  Clock,
  User,
  Bell,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { VersionBadge } from '@/components/roadmap';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const MemberAppPreview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Calendar,
      label: t('roadmap.memberApp.menu.schedule'),
      description: t('roadmap.memberApp.menu.scheduleDesc'),
    },
    {
      icon: Package,
      label: t('roadmap.memberApp.menu.packages'),
      description: t('roadmap.memberApp.menu.packagesDesc'),
    },
    {
      icon: QrCode,
      label: t('roadmap.memberApp.menu.checkin'),
      description: t('roadmap.memberApp.menu.checkinDesc'),
    },
    {
      icon: CreditCard,
      label: t('roadmap.memberApp.menu.payments'),
      description: t('roadmap.memberApp.menu.paymentsDesc'),
    },
    {
      icon: FileText,
      label: t('roadmap.memberApp.menu.contracts'),
      description: t('roadmap.memberApp.menu.contractsDesc'),
    },
  ];

  const bottomNav = [
    { icon: Home, label: t('roadmap.memberApp.nav.home') },
    { icon: Calendar, label: t('roadmap.memberApp.nav.book') },
    { icon: QrCode, label: t('roadmap.memberApp.nav.checkin') },
    { icon: Bell, label: t('roadmap.memberApp.nav.notifications') },
    { icon: User, label: t('roadmap.memberApp.nav.profile') },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('roadmap.memberApp.title')}
        breadcrumbs={[
          { label: t('roadmap.title'), href: '/coming-soon' },
          { label: t('roadmap.memberApp.title') },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/coming-soon')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Info section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <VersionBadge version="v0.0.2" status="inProgress" />
                <CardTitle>{t('roadmap.memberApp.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('roadmap.memberApp.fullDescription')}
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {t('roadmap.memberApp.keyFeatures')}
                </h4>
                <ul className="space-y-2">
                  {[
                    t('roadmap.memberApp.features.booking'),
                    t('roadmap.memberApp.features.packages'),
                    t('roadmap.memberApp.features.qrCheckin'),
                    t('roadmap.memberApp.features.payments'),
                    t('roadmap.memberApp.features.contracts'),
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Clock className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {t('roadmap.memberApp.lineNote')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center">
          <div className="relative w-[280px]">
            {/* Phone frame */}
            <div className="bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
              <div className="bg-background rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="h-6 bg-muted flex items-center justify-center">
                  <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                </div>

                {/* App content */}
                <div className="h-[500px] overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-primary text-primary-foreground">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">MOOM CLUB</span>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t('roadmap.memberApp.mockup.welcome')}
                        </p>
                        <p className="text-xs opacity-80">M-000001</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-4 space-y-3">
                    {menuItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coming soon overlay */}
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                    <div className="text-center p-6">
                      <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-bold text-lg mb-2">
                        {t('roadmap.comingSoon')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('roadmap.memberApp.comingSoonText')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="flex items-center justify-around py-2 border-t bg-background">
                  {bottomNav.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center gap-0.5 px-2',
                        i === 0 ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberAppPreview;
