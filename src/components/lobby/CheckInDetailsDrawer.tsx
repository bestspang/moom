import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ArrowUpRight } from 'lucide-react';
import type { CheckInWithRelations } from '@/hooks/useLobby';

interface Props {
  row: CheckInWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '-'}</span>
    </div>
  );
}

export function CheckInDetailsDrawer({ row, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();

  if (!row) return null;
  const m = row.member;
  const pkg = row.member_package;
  const method = (row as any).checkin_method as string | null;

  const methodLabel = method === 'qr' ? 'QR' : method === 'liff' ? 'LIFF' : t('lobby.manual');
  const methodVariant = method === 'qr' ? 'active' : method === 'liff' ? 'new' : 'pending';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('lobby.details.title')}</SheetTitle>
          <SheetDescription>
            {row.check_in_time ? format(new Date(row.check_in_time), 'PPpp') : '-'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t('lobby.details.member')}
            </h3>
            <Row label={t('common.name')} value={m ? `${m.first_name} ${m.last_name}` : '-'} />
            <Row label="ID" value={m?.member_id} />
            <Row label={t('members.nickname') || 'Nickname'} value={m?.nickname} />
            <Row label={t('members.phone') || 'Phone'} value={m?.phone} />
            <Row label="Email" value={m?.email} />
          </section>

          <Separator />

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t('lobby.details.package')}
            </h3>
            {pkg ? (
              <>
                <Row label={t('lobby.packageUsed')} value={pkg.package?.name_en} />
                <Row
                  label={t('lobby.usage')}
                  value={
                    pkg.sessions_remaining !== null
                      ? `${pkg.sessions_used || 0} / ${(pkg.sessions_used || 0) + (pkg.sessions_remaining || 0)}`
                      : t('packages.unlimited')
                  }
                />
                <Row
                  label={t('packages.expiresAt') || 'Expires'}
                  value={pkg.expire_at ? format(new Date(pkg.expire_at), 'PP') : '-'}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('lobby.details.noPackage')}</p>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t('lobby.details.checkin')}
            </h3>
            <Row
              label={t('lobby.time')}
              value={row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm:ss') : '-'}
            />
            <Row label={t('lobby.location')} value={row.location?.name} />
            <Row
              label={t('lobby.checkinMethod')}
              value={<StatusBadge variant={methodVariant as any}>{methodLabel}</StatusBadge>}
            />
          </section>

          {m && can('members', 'read') && (
            <Button
              className="w-full gap-1.5"
              onClick={() => {
                onOpenChange(false);
                navigate(`/members/${m.id}`);
              }}
            >
              {t('lobby.details.openMember')}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
