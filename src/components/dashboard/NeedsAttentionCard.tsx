import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package, Star, Receipt, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHighRiskMembers, useHotLeads } from '@/hooks/useDashboardStats';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { useTransferSlipStats } from '@/hooks/useTransferSlips';
import { useChurnPrediction } from '@/hooks/useChurnPrediction';

const NeedsAttentionCard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: highRiskMembers = [], isLoading: riskLoading } = useHighRiskMembers();
  const { data: hotLeads = [], isLoading: leadsLoading } = useHotLeads();
  const { data: expiringPkgs = [], isLoading: pkgLoading } = useExpiringPackages();
  const { data: slipStats, isLoading: slipLoading } = useTransferSlipStats();
  const { data: churnMembers = [], isLoading: churnLoading } = useChurnPrediction();

  const pendingSlips = slipStats?.needs_review || 0;
  const isLoading = riskLoading || leadsLoading || pkgLoading || slipLoading || churnLoading;

  const totalItems = highRiskMembers.length + hotLeads.length + expiringPkgs.length + pendingSlips + churnMembers.length;

  if (!isLoading && totalItems === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t('dashboard.needsAttention')}
          {!isLoading && totalItems > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({totalItems})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiring Packages */}
            {expiringPkgs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {t('dashboard.expiringPackages')} ({expiringPkgs.length})
                  </h4>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-0 h-auto text-xs"
                      onClick={() => navigate('/announcement')}
                    >
                      {t('dashboardExtra.remindAll')}
                    </Button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-0 h-auto text-xs"
                      onClick={() => navigate('/report/member/members-at-risk')}
                    >
                      {t('common.viewAll')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {expiringPkgs.slice(0, 3).map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => navigate(`/members/${pkg.memberId}/detail`)}
                      className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md p-1.5 -m-0.5 transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {pkg.memberName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{pkg.memberName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{pkg.packageName}</p>
                      </div>
                      <StatusBadge variant={pkg.urgency === 'red' ? 'high-risk' : pkg.urgency === 'yellow' ? 'pending' : 'default'}>
                        {pkg.daysLeft}d
                      </StatusBadge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* High Risk Members */}
            {highRiskMembers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('dashboard.highRiskMembers')} ({highRiskMembers.length})
                  </h4>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 h-auto text-xs"
                    onClick={() => navigate('/members?risk=high')}
                  >
                    {t('common.viewAll')}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {highRiskMembers.slice(0, 3).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => navigate(`/members/${member.id}/detail`)}
                      className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md p-1.5 -m-0.5 transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground">{member.phone}</p>
                      </div>
                      <span className="text-[11px] text-destructive">
                        {member.daysLeft === null ? '-' : member.daysLeft <= 0 ? t('dashboard.expired') : `${member.daysLeft}d`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hot Leads */}
            {hotLeads.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    {t('dashboard.hotLeads')} ({hotLeads.length})
                  </h4>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 h-auto text-xs"
                    onClick={() => navigate('/leads?status=interested')}
                  >
                    {t('common.viewAll')}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {hotLeads.slice(0, 3).map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/leads?id=${lead.id}`)}
                      className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md p-1.5 -m-0.5 transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {lead.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{lead.name}</p>
                      </div>
                      <StatusBadge variant="pending">{lead.status}</StatusBadge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Transfer Slips */}
            {pendingSlips > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" />
                    {t('dashboard.pendingSlips')} ({pendingSlips})
                  </h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/finance?tab=slips')}
                >
                  {t('dashboard.reviewSlip')} →
                </Button>
              </div>
            )}

            {/* Declining Attendance */}
            {churnMembers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {t('dashboard.decliningAttendance')} ({churnMembers.length})
                  </h4>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-0 h-auto text-xs"
                      onClick={() => navigate('/announcement')}
                    >
                      {t('dashboardExtra.reachOut')}
                    </Button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-0 h-auto text-xs"
                      onClick={() => navigate('/members')}
                    >
                      {t('common.viewAll')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {churnMembers.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/members/${m.id}/detail`)}
                      className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md p-1.5 -m-0.5 transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {m.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.priorCount} → {m.recentCount} {t('dashboard.visits')}
                        </p>
                      </div>
                      <span className="text-[11px] text-destructive">↓{m.declinePercent}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeedsAttentionCard;
