import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, CalendarDays, Package, QrCode, User } from 'lucide-react';
import { LiffProvider, useLiff } from '@/contexts/LiffContext';
import { LiffBottomNav, type NavItem } from '@/components/liff/LiffBottomNav';
import { LiffComingSoon } from '@/components/liff/LiffComingSoon';
import { Loader2 } from 'lucide-react';

const MemberHome: React.FC = () => {
  const { t } = useTranslation();
  const { lineProfile, memberData, isLinked } = useLiff();

  return (
    <div className="px-4 pt-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {lineProfile?.pictureUrl ? (
          <img
            src={lineProfile.pictureUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {t('liff.member.welcome', {
              name: memberData?.nickname || lineProfile?.displayName || t('liff.member.guest'),
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLinked ? t('liff.member.linked') : t('liff.member.notLinked')}
          </p>
        </div>
      </div>

      {/* Quick stats placeholder */}
      {isLinked && memberData ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">{t('liff.member.memberId')}</p>
            <p className="text-base font-mono font-semibold text-foreground">{memberData.member_id}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">{t('liff.member.nextClass')}</p>
            <p className="text-sm text-muted-foreground italic">{t('liff.comingSoonDescription')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('liff.member.linkPrompt')}</p>
        </div>
      )}
    </div>
  );
};

const MemberAppContent: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const { isLoading } = useLiff();

  const navItems: NavItem[] = [
    { id: 'home', label: t('liff.nav.home'), icon: <Home className="w-5 h-5" /> },
    { id: 'booking', label: t('liff.nav.booking'), icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'packages', label: t('liff.nav.packages'), icon: <Package className="w-5 h-5" /> },
    { id: 'checkin', label: t('liff.nav.checkin'), icon: <QrCode className="w-5 h-5" /> },
    { id: 'profile', label: t('liff.nav.profile'), icon: <User className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MemberHome />;
      case 'booking':
        return <LiffComingSoon title={t('liff.nav.booking')} />;
      case 'packages':
        return <LiffComingSoon title={t('liff.nav.packages')} />;
      case 'checkin':
        return <LiffComingSoon title={t('liff.nav.checkin')} />;
      case 'profile':
        return <LiffComingSoon title={t('liff.nav.profile')} />;
      default:
        return <MemberHome />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <LiffBottomNav items={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const LiffMemberApp: React.FC = () => {
  return (
    <LiffProvider>
      <MemberAppContent />
    </LiffProvider>
  );
};

export default LiffMemberApp;
