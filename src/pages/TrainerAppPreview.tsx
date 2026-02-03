import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  Clock,
  User,
  Bell,
  Home,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { VersionBadge } from '@/components/roadmap';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const TrainerAppPreview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Calendar,
      label: t('roadmap.trainerApp.menu.todaySchedule'),
      description: t('roadmap.trainerApp.menu.todayScheduleDesc'),
      badge: '5',
    },
    {
      icon: ClipboardCheck,
      label: t('roadmap.trainerApp.menu.attendance'),
      description: t('roadmap.trainerApp.menu.attendanceDesc'),
    },
    {
      icon: FileText,
      label: t('roadmap.trainerApp.menu.ptLog'),
      description: t('roadmap.trainerApp.menu.ptLogDesc'),
    },
    {
      icon: Users,
      label: t('roadmap.trainerApp.menu.memberView'),
      description: t('roadmap.trainerApp.menu.memberViewDesc'),
    },
    {
      icon: AlertTriangle,
      label: t('roadmap.trainerApp.menu.incidents'),
      description: t('roadmap.trainerApp.menu.incidentsDesc'),
    },
  ];

  const bottomNav = [
    { icon: Home, label: t('roadmap.trainerApp.nav.home') },
    { icon: Calendar, label: t('roadmap.trainerApp.nav.schedule') },
    { icon: ClipboardCheck, label: t('roadmap.trainerApp.nav.checkin') },
    { icon: Bell, label: t('roadmap.trainerApp.nav.alerts') },
    { icon: User, label: t('roadmap.trainerApp.nav.profile') },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('roadmap.trainerApp.title')}
        breadcrumbs={[
          { label: t('roadmap.title'), href: '/coming-soon' },
          { label: t('roadmap.trainerApp.title') },
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
                <CardTitle>{t('roadmap.trainerApp.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('roadmap.trainerApp.fullDescription')}
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {t('roadmap.trainerApp.keyFeatures')}
                </h4>
                <ul className="space-y-2">
                  {[
                    t('roadmap.trainerApp.features.todaySchedule'),
                    t('roadmap.trainerApp.features.attendance'),
                    t('roadmap.trainerApp.features.ptLog'),
                    t('roadmap.trainerApp.features.memberView'),
                    t('roadmap.trainerApp.features.noShow'),
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
                  {t('roadmap.trainerApp.lineNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Design principle */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold mb-1">
                    {t('roadmap.trainerApp.designPrinciple')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('roadmap.trainerApp.designPrincipleDesc')}
                  </p>
                </div>
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
                  <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">
                        {t('roadmap.trainerApp.mockup.title')}
                      </span>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t('roadmap.trainerApp.mockup.welcome')}
                        </p>
                        <p className="text-xs opacity-80">
                          {t('roadmap.trainerApp.mockup.todayClasses')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex gap-2 p-3 bg-muted/30">
                    <div className="flex-1 p-2 bg-background rounded-lg text-center">
                      <p className="text-lg font-bold text-primary">5</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('roadmap.trainerApp.mockup.classes')}
                      </p>
                    </div>
                    <div className="flex-1 p-2 bg-background rounded-lg text-center">
                      <p className="text-lg font-bold text-accent-teal">24</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('roadmap.trainerApp.mockup.members')}
                      </p>
                    </div>
                    <div className="flex-1 p-2 bg-background rounded-lg text-center">
                      <p className="text-lg font-bold text-warning">2</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('roadmap.trainerApp.mockup.pt')}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-3 space-y-2">
                    {menuItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
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
                        {t('roadmap.trainerApp.comingSoonText')}
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

export default TrainerAppPreview;
