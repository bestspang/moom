import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap, Coins, Award, Ticket } from 'lucide-react';

const OPERATION_KEYS = [
  { value: 'adjust_xp', labelKey: 'gamification.operations.adjustXp', descKey: 'gamification.operations.adjustXpDesc', icon: Zap },
  { value: 'adjust_coin', labelKey: 'gamification.operations.adjustCoin', descKey: 'gamification.operations.adjustCoinDesc', icon: Coins },
  { value: 'grant_badge', labelKey: 'gamification.operations.grantBadge', descKey: 'gamification.operations.grantBadgeDesc', icon: Award },
  { value: 'revoke_badge', labelKey: 'gamification.operations.revokeBadge', descKey: 'gamification.operations.revokeBadgeDesc', icon: Award },
  { value: 'issue_coupon', labelKey: 'gamification.operations.issueCoupon', descKey: 'gamification.operations.issueCouponDesc', icon: Ticket },
] as const;

const GamificationOperations = () => {
  const { t } = useLanguage();
  const [operation, setOperation] = useState<string>('adjust_xp');
  const [memberId, setMemberId] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [couponTemplateId, setCouponTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!memberId.trim()) return toast.error(t('gamification.operations.memberIdRequired'));
    if (!reason.trim()) return toast.error(t('gamification.operations.reasonRequired'));

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gamification-admin-ops', {
        body: {
          action: operation,
          member_id: memberId.trim(),
          value: Number(value) || 0,
          reason: reason.trim(),
          badge_id: badgeId.trim() || undefined,
          coupon_template_id: couponTemplateId.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(t('gamification.operations.success'));
      setValue('');
      setReason('');
      setBadgeId('');
      setCouponTemplateId('');
    } catch (err: any) {
      toast.error(err.message || t('gamification.operations.error'));
    } finally {
      setLoading(false);
    }
  };

  const currentOp = OPERATION_KEYS.find((o) => o.value === operation);
  const needsValue = operation === 'adjust_xp' || operation === 'adjust_coin';
  const needsBadge = operation === 'grant_badge' || operation === 'revoke_badge';
  const needsCoupon = operation === 'issue_coupon';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('gamification.operations.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('gamification.operations.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('gamification.operations.operationLabel')}</CardTitle>
            <CardDescription>{t('gamification.operations.operationHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {OPERATION_KEYS.map((op) => {
                const Icon = op.icon;
                const active = operation === op.value;
                return (
                  <button
                    key={op.value}
                    onClick={() => setOperation(op.value)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                      active
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-medium">{t(op.labelKey)}</div>
                      <div className="text-xs text-muted-foreground">{t(op.descKey)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {currentOp && <currentOp.icon className="h-4 w-4" />}
              {currentOp && t(currentOp.labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-id">{t('gamification.operations.memberId')}</Label>
              <Input
                id="member-id"
                placeholder="e.g. a1b2c3d4-..."
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>

            {needsValue && (
              <div className="space-y-2">
                <Label htmlFor="value">{t('gamification.operations.amountLabel')}</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="e.g. 50 or -20"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}

            {needsBadge && (
              <div className="space-y-2">
                <Label htmlFor="badge-id">{t('gamification.operations.badgeId')}</Label>
                <Input
                  id="badge-id"
                  placeholder="e.g. badge-uuid..."
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                />
              </div>
            )}

            {needsCoupon && (
              <div className="space-y-2">
                <Label htmlFor="coupon-id">{t('gamification.operations.couponTemplateId')}</Label>
                <Input
                  id="coupon-id"
                  placeholder="e.g. template-uuid..."
                  value={couponTemplateId}
                  onChange={(e) => setCouponTemplateId(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">{t('gamification.operations.reasonLabel')}</Label>
              <Input
                id="reason"
                placeholder={t('gamification.operations.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || !memberId || !reason}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('gamification.operations.execute')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamificationOperations;
