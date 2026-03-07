import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Phone, Mail, MapPin, User, Calendar, DollarSign, FileText, AlertTriangle, PauseCircle, ClipboardList, Plus, Check, Activity } from 'lucide-react';
import { LineIdentityCard } from '@/components/common/LineIdentityCard';
import { MemberTimeline } from '@/components/members/MemberTimeline';
import { MemberCommunicationLog } from '@/components/members/MemberCommunicationLog';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, DataTable, EmptyState, type Column } from '@/components/common';
import { useEngagementScore } from '@/hooks/useEngagementScores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
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
  useCreateMemberNote,
  useUpdateMember,
  useCreateMemberInjury,
  useMarkInjuryRecovered,
  useCreateMemberSuspension,
  useEndMemberSuspension,
  useCreateMemberContract,
  calculateDaysUntilExpiry,
  calculateDaysSinceJoin,
  type MemberPackage,
  type MemberAttendance,
  type MemberBilling,
  type MemberNote,
  type MemberInjury,
  type MemberSuspension,
  type MemberContract,
} from '@/hooks/useMemberDetails';

const MemberDetails = () => {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [packageStatus, setPackageStatus] = useState('active');
  const [newNote, setNewNote] = useState('');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});

  // Injury form state
  const [injuryOpen, setInjuryOpen] = useState(false);
  const [injuryDesc, setInjuryDesc] = useState('');
  const [injuryDate, setInjuryDate] = useState('');
  const [injuryNotes, setInjuryNotes] = useState('');

  // Suspension form state
  const [suspensionOpen, setSuspensionOpen] = useState(false);
  const [suspReason, setSuspReason] = useState('');
  const [suspStartDate, setSuspStartDate] = useState('');
  const [suspEndDate, setSuspEndDate] = useState('');

  // Contract form state
  const [contractOpen, setContractOpen] = useState(false);
  const [contractType, setContractType] = useState('');
  const [contractUrl, setContractUrl] = useState('');

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

  const createNote = useCreateMemberNote();
  const updateMember = useUpdateMember();
  const createInjury = useCreateMemberInjury();
  const markRecovered = useMarkInjuryRecovered();
  const createSuspension = useCreateMemberSuspension();
  const endSuspension = useEndMemberSuspension();
  const createContract = useCreateMemberContract();

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

  // Filter packages by status
  const filteredPackages = packages.filter((pkg) => {
    if (packageStatus === 'active') return pkg.status === 'active';
    if (packageStatus === 'ready') return pkg.status === 'ready_to_use';
    if (packageStatus === 'hold') return pkg.status === 'on_hold';
    if (packageStatus === 'completed') return pkg.status === 'completed' || pkg.status === 'expired';
    return true;
  });

  const handleAddNote = () => {
    if (!newNote.trim() || !id) return;
    createNote.mutate({ memberId: id, note: newNote }, {
      onSuccess: () => setNewNote(''),
    });
  };

  const handleStartEditProfile = () => {
    if (!member) return;
    setProfileDraft({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      date_of_birth: member.date_of_birth || '',
      tax_id: member.tax_id || '',
      address: member.address || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!member || !id) return;
    const oldData = {
      first_name: member.first_name,
      last_name: member.last_name,
      nickname: member.nickname,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      date_of_birth: member.date_of_birth,
      tax_id: member.tax_id,
      address: member.address,
    };
    updateMember.mutate({ id, data: profileDraft, oldData }, {
      onSuccess: () => setIsEditingProfile(false),
    });
  };

  const handleAddInjury = () => {
    if (!injuryDesc.trim() || !id) return;
    createInjury.mutate(
      { memberId: id, injury_description: injuryDesc, injury_date: injuryDate || undefined, notes: injuryNotes || undefined },
      {
        onSuccess: () => {
          setInjuryOpen(false);
          setInjuryDesc('');
          setInjuryDate('');
          setInjuryNotes('');
        },
      }
    );
  };

  const handleAddSuspension = () => {
    if (!suspStartDate || !id) return;
    createSuspension.mutate(
      { memberId: id, reason: suspReason || undefined, start_date: suspStartDate, end_date: suspEndDate || undefined },
      {
        onSuccess: () => {
          setSuspensionOpen(false);
          setSuspReason('');
          setSuspStartDate('');
          setSuspEndDate('');
        },
      }
    );
  };

  const handleAddContract = () => {
    if (!id) return;
    createContract.mutate(
      { memberId: id, contract_type: contractType || undefined, document_url: contractUrl || undefined },
      {
        onSuccess: () => {
          setContractOpen(false);
          setContractType('');
          setContractUrl('');
        },
      }
    );
  };

  // Map member status to StatusBadge variant
  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'suspended': return 'suspended';
      case 'inactive': return 'inactive';
      case 'on_hold': return 'suspended';
      default: return 'active';
    }
  };

  // Column definitions
  const attendanceColumns: Column<MemberAttendance>[] = [
    { key: 'check_in_time', header: t('members.checkInTime'), cell: (row) => formatDateTime(row.check_in_time) },
    { key: 'check_in_type', header: t('members.type'), cell: (row) => (
      <Badge variant="outline">{row.check_in_type || 'class'}</Badge>
    )},
    { key: 'schedule', header: t('members.class'), cell: (row) => row.schedule?.classes?.name || '-' },
    { key: 'location', header: t('members.location'), cell: (row) => row.location?.name || '-' },
  ];

  const packageColumns: Column<MemberPackage>[] = [
    { key: 'package', header: t('members.packageName'), cell: (row) => (
      language === 'th' ? row.package?.name_th || row.package?.name_en : row.package?.name_en
    ) || '-' },
    { key: 'status', header: t('common.status'), cell: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge>
    )},
    { key: 'sessions_remaining', header: t('members.sessionsRemaining'), cell: (row) => 
      row.package?.sessions ? `${row.sessions_remaining || 0}/${row.package.sessions}` : t('common.unlimited')
    },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => formatDate(row.expiry_date) },
    { key: 'purchase_transaction', header: t('members.transactionId'), cell: (row) => (row as any).purchase_transaction?.transaction_id || '-' },
  ];

  const billingColumns: Column<MemberBilling>[] = [
    { key: 'billing_date', header: t('members.date'), cell: (row) => formatDate(row.billing_date) },
    { key: 'description', header: t('members.description'), cell: (row) => row.description || '-' },
    { key: 'amount', header: t('members.amount'), cell: (row) => formatCurrency(row.amount) },
    { key: 'transaction', header: t('members.transactionId'), cell: (row) => row.transaction?.transaction_id || '-' },
  ];

  const injuryColumns: Column<MemberInjury>[] = [
    { key: 'injury_date', header: t('members.injuryDate'), cell: (row) => formatDate(row.injury_date) },
    { key: 'injury_description', header: t('members.description'), cell: (row) => row.injury_description },
    { key: 'is_active', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_active ? 'destructive' : 'secondary'}>
        {row.is_active ? t('members.activeInjury') : t('members.recovered')}
      </Badge>
    )},
    { key: 'recovery_date', header: t('members.recoveryDate'), cell: (row) => row.recovery_date ? formatDate(row.recovery_date) : '-' },
    { key: 'actions', header: t('common.actions'), cell: (row) => row.is_active ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => id && markRecovered.mutate({ injuryId: row.id, memberId: id })}
        disabled={markRecovered.isPending}
      >
        <Check className="h-3 w-3 mr-1" />
        {t('members.markRecovered')}
      </Button>
    ) : null },
  ];

  const suspensionColumns: Column<MemberSuspension>[] = [
    { key: 'start_date', header: t('members.startDate'), cell: (row) => formatDate(row.start_date) },
    { key: 'end_date', header: t('members.endDate'), cell: (row) => row.end_date ? formatDate(row.end_date) : '-' },
    { key: 'reason', header: t('members.reason'), cell: (row) => row.reason || '-' },
    { key: 'is_active', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_active ? 'destructive' : 'secondary'}>
        {row.is_active ? t('members.activeSuspension') : t('members.ended')}
      </Badge>
    )},
    { key: 'actions', header: t('common.actions'), cell: (row) => row.is_active ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => id && endSuspension.mutate({ suspensionId: row.id, memberId: id })}
        disabled={endSuspension.isPending}
      >
        {t('members.endSuspension')}
      </Button>
    ) : null },
  ];

  const contractColumns: Column<MemberContract>[] = [
    { key: 'contract_type', header: t('members.contractType'), cell: (row) => row.contract_type || '-' },
    { key: 'is_signed', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_signed ? 'default' : 'secondary'}>
        {row.is_signed ? t('members.signed') : t('members.unsigned')}
      </Badge>
    )},
    { key: 'signed_date', header: t('members.signedDate'), cell: (row) => row.signed_date ? formatDate(row.signed_date) : '-' },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => row.expiry_date ? formatDate(row.expiry_date) : '-' },
    { key: 'document_url', header: t('members.document'), cell: (row) => row.document_url ? (
      <a href={row.document_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
        {t('members.viewDocument')}
      </a>
    ) : '-' },
  ];

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
          {/* Profile card */}
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">{member.member_id}</span>
                    <StatusBadge variant={getStatusVariant(member.status)}>{member.status || 'active'}</StatusBadge>
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
                  <h2 className="text-xl font-bold mt-2">
                    {member.first_name} {member.last_name}
                  </h2>
                  {member.nickname && (
                    <p className="text-sm text-muted-foreground">({member.nickname})</p>
                  )}
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

          {/* Contact card */}
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

          {/* LINE Identity card */}
          <LineIdentityCard ownerType="member" ownerId={member.id} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats — computed from actual data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('members.memberSince')}
              value={formatDate(member.member_since)}
              subtitle={`${daysSinceJoin} ${t('common.days')}`}
              color="teal"
            />
            <StatCard
              title={t('members.mostAttendedCategory')}
              value={summaryStats?.mostAttendedCategory || member.most_attended_category || '-'}
              color="orange"
            />
            <StatCard
              title={t('members.amountSpent')}
              value={formatCurrency(summaryStats?.totalSpent ?? member.total_spent ?? 0)}
              color="blue"
            />
            <StatCard
              title={t('members.daysUntilExpiry')}
              value={daysUntilExpiry}
              subtitle={t('common.days')}
              color="gray"
            />
          </div>

          {/* Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="home" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">{t('members.accountDetails')}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('members.memberId')}</p>
                          <p className="font-medium">{member.member_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('common.status')}</p>
                          <StatusBadge variant={getStatusVariant(member.status)}>{member.status || 'active'}</StatusBadge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('members.joined')}</p>
                          <p className="font-medium">{formatDate(member.member_since)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('members.location')}</p>
                          <p className="font-medium">{member.register_location?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('members.riskLevel')}</p>
                          <StatusBadge variant={`${member.risk_level || 'low'}-risk` as any}>
                            {member.risk_level || 'low'}
                          </StatusBadge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('members.gender')}</p>
                          <p className="font-medium">{member.gender || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Member Journey Timeline */}
                    <MemberTimeline
                      memberSince={member.member_since}
                      attendance={attendance}
                      packages={packages}
                      suspensions={suspensions}
                      riskLevel={member.risk_level}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <div className="flex justify-end mb-4">
                    {isEditingProfile ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={updateMember.isPending}>
                          {t('common.save')}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={handleStartEditProfile}>
                        {t('common.edit')}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('members.firstName')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.first_name : member.first_name}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.lastName')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.last_name : member.last_name}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, last_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.nickname')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.nickname : member.nickname || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, nickname: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.email')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.email : member.email || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.phone')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.phone : member.phone || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.gender')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.gender : member.gender || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, gender: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.dateOfBirth')}</Label>
                      <Input
                        type={isEditingProfile ? 'date' : 'text'}
                        value={isEditingProfile ? profileDraft.date_of_birth : (member.date_of_birth ? formatDate(member.date_of_birth) : '')}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t('members.taxId')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.tax_id : member.tax_id || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, tax_id: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('members.address')}</Label>
                      <Input
                        value={isEditingProfile ? profileDraft.address : member.address || ''}
                        readOnly={!isEditingProfile}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-6">
                  {attendanceLoading ? (
                    <Skeleton className="h-48" />
                  ) : attendance.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={attendanceColumns} data={attendance} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="packages" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <Tabs value={packageStatus} onValueChange={setPackageStatus}>
                      <TabsList>
                        <TabsTrigger value="active">{t('members.activePackages')}</TabsTrigger>
                        <TabsTrigger value="ready">{t('members.readyToUse')}</TabsTrigger>
                        <TabsTrigger value="hold">{t('members.onHold')}</TabsTrigger>
                        <TabsTrigger value="completed">{t('members.completed')}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button className="bg-primary hover:bg-primary/90">
                      {t('members.purchasePackage')}
                    </Button>
                  </div>
                  {packagesLoading ? (
                    <Skeleton className="h-48" />
                  ) : filteredPackages.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={packageColumns} data={filteredPackages} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button className="bg-primary hover:bg-primary/90">
                      {t('members.addBilling')}
                    </Button>
                  </div>
                  {billingLoading ? (
                    <Skeleton className="h-48" />
                  ) : billing.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={billingColumns} data={billing} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="injuries" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Dialog open={injuryOpen} onOpenChange={setInjuryOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('members.addInjury')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('members.addInjury')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('members.description')}</Label>
                            <Textarea value={injuryDesc} onChange={(e) => setInjuryDesc(e.target.value)} />
                          </div>
                          <div>
                            <Label>{t('members.injuryDate')}</Label>
                            <Input type="date" value={injuryDate} onChange={(e) => setInjuryDate(e.target.value)} />
                          </div>
                          <div>
                            <Label>{t('members.notes')}</Label>
                            <Textarea value={injuryNotes} onChange={(e) => setInjuryNotes(e.target.value)} />
                          </div>
                          <Button onClick={handleAddInjury} disabled={!injuryDesc.trim() || createInjury.isPending}>
                            {t('common.save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {injuriesLoading ? (
                    <Skeleton className="h-48" />
                  ) : injuries.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={injuryColumns} data={injuries} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <div className="mb-4 space-y-2">
                    <Textarea
                      placeholder={t('members.addNotePlaceholder')}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button 
                      onClick={handleAddNote} 
                      disabled={!newNote.trim() || createNote.isPending}
                    >
                      {t('members.addNote')}
                    </Button>
                  </div>
                  {notesLoading ? (
                    <Skeleton className="h-48" />
                  ) : notes.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <Card key={note.id}>
                          <CardContent className="py-3">
                            <p className="text-sm">{note.note}</p>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>{note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : '-'}</span>
                              <span>{formatDateTime(note.created_at)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="communications" className="mt-6">
                  {id && <MemberCommunicationLog memberId={id} />}
                </TabsContent>

                <TabsContent value="suspensions" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Dialog open={suspensionOpen} onOpenChange={setSuspensionOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <PauseCircle className="h-4 w-4 mr-2" />
                          {t('members.suspendMember')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('members.suspendMember')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('members.reason')}</Label>
                            <Textarea value={suspReason} onChange={(e) => setSuspReason(e.target.value)} />
                          </div>
                          <div>
                            <Label>{t('members.startDate')}</Label>
                            <Input type="date" value={suspStartDate} onChange={(e) => setSuspStartDate(e.target.value)} />
                          </div>
                          <div>
                            <Label>{t('members.endDate')}</Label>
                            <Input type="date" value={suspEndDate} onChange={(e) => setSuspEndDate(e.target.value)} />
                          </div>
                          <Button onClick={handleAddSuspension} disabled={!suspStartDate || createSuspension.isPending}>
                            {t('common.save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {suspensionsLoading ? (
                    <Skeleton className="h-48" />
                  ) : suspensions.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={suspensionColumns} data={suspensions} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="contract" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('members.addContract')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('members.addContract')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('members.contractType')}</Label>
                            <Input value={contractType} onChange={(e) => setContractType(e.target.value)} />
                          </div>
                          <div>
                            <Label>{t('members.documentUrl')}</Label>
                            <Input value={contractUrl} onChange={(e) => setContractUrl(e.target.value)} placeholder="https://..." />
                          </div>
                          <Button onClick={handleAddContract} disabled={createContract.isPending}>
                            {t('common.save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {contractsLoading ? (
                    <Skeleton className="h-48" />
                  ) : contracts.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={contractColumns} data={contracts} rowKey={(row) => row.id} />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Front desk notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('members.frontDeskNotes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t('members.frontDeskNotesPlaceholder')}
                className="min-h-[100px]"
                value={member.notes || ''}
                onChange={(e) => updateMember.mutate({ id: member.id, data: { notes: e.target.value } })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;
