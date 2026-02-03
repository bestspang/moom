import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportItemProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: 'view' | 'export';
  onClick: () => void;
}

const ReportItem = ({ title, description, buttonText, buttonVariant, onClick }: ReportItemProps) => (
  <div className="py-4 border-b last:border-0">
    <h3 className="text-primary font-medium mb-1">{title}</h3>
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
      <p className="text-sm text-muted-foreground flex-1">{description}</p>
      <Button
        variant="outline"
        className="shrink-0 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
        onClick={onClick}
      >
        {buttonVariant === 'export' && <Download className="h-4 w-4 mr-2" />}
        {buttonText}
      </Button>
    </div>
  </div>
);

const Reports = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleComingSoon = () => {
    toast({
      title: t('reportsExtra.comingSoon'),
      description: t('reportsExtra.comingSoonDescription'),
    });
  };

  const memberReports = [
    {
      title: t('reports.activeMembersTitle'),
      description: t('reports.activeMembersDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/member/active-members'),
    },
    {
      title: t('reports.membersAtRisk'),
      description: t('reports.membersAtRiskDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/member/members-at-risk'),
    },
    {
      title: t('reports.membersPackageUsage'),
      description: t('reports.packageUsageDesc'),
      buttonText: t('reports.exportReport'),
      buttonVariant: 'export' as const,
      onClick: handleComingSoon,
    },
    {
      title: t('reports.membersPackageAtRisk'),
      description: t('reports.packageAtRiskDesc'),
      buttonText: t('reports.exportReport'),
      buttonVariant: 'export' as const,
      onClick: handleComingSoon,
    },
  ];

  const classReports = [
    {
      title: t('reports.classCapacityByHourTitle'),
      description: t('reports.classCapacityByHourDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/capacity-by-hour'),
    },
    {
      title: t('reports.classCapacityTitle'),
      description: t('reports.classCapacityDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/capacity-over-time'),
    },
    {
      title: t('reports.classCategoryPopularity'),
      description: t('reports.classCategoryPopularityDesc'),
      buttonText: t('reports.exportReport'),
      buttonVariant: 'export' as const,
      onClick: handleComingSoon,
    },
    {
      title: t('reports.classPopularity'),
      description: t('reports.classPopularityDesc'),
      buttonText: t('reports.exportReport'),
      buttonVariant: 'export' as const,
      onClick: handleComingSoon,
    },
  ];

  const packageReports = [
    {
      title: t('reports.packageSalesTitle'),
      description: t('reports.packageSalesDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/package/sales'),
    },
    {
      title: t('reports.packageSalesOverTimeTitle'),
      description: t('reports.packageSalesOverTimeDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/package/sales-over-time'),
    },
  ];

  return (
    <div>
      <PageHeader title={t('reports.title')} breadcrumbs={[{ label: t('reports.title') }]} />
      <Tabs defaultValue="member">
        <TabsList className="mb-6">
          <TabsTrigger value="member">{t('reports.member')}</TabsTrigger>
          <TabsTrigger value="class">{t('reports.class')}</TabsTrigger>
          <TabsTrigger value="package">{t('reports.package')}</TabsTrigger>
        </TabsList>
        <TabsContent value="member">
          <div className="divide-y">
            {memberReports.map((r) => (
              <ReportItem
                key={r.title}
                title={r.title}
                description={r.description}
                buttonText={r.buttonText}
                buttonVariant={r.buttonVariant}
                onClick={r.onClick}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="class">
          <div className="divide-y">
            {classReports.map((r) => (
              <ReportItem
                key={r.title}
                title={r.title}
                description={r.description}
                buttonText={r.buttonText}
                buttonVariant={r.buttonVariant}
                onClick={r.onClick}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="package">
          <div className="divide-y">
            {packageReports.map((r) => (
              <ReportItem
                key={r.title}
                title={r.title}
                description={r.description}
                buttonText={r.buttonText}
                buttonVariant={r.buttonVariant}
                onClick={r.onClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
