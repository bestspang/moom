import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertTriangle, 
  Package, 
  Clock, 
  BarChart3, 
  TrendingUp,
  Calendar,
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportItem } from '@/components/reports/ReportItem';

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
      icon: <Users className="h-5 w-5" />,
      accentColor: 'primary' as const,
    },
    {
      title: t('reports.membersAtRisk'),
      description: t('reports.membersAtRiskDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/member/members-at-risk'),
      icon: <AlertTriangle className="h-5 w-5" />,
      accentColor: 'warning' as const,
    },
    {
      title: t('reports.membersPackageUsage'),
      description: t('reports.packageUsageDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/member/package-usage'),
      icon: <Package className="h-5 w-5" />,
      accentColor: 'teal' as const,
    },
    {
      title: t('reports.membersPackageAtRisk'),
      description: t('reports.packageAtRiskDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/member/package-at-risk'),
      icon: <AlertTriangle className="h-5 w-5" />,
      accentColor: 'warning' as const,
    },
  ];

  const classReports = [
    {
      title: t('reports.classCapacityByHourTitle'),
      description: t('reports.classCapacityByHourDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/capacity-by-hour'),
      icon: <Clock className="h-5 w-5" />,
      accentColor: 'teal' as const,
    },
    {
      title: t('reports.classCapacityTitle'),
      description: t('reports.classCapacityDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/capacity-over-time'),
      icon: <TrendingUp className="h-5 w-5" />,
      accentColor: 'primary' as const,
    },
    {
      title: t('reports.classCategoryPopularity'),
      description: t('reports.classCategoryPopularityDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/category-popularity'),
      icon: <PieChart className="h-5 w-5" />,
      accentColor: 'purple' as const,
    },
    {
      title: t('reports.classPopularity'),
      description: t('reports.classPopularityDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/class/popularity'),
      icon: <BarChart3 className="h-5 w-5" />,
      accentColor: 'purple' as const,
    },
  ];

  const packageReports = [
    {
      title: t('reports.packageSalesTitle'),
      description: t('reports.packageSalesDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/package/sales'),
      icon: <BarChart3 className="h-5 w-5" />,
      accentColor: 'teal' as const,
    },
    {
      title: t('reports.packageSalesOverTimeTitle'),
      description: t('reports.packageSalesOverTimeDesc'),
      buttonText: t('reports.viewFullReport'),
      buttonVariant: 'view' as const,
      onClick: () => navigate('/report/package/sales-over-time'),
      icon: <Calendar className="h-5 w-5" />,
      accentColor: 'primary' as const,
    },
  ];

  return (
    <div>
      <PageHeader title={t('reports.title')} breadcrumbs={[{ label: t('reports.title') }]} />
      <Tabs defaultValue="member">
        <TabsList className="mb-6">
          <TabsTrigger value="member" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t('reports.member')}
          </TabsTrigger>
          <TabsTrigger value="class" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            {t('reports.class')}
          </TabsTrigger>
          <TabsTrigger value="package" className="gap-1.5">
            <Package className="h-4 w-4" />
            {t('reports.package')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="member" className="space-y-0">
          {memberReports.map((r) => (
            <ReportItem
              key={r.title}
              title={r.title}
              description={r.description}
              buttonText={r.buttonText}
              buttonVariant={r.buttonVariant}
              onClick={r.onClick}
              disabled={'disabled' in r ? Boolean((r as any).disabled) : undefined}
              icon={r.icon}
              accentColor={r.accentColor}
            />
          ))}
        </TabsContent>
        <TabsContent value="class" className="space-y-0">
          {classReports.map((r) => (
            <ReportItem
              key={r.title}
              title={r.title}
              description={r.description}
              buttonText={r.buttonText}
              buttonVariant={r.buttonVariant}
              onClick={r.onClick}
              disabled={'disabled' in r ? Boolean((r as any).disabled) : undefined}
              icon={r.icon}
              accentColor={r.accentColor}
            />
          ))}
        </TabsContent>
        <TabsContent value="package" className="space-y-0">
          {packageReports.map((r) => (
            <ReportItem
              key={r.title}
              title={r.title}
              description={r.description}
              buttonText={r.buttonText}
              buttonVariant={r.buttonVariant}
              onClick={r.onClick}
              icon={r.icon}
              accentColor={r.accentColor}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
