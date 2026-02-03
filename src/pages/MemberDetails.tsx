import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Phone, Mail, MapPin, User, Calendar, DollarSign, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/formatters';

const MemberDetails = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  // Sample member data
  const member = {
    id,
    memberId: 'M-0000048',
    firstName: 'สมชาย',
    lastName: 'ประเสริฐ',
    nickname: 'ชัย',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    address: '123 Sukhumvit Road, Bangkok 10110',
    emergencyContact: { name: 'Pranee Prasert', phone: '089-999-8888' },
    status: 'active' as const,
    memberSince: new Date('2025-03-15'),
    totalSpent: 45000,
    mostAttendedCategory: 'Group Class',
    daysUntilExpiry: 45,
  };

  const tabs = [
    { value: 'home', label: t('members.tabs.home'), icon: User },
    { value: 'profile', label: t('members.tabs.profile'), icon: User },
    { value: 'attendance', label: t('members.tabs.attendance'), icon: Calendar },
    { value: 'packages', label: t('members.tabs.packages'), icon: DollarSign },
    { value: 'billing', label: t('members.tabs.billing'), icon: DollarSign },
    { value: 'injuries', label: t('members.tabs.injuries'), icon: User },
    { value: 'notes', label: t('members.tabs.notes'), icon: User },
    { value: 'suspensions', label: t('members.tabs.suspensions'), icon: User },
    { value: 'contract', label: t('members.tabs.contract'), icon: User },
  ];

  return (
    <div>
      <PageHeader
        title={t('members.memberDetails')}
        breadcrumbs={[
          { label: t('nav.client') },
          { label: t('members.title'), href: '/members' },
          { label: member.memberId },
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
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {member.firstName.charAt(0)}
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
                    <span className="text-sm text-muted-foreground">{member.memberId}</span>
                    <StatusBadge variant="active">{t('common.active')}</StatusBadge>
                  </div>
                  <h2 className="text-xl font-bold mt-2">
                    {member.firstName} {member.lastName}
                  </h2>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{member.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{member.emergencyContact.name}</p>
                  <p className="text-sm">{member.emergencyContact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('members.memberSince')}
              value={formatDate(member.memberSince)}
              subtitle={`320 ${t('members.daysUntilAnniversary')}`}
              color="teal"
            />
            <StatCard
              title={t('members.mostAttendedCategory')}
              value={member.mostAttendedCategory}
              color="orange"
            />
            <StatCard
              title={t('members.amountSpent')}
              value={formatCurrency(member.totalSpent)}
              color="blue"
            />
            <StatCard
              title={t('members.daysUntilExpiry')}
              value={member.daysUntilExpiry}
              subtitle="days"
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
                          <p className="text-muted-foreground">Member ID</p>
                          <p className="font-medium">{member.memberId}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <StatusBadge variant="active">{t('common.active')}</StatusBadge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Joined</p>
                          <p className="font-medium">{formatDate(member.memberSince)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">MOOM CLUB Main</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={member.firstName} readOnly />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={member.lastName} readOnly />
                    </div>
                    <div>
                      <Label>Nickname</Label>
                      <Input value={member.nickname} readOnly />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={member.email} readOnly />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={member.phone} readOnly />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Input value="Male" readOnly />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-6">
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="packages" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <Tabs defaultValue="active">
                      <TabsList>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="ready">Ready to use</TabsTrigger>
                        <TabsTrigger value="hold">On hold</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button className="bg-primary hover:bg-primary-hover">
                      {t('members.purchasePackage')}
                    </Button>
                  </div>
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button className="bg-primary hover:bg-primary-hover">
                      {t('members.addBilling')}
                    </Button>
                  </div>
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="injuries" className="mt-6">
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="suspensions" className="mt-6">
                  <EmptyState message={t('common.noData')} />
                </TabsContent>

                <TabsContent value="contract" className="mt-6">
                  <EmptyState message={t('common.noData')} />
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
                placeholder="Add notes for front desk staff..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;
