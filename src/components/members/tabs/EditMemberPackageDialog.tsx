import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
  const termDays = pkg.package?.term_days || 30;

  const [activationDate, setActivationDate] = useState<Date | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [sessionsRemaining, setSessionsRemaining] = useState(pkg.sessions_remaining ?? 0);
  const [status, setStatus] = useState(pkg.status || 'active');

  useEffect(() => {
    if (open) {
      const actDate = pkg.activation_date ? new Date(pkg.activation_date) : undefined;
      setActivationDate(actDate);
      setExpiryDate(pkg.expiry_date ? new Date(pkg.expiry_date) : undefined);
      setSessionsRemaining(pkg.sessions_remaining ?? 0);
      setStatus(pkg.status || 'active');
    }
  }, [open, pkg]);

  // Auto-calculate expiry when activation changes
  const handleActivationChange = (date: Date | undefined) => {
    setActivationDate(date);
    if (date) {
      setExpiryDate(addDays(date, termDays));
    }
  };

  // Auto-fill activation when status changes to active
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === 'active' && !activationDate) {
      const today = new Date();
      setActivationDate(today);
      setExpiryDate(addDays(today, termDays));
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: pkg.id,
        memberId: pkg.member_id,
        data: {
          activation_date: activationDate ? format(activationDate, 'yyyy-MM-dd') : null,
          expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null,
          sessions_remaining: sessionsRemaining,
          status,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const statusLabel = (s: string) => {
    const key = `members.packageStatus.${s}` as any;
    const label = t(key);
    return label !== key ? label : s.replace(/_/g, ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('members.editPackage')}</DialogTitle>
          <DialogDescription>{t('members.editPackageDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Activation Date — DatePicker */}
          <div className="space-y-2">
            <Label>{t('members.activationDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !activationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {activationDate ? format(activationDate, 'PPP') : t('dateTime.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={activationDate}
                  onSelect={handleActivationChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expiry Date — DatePicker */}
          <div className="space-y-2">
            <Label>{t('members.expiryDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expiryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, 'PPP') : t('dateTime.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              {t('members.termDays')}: {termDays} {t('members.days')}
            </p>
          </div>

          {/* Sessions */}
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

          {/* Status — i18n labels */}
          <div className="space-y-2">
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
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
