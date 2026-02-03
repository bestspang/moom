import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

  const handleMembersAtRisk = () => {
    navigate('/report/member/members-at-risk');
  };

  const memberReports = [
    { title: t('reports.activeMembersOverTime'), description: 'Track active member trends', onClick: handleComingSoon },
    { title: t('reports.membersAtRisk'), description: 'View at-risk members by package expiry', onClick: handleMembersAtRisk },
    { title: t('reports.membersPackageUsage'), description: 'Analyze package usage patterns', onClick: handleComingSoon },
    { title: t('reports.membersPackageAtRisk'), description: 'Monitor at-risk packages', onClick: handleComingSoon },
  ];

  const classReports = [
    { title: t('reports.classCapacityByHour'), description: 'View capacity by time of day', onClick: handleComingSoon },
    { title: t('reports.classCapacityOverTime'), description: 'Track capacity trends', onClick: handleComingSoon },
    { title: t('reports.classCategoryPopularity'), description: 'Category rankings', onClick: handleComingSoon },
    { title: t('reports.classPopularity'), description: 'Class attendance rankings', onClick: handleComingSoon },
  ];

  const packageReports = [
    { title: t('reports.packageSales'), description: 'Compare package sales', onClick: handleComingSoon },
    { title: t('reports.packageSalesOverTime'), description: 'Sales trend analysis', onClick: handleComingSoon },
  ];

  const ReportCard = ({ title, description, onClick }: { title: string; description: string; onClick: () => void }) => (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{memberReports.map((r) => <ReportCard key={r.title} title={r.title} description={r.description} onClick={r.onClick} />)}</div>
        </TabsContent>
        <TabsContent value="class" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{classReports.map((r) => <ReportCard key={r.title} title={r.title} description={r.description} onClick={r.onClick} />)}</div>
        </TabsContent>
        <TabsContent value="package" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{packageReports.map((r) => <ReportCard key={r.title} title={r.title} description={r.description} onClick={r.onClick} />)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
