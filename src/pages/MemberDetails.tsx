import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PurchasePackageDialog } from '@/components/members/PurchasePackageDialog';
import { ArrowLeft, Camera, Phone, Mail, MapPin, User, Calendar, DollarSign, FileText, AlertTriangle, PauseCircle, ClipboardList, Activity } from 'lucide-react';
import { LineIdentityCard } from '@/components/common/LineIdentityCard';
import { MemberCommunicationLog } from '@/components/members/MemberCommunicationLog';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/common';
import { useEngagementScore } from '@/hooks/useEngagementScores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useUpdateMember } from '@/hooks/useMemberDetails';
import {
  useMember,
  useMemberPackages,
  useMemberAttendance,
  useMemberBilling,
  useMemberNotes,
  useMemberInjuries,
  useMemberSuspensions,
  useMemberContracts,
  useMemberSummaryStats,
  calculateDaysUntilExpiry,
  calculateDaysSinceJoin,
} from '@/hooks/useMemberDetails';

import {
  MemberHomeTab,
  MemberProfileTab,
  MemberAttendanceTab,
  MemberPackagesTab,
  MemberBillingTab,
  MemberInjuriesTab,
  MemberNotesTab,
  MemberSuspensionsTab,
  MemberContractsTab,
} from '@/components/members/tabs';

