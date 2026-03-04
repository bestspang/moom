import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ClipboardCheck, Dumbbell, Users, Loader2 } from 'lucide-react';
import { LiffProvider, useLiff } from '@/contexts/LiffContext';
import { LiffBottomNav, type NavItem } from '@/components/liff/LiffBottomNav';
import { LiffComingSoon } from '@/components/liff/LiffComingSoon';

const TrainerAppContent: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('schedule');
  const { isLoading } = useLiff();

  const navItems: NavItem[] = [
    { id: 'schedule', label: t('liff.trainerNav.schedule'), icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'attendance', label: t('liff.trainerNav.attendance'), icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'ptlog', label: t('liff.trainerNav.ptLog'), icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'members', label: t('liff.trainerNav.members'), icon: <Users className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiffComingSoon title={t(`liff.trainerNav.${activeTab === 'ptlog' ? 'ptLog' : activeTab}`)} />
      <LiffBottomNav items={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const LiffTrainerApp: React.FC = () => {
  return (
    <LiffProvider>
      <TrainerAppContent />
    </LiffProvider>
  );
};

export default LiffTrainerApp;
