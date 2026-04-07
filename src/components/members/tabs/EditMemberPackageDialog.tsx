import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateMemberPackage, type MemberPackage } from '@/hooks/useMemberDetails';

interface EditMemberPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: MemberPackage;
}

const STATUS_OPTIONS = ['active', 'ready_to_use', 'on_hold', 'completed', 'expired'] as const;

export const EditMemberPackageDialog = ({ open, onOpenChange, pkg }: EditMemberPackageDialogProps) => {
  const { t } = useLanguage();
  const updateMutation = useUpdateMemberPackage();

  const [activationDate, setActivationDate] = useState(pkg.activation_date?.split('T')[0] || '');
  const [expiryDate, setExpiryDate] = useState(pkg.expiry_date?.split('T')[0] || '');
  const [sessionsRemaining, setSessionsRemaining] = useState(pkg.sessions_remaining ?? 0);
  const [status, setStatus] = useState(pkg.status || 'active');

  useEffect(() => {
    if (open) {
      setActivationDate(pkg.activation_date?.split('T')[0] || '');
      setExpiryDate(pkg.expiry_date?.split('T')[0] || '');
      setSessionsRemaining(pkg.sessions_remaining ?? 0);
      setStatus(pkg.status || 'active');
    }
  }, [open, pkg]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: pkg.id,
        memberId: pkg.member_id,
        data: {
          activation_date: activationDate || null,
          expiry_date: expiryDate || null,
          sessions_remaining: sessionsRemaining,
          status,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('members.editPackage')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('members.activationDate')}</Label>
            <Input type="date" value={activationDate} onChange={(e) => setActivationDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('members.expiryDate')}</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          {pkg.package?.sessions && (
            <div className="space-y-2">
              <Label>{t('members.sessionsRemaining')}</Label>
              <Input
                type="number"
                min={0}
                value={sessionsRemaining}
                onChange={(e) => setSessionsRemaining(Number(e.target.value))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
