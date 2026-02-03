import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { ManageDropdown } from './ManageDropdown';

interface ReportPageLayoutProps {
  title: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  updatedAt?: Date;
}

export const ReportPageLayout = ({
  title,
  children,
  onExportCSV,
  onExportPDF,
  onPrint,
  updatedAt = new Date(),
}: ReportPageLayoutProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const locale = language === 'th' ? th : enUS;

  const formattedDate = format(updatedAt, 'd MMM yyyy, HH:mm', { locale });

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/report')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground">{t('nav.reports')}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium truncate">{title}</span>
      </div>

      {/* Title + Timestamp + Manage */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>
              {t('reports.updatedAt')} {formattedDate} (Bangkok GMT +07:00)
            </span>
          </p>
        </div>
        <ManageDropdown
          onExportCSV={onExportCSV}
          onExportPDF={onExportPDF}
          onPrint={onPrint}
        />
      </div>

      {/* Content */}
      {children}
    </div>
  );
};
