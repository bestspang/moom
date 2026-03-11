import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap, Coins, Award, Ticket } from 'lucide-react';

const OPERATIONS = [
  { value: 'adjust_xp', label: 'Adjust XP', icon: Zap, description: 'Add or subtract XP from a member' },
  { value: 'adjust_coin', label: 'Adjust Coin', icon: Coins, description: 'Add or subtract Coins from a member' },
  { value: 'grant_badge', label: 'Grant Badge', icon: Award, description: 'Award a badge to a member' },
  { value: 'revoke_badge', label: 'Revoke Badge', icon: Award, description: 'Remove a badge from a member' },
  { value: 'issue_coupon', label: 'Issue Coupon', icon: Ticket, description: 'Issue a coupon to a member' },
] as const;

const GamificationOperations = () => {
  const [operation, setOperation] = useState<string>('adjust_xp');
  const [memberId, setMemberId] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [couponTemplateId, setCouponTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!memberId.trim()) return toast.error('Member ID is required');
    if (!reason.trim()) return toast.error('Reason is required for audit trail');

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

      toast.success(`Operation "${operation}" completed successfully`);
      setValue('');
      setReason('');
      setBadgeId('');
      setCouponTemplateId('');
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const currentOp = OPERATIONS.find((o) => o.value === operation);
  const needsValue = operation === 'adjust_xp' || operation === 'adjust_coin';
  const needsBadge = operation === 'grant_badge' || operation === 'revoke_badge';
  const needsCoupon = operation === 'issue_coupon';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Manual Operations</h2>
        <p className="text-sm text-muted-foreground">
          Perform controlled manual adjustments. All operations are logged to the audit trail.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operation</CardTitle>
            <CardDescription>Select what you want to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {OPERATIONS.map((op) => {
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
                      <div className="font-medium">{op.label}</div>
                      <div className="text-xs text-muted-foreground">{op.description}</div>
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
              {currentOp?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-id">Member ID (UUID)</Label>
              <Input
                id="member-id"
                placeholder="e.g. a1b2c3d4-..."
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>

            {needsValue && (
              <div className="space-y-2">
                <Label htmlFor="value">Amount (use negative to subtract)</Label>
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
                <Label htmlFor="badge-id">Badge ID (UUID)</Label>
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
                <Label htmlFor="coupon-id">Coupon Template ID (UUID)</Label>
                <Input
                  id="coupon-id"
                  placeholder="e.g. template-uuid..."
                  value={couponTemplateId}
                  onChange={(e) => setCouponTemplateId(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required for audit)</Label>
              <Input
                id="reason"
                placeholder="e.g. Compensation for system error"
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
              Execute Operation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamificationOperations;
