import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PurchasePackageDialog } from '@/components/members/PurchasePackageDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import {
  ArrowLeft, Phone, Mail, MapPin, User, Calendar,
  DollarSign, FileText, AlertTriangle, PauseCircle,
  ClipboardList, Activity, Copy, ShoppingBag, Pencil,
  LayoutDashboard, Wallet, Trophy, Clock,
} from 'lucide-react';
import { LineIdentityCard } from '@/components/common/LineIdentityCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, EmptyState } from '@/components/common';
import { useEngagementScore } from '@/hooks/useEngagementScores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useUpdateMember } from '@/hooks/useMemberDetails';
import { toast } from 'sonner';
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
  MemberOverviewTab,
  MemberRecordsTab,
  MemberAttendanceTab,
  MemberPackagesTab,
  MemberBillingTab,
  MemberInjuriesTab,
  MemberSuspensionsTab,
  MemberContractsTab,
} from '@/components/members/tabs';

const MemberDetails = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deskNotes, setDeskNotes] = useState('');

  // Fetch all member data
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: packages = [], isLoading: packagesLoading } = useMemberPackages(id);
  const { data: attendance = [], isLoading: attendanceLoading } = useMemberAttendance(id);
  const { data: billing = [], isLoading: billingLoading } = useMemberBilling(id);
  const { data: notes = [], isLoading: notesLoading } = useMemberNotes(id);
  const { data: injuries = [], isLoading: injuriesLoading } = useMemberInjuries(id);
  const { data: suspensions = [], isLoading: suspensionsLoading } = useMemberSuspensions(id);
  const { data: contracts = [], isLoading: contractsLoading } = useMemberContracts(id);
  const { data: summaryStats } = useMemberSummaryStats(id);
  const { data: engagementScore } = useEngagementScore(id);

  const updateMember = useUpdateMember();

  const tabs = [
    { value: 'overview', label: t('members.tabs.overview'), icon: LayoutDashboard },
    { value: 'attendance', label: t('members.tabs.attendance'), icon: Calendar },
    { value: 'packages', label: t('members.tabs.packages'), icon: DollarSign },
    { value: 'billing', label: t('members.tabs.billing'), icon: Wallet },
    { value: 'injuries', label: t('members.tabs.injuries'), icon: AlertTriangle },
    { value: 'records', label: t('members.tabs.records'), icon: ClipboardList },
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

  useEffect(() => {
    if (member?.notes !== undefined) {
      setDeskNotes(member.notes || '');
    }
  }, [member?.notes]);

  const handleDeskNotesBlur = useCallback(() => {
    if (!member || deskNotes === (member.notes || '')) return;
    updateMember.mutate({ id: member.id, data: { notes: deskNotes }, oldData: { notes: member.notes } });
  }, [member, deskNotes, updateMember]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${t('members.copied')} ${label}`);
  };

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
  const hasActiveSuspension = suspensions.some((s) => s.is_active);

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
        {/* ===== LEFT SIDEBAR ===== */}
        <div className="space-y-4">
          {/* Avatar + Name Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20">
                  {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {member.first_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{member.member_id}</span>
                    <StatusBadge variant={getStatusVariant(member.status) as any}>
                      {member.status || 'active'}
                    </StatusBadge>
                  </div>
                  <h2 className="text-lg font-bold mt-1">
                    {member.first_name} {member.last_name}
                  </h2>
                  {member.nickname && (
                    <p className="text-sm text-muted-foreground">({member.nickname})</p>
                  )}
                </div>
                {member.address && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{member.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Card — clickable */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {member.phone && (
                <div className="flex items-center gap-3 group">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{t('members.phone')}</p>
                    <a href={`tel:${member.phone}`} className="text-sm font-medium text-primary hover:underline">
                      {member.phone}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(member.phone!, t('members.phone'))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-3 group">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{t('members.email')}</p>
                    <a href={`mailto:${member.email}`} className="text-sm font-medium text-primary hover:underline truncate block">
                      {member.email}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(member.email!, t('members.email'))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {(member.emergency_contact_name || member.emergency_contact_phone) && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{t('members.emergencyContact')}</p>
                    {member.emergency_contact_name && (
                      <p className="text-sm font-medium">{member.emergency_contact_name}</p>
                    )}
                    {member.emergency_contact_phone && (
                      <a href={`tel:${member.emergency_contact_phone}`} className="text-xs text-primary hover:underline">
                        {member.emergency_contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Score Mini-Card */}
          {engagementScore && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-2">{t('members.engagement')}</p>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                        strokeDasharray={`${(engagementScore.score / 100) * 97.4} 97.4`}
                        strokeLinecap="round"
                        className={
                          engagementScore.level === 'high' ? 'stroke-green-500' :
                          engagementScore.level === 'medium' ? 'stroke-yellow-500' :
                          'stroke-red-500'
                        }
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {engagementScore.score}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize">
                      {engagementScore.level === 'high' ? t('members.engagementHigh') :
                       engagementScore.level === 'medium' ? t('members.engagementMedium') :
                       t('members.engagementLow')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('members.engagement')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">{t('members.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('members.editProfile')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9"
                onClick={() => setPurchaseOpen(true)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('members.purchasePackage')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9"
                onClick={() => setActiveTab('packages')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {t('members.tabs.packages')}
              </Button>
              <Button
                variant={hasActiveSuspension ? 'default' : 'outline'}
                className="w-full justify-start text-sm h-9"
                onClick={() => setActiveTab('suspensions')}
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                {hasActiveSuspension ? t('members.manageSuspension') : t('members.suspendMember')}
              </Button>
            </CardContent>
          </Card>

          {/* Front Desk Notes — moved to sidebar */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">{t('members.frontDeskNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <Textarea
                placeholder={t('members.frontDeskNotesPlaceholder')}
                className="min-h-[80px] text-sm"
                value={deskNotes}
                onChange={(e) => setDeskNotes(e.target.value)}
                onBlur={handleDeskNotesBlur}
              />
            </CardContent>
          </Card>

          <LineIdentityCard ownerType="member" ownerId={member.id} />
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stat Cards with icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('members.memberSince')}
              value={formatDate(member.member_since)}
              subtitle={`${daysSinceJoin} ${t('common.days')}`}
              color="teal"
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              title={t('members.mostAttendedCategory')}
              value={summaryStats?.mostAttendedCategory || member.most_attended_category || '-'}
              color="orange"
              icon={<Trophy className="h-5 w-5" />}
            />
            <StatCard
              title={t('members.amountSpent')}
              value={formatCurrency(summaryStats?.totalSpent ?? member.total_spent ?? 0)}
              color="blue"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              title={t('members.daysUntilExpiry')}
              value={daysUntilExpiry}
              subtitle={t('common.days')}
              color="gray"
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          {/* Tabs — consolidated 7 tabs with icons */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger key={tab.value} value={tab.value} className="text-sm gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <MemberOverviewTab
                    member={member}
                    attendance={attendance}
                    packages={packages}
                    suspensions={suspensions}
                    getStatusVariant={getStatusVariant}
                    onEditProfile={() => setEditOpen(true)}
                  />
                </TabsContent>
                <TabsContent value="attendance" className="mt-6">
                  <MemberAttendanceTab attendance={attendance} isLoading={attendanceLoading} />
                </TabsContent>
                <TabsContent value="packages" className="mt-6">
                  <MemberPackagesTab packages={packages} isLoading={packagesLoading} onPurchase={() => setPurchaseOpen(true)} />
                </TabsContent>
                <TabsContent value="billing" className="mt-6">
                  <MemberBillingTab billing={billing} memberId={id!} isLoading={billingLoading} />
                </TabsContent>
                <TabsContent value="injuries" className="mt-6">
                  <MemberInjuriesTab memberId={id!} injuries={injuries} isLoading={injuriesLoading} />
                </TabsContent>
                <TabsContent value="records" className="mt-6">
                  <MemberRecordsTab memberId={id!} notes={notes} isLoading={notesLoading} />
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
        </div>
      </div>

      <PurchasePackageDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        memberId={member.id}
        memberName={`${member.first_name} ${member.last_name}`}
      />

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member as any}
      />
    </div>
  );
};

export default MemberDetails;
