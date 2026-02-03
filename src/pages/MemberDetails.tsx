import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Phone, Mail, MapPin, User, Calendar, DollarSign, FileText, AlertTriangle, PauseCircle, ClipboardList } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  useCreateMemberNote,
  useUpdateMember,
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

  // Fetch all member data
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: packages = [], isLoading: packagesLoading } = useMemberPackages(id);
  const { data: attendance = [], isLoading: attendanceLoading } = useMemberAttendance(id);
  const { data: billing = [], isLoading: billingLoading } = useMemberBilling(id);
  const { data: notes = [], isLoading: notesLoading } = useMemberNotes(id);
  const { data: injuries = [], isLoading: injuriesLoading } = useMemberInjuries(id);
  const { data: suspensions = [], isLoading: suspensionsLoading } = useMemberSuspensions(id);
  const { data: contracts = [], isLoading: contractsLoading } = useMemberContracts(id);

  const createNote = useCreateMemberNote();
  const updateMember = useUpdateMember();

  const tabs = [
    { value: 'home', label: t('members.tabs.home'), icon: User },
    { value: 'profile', label: t('members.tabs.profile'), icon: User },
    { value: 'attendance', label: t('members.tabs.attendance'), icon: Calendar },
    { value: 'packages', label: t('members.tabs.packages'), icon: DollarSign },
    { value: 'billing', label: t('members.tabs.billing'), icon: DollarSign },
    { value: 'injuries', label: t('members.tabs.injuries'), icon: AlertTriangle },
    { value: 'notes', label: t('members.tabs.notes'), icon: ClipboardList },
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

  // Map member status to StatusBadge variant
  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'active';
      case 'suspended': return 'suspended';
      case 'inactive': return 'inactive';
      case 'on_hold': return 'suspended'; // Map on_hold to suspended style
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
  ];

  if (memberLoading) {
    return (
      <div>
        <PageHeader
          title={t('members.memberDetails')}
          breadcrumbs={[
            { label: t('nav.client') },
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
            { label: t('nav.client') },
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
          { label: t('nav.client') },
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
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('members.memberSince')}
              value={formatDate(member.member_since)}
              subtitle={`${daysSinceJoin} ${t('common.days')}`}
              color="teal"
            />
            <StatCard
              title={t('members.mostAttendedCategory')}
              value={member.most_attended_category || '-'}
              color="orange"
            />
            <StatCard
              title={t('members.amountSpent')}
              value={formatCurrency(member.total_spent || 0)}
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
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('members.firstName')}</Label>
                      <Input value={member.first_name} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.lastName')}</Label>
                      <Input value={member.last_name} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.nickname')}</Label>
                      <Input value={member.nickname || ''} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.email')}</Label>
                      <Input value={member.email || ''} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.phone')}</Label>
                      <Input value={member.phone || ''} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.gender')}</Label>
                      <Input value={member.gender || ''} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.dateOfBirth')}</Label>
                      <Input value={member.date_of_birth ? formatDate(member.date_of_birth) : ''} readOnly />
                    </div>
                    <div>
                      <Label>{t('members.taxId')}</Label>
                      <Input value={member.tax_id || ''} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('members.address')}</Label>
                      <Input value={member.address || ''} readOnly />
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

                <TabsContent value="suspensions" className="mt-6">
                  {suspensionsLoading ? (
                    <Skeleton className="h-48" />
                  ) : suspensions.length === 0 ? (
                    <EmptyState message={t('common.noData')} />
                  ) : (
                    <DataTable columns={suspensionColumns} data={suspensions} rowKey={(row) => row.id} />
                  )}
                </TabsContent>

                <TabsContent value="contract" className="mt-6">
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
