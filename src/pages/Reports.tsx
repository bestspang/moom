import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, EmptyState } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const { t } = useLanguage();

  const memberReports = [
    { title: t('reports.activeMembersOverTime'), description: 'Track active member trends' },
    { title: t('reports.membersAtRisk'), description: 'View at-risk members by package expiry' },
    { title: t('reports.membersPackageUsage'), description: 'Analyze package usage patterns' },
    { title: t('reports.membersPackageAtRisk'), description: 'Monitor at-risk packages' },
  ];

  const classReports = [
    { title: t('reports.classCapacityByHour'), description: 'View capacity by time of day' },
    { title: t('reports.classCapacityOverTime'), description: 'Track capacity trends' },
    { title: t('reports.classCategoryPopularity'), description: 'Category rankings' },
    { title: t('reports.classPopularity'), description: 'Class attendance rankings' },
  ];

  const packageReports = [
    { title: t('reports.packageSales'), description: 'Compare package sales' },
    { title: t('reports.packageSalesOverTime'), description: 'Sales trend analysis' },
  ];

  const ReportCard = ({ title, description }: { title: string; description: string }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader title={t('reports.title')} breadcrumbs={[{ label: t('reports.title') }]} />
      <Tabs defaultValue="member">
        <TabsList><TabsTrigger value="member">{t('reports.member')}</TabsTrigger><TabsTrigger value="class">{t('reports.class')}</TabsTrigger><TabsTrigger value="package">{t('reports.package')}</TabsTrigger></TabsList>
        <TabsContent value="member" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{memberReports.map((r) => <ReportCard key={r.title} {...r} />)}</div>
        </TabsContent>
        <TabsContent value="class" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{classReports.map((r) => <ReportCard key={r.title} {...r} />)}</div>
        </TabsContent>
        <TabsContent value="package" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{packageReports.map((r) => <ReportCard key={r.title} {...r} />)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
