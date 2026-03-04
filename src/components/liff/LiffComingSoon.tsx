import React from 'react';
import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LiffComingSoonProps {
  title: string;
  description?: string;
}

export const LiffComingSoon: React.FC<LiffComingSoonProps> = ({ title, description }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        {description || t('liff.comingSoonDescription')}
      </p>
    </div>
  );
};