const MemberDetails = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [deskNotes, setDeskNotes] = useState('');

  // Fetch all member data
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: packages = [] } = useMemberPackages(id);
  const { data: attendance = [] } = useMemberAttendance(id);
  const { data: billing = [], isLoading: billingLoading } = useMemberBilling(id);
  const { data: notes = [], isLoading: notesLoading } = useMemberNotes(id);
  const { data: injuries = [], isLoading: injuriesLoading } = useMemberInjuries(id);
  const { data: suspensions = [], isLoading: suspensionsLoading } = useMemberSuspensions(id);
  const { data: contracts = [], isLoading: contractsLoading } = useMemberContracts(id);
  const { data: summaryStats } = useMemberSummaryStats(id);
  const { data: engagementScore } = useEngagementScore(id);
  const { isLoading: attendanceLoading } = useMemberAttendance(id);
  const { isLoading: packagesLoading } = useMemberPackages(id);

  const updateMember = useUpdateMember();

  const tabs = [
    { value: 'home', label: t('members.tabs.home'), icon: User },
    { value: 'profile', label: t('members.tabs.profile'), icon: User },
    { value: 'attendance', label: t('members.tabs.attendance'), icon: Calendar },
    { value: 'packages', label: t('members.tabs.packages'), icon: DollarSign },
    { value: 'billing', label: t('members.tabs.billing'), icon: DollarSign },
    { value: 'injuries', label: t('members.tabs.injuries'), icon: AlertTriangle },
    { value: 'notes', label: t('members.tabs.notes'), icon: ClipboardList },
    { value: 'communications', label: t('members.tabs.communications'), icon: Activity },
    { value: 'suspensions', label: t('members.tabs.suspensions'), icon: PauseCircle },
    { value: 'contract', label: t('members.tabs.contract'), icon: FileText },
  ];

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'suspended': return 'suspended';
      case 'inactive': return 'inactive';
      case 'on_hold': return 'suspended';
      default: return 'active';
    }
  };

  // Sync desk notes from server
  useEffect(() => {
    if (member?.notes !== undefined) {
      setDeskNotes(member.notes || '');
    }
  }, [member?.notes]);

  const handleDeskNotesBlur = useCallback(() => {
    if (!member || deskNotes === (member.notes || '')) return;
    updateMember.mutate({ id: member.id, data: { notes: deskNotes }, oldData: { notes: member.notes } });
  }, [member, deskNotes, updateMember]);

  if (memberLoading) {
    return (
      <div>
        <PageHeader
          title={t('members.memberDetails')}
          breadcrumbs={[
            { label: t('nav.people') },
            { label: t('members.title'), href: '/members' },
            { label: '...' },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-80" />
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div>
        <PageHeader
          title={t('members.memberDetails')}
          breadcrumbs={[
            { label: t('nav.people') },
            { label: t('members.title'), href: '/members' },
          ]}
        />
        <EmptyState message={t('members.notFound')} />
      </div>
    );
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(packages);
  const daysSinceJoin = calculateDaysSinceJoin(member.member_since);

  return (
    <div>
      <PageHeader
        title={t('members.memberDetails')}
        breadcrumbs={[
          { label: t('nav.people') },
          { label: t('members.title'), href: '/members' },
          { label: member.member_id },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/members')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Member info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {member.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">{member.member_id}</span>
                    <StatusBadge variant={getStatusVariant(member.status) as any}>{member.status || 'active'}</StatusBadge>
                    {engagementScore && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        engagementScore.level === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        engagementScore.level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <Activity className="h-3 w-3" />
                        {engagementScore.score}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-2">{member.first_name} {member.last_name}</h2>
                  {member.nickname && <p className="text-sm text-muted-foreground">({member.nickname})</p>}
                </div>
                {member.address && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{member.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {member.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('members.phone')}</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('members.email')}</p>
                    <p className="font-medium">{member.email}</p>
                  </div>
                </div>
              )}
              {(member.emergency_contact_name || member.emergency_contact_phone) && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('members.emergencyContact')}</p>
                    {member.emergency_contact_name && <p className="font-medium">{member.emergency_contact_name}</p>}
                    {member.emergency_contact_phone && <p className="text-sm">{member.emergency_contact_phone}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <LineIdentityCard ownerType="member" ownerId={member.id} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t('members.memberSince')} value={formatDate(member.member_since)} subtitle={`${daysSinceJoin} ${t('common.days')}`} color="teal" />
            <StatCard title={t('members.mostAttendedCategory')} value={summaryStats?.mostAttendedCategory || member.most_attended_category || '-'} color="orange" />
            <StatCard title={t('members.amountSpent')} value={formatCurrency(summaryStats?.totalSpent ?? member.total_spent ?? 0)} color="blue" />
            <StatCard title={t('members.daysUntilExpiry')} value={daysUntilExpiry} subtitle={t('common.days')} color="gray" />
          </div>

          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-sm">{tab.label}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="home" className="mt-6">
                  <MemberHomeTab member={member} attendance={attendance} packages={packages} suspensions={suspensions} getStatusVariant={getStatusVariant} />
                </TabsContent>
                <TabsContent value="profile" className="mt-6">
                  <MemberProfileTab member={member} />
                </TabsContent>
                <TabsContent value="attendance" className="mt-6">
                  <MemberAttendanceTab attendance={attendance} isLoading={attendanceLoading} />
                </TabsContent>
                <TabsContent value="packages" className="mt-6">
                  <MemberPackagesTab packages={packages} isLoading={packagesLoading} onPurchase={() => setPurchaseOpen(true)} />
                </TabsContent>
                <TabsContent value="billing" className="mt-6">
                  <MemberBillingTab billing={billing} isLoading={billingLoading} />
                </TabsContent>
                <TabsContent value="injuries" className="mt-6">
                  <MemberInjuriesTab memberId={id!} injuries={injuries} isLoading={injuriesLoading} />
                </TabsContent>
                <TabsContent value="notes" className="mt-6">
                  <MemberNotesTab memberId={id!} notes={notes} isLoading={notesLoading} />
                </TabsContent>
                <TabsContent value="communications" className="mt-6">
                  {id && <MemberCommunicationLog memberId={id} />}
                </TabsContent>
                <TabsContent value="suspensions" className="mt-6">
                  <MemberSuspensionsTab memberId={id!} suspensions={suspensions} isLoading={suspensionsLoading} />
                </TabsContent>
                <TabsContent value="contract" className="mt-6">
                  <MemberContractsTab memberId={id!} contracts={contracts} isLoading={contractsLoading} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('members.frontDeskNotes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t('members.frontDeskNotesPlaceholder')}
                className="min-h-[100px]"
                value={deskNotes}
                onChange={(e) => setDeskNotes(e.target.value)}
                onBlur={handleDeskNotesBlur}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <PurchasePackageDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        memberId={member.id}
        memberName={`${member.first_name} ${member.last_name}`}
      />
    </div>
  );
};

export default MemberDetails;
