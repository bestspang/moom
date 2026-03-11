import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  PersonStanding,
  Ticket,
  Package,
  ClipboardList,
  Share2,
  MoreHorizontal,
  Gift,
  Shield,
  Bell,
  Star,
  ScanLine,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickItem {
  icon: React.ReactNode;
  label: string;
  to: string;
}

export function QuickMenuStrip() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const iconClass = 'h-5 w-5';

  const quickItems: QuickItem[] = [
    { icon: <PersonStanding className={iconClass} />, label: t('member.runClub'), to: '/member/run-club' },
    { icon: <Ticket className={iconClass} />, label: t('member.myCoupons'), to: '/member/coupons' },
    { icon: <Package className={iconClass} />, label: t('member.packages'), to: '/member/packages' },
  ];

  const allPages: QuickItem[] = [
    ...quickItems,
    { icon: <ClipboardList className={iconClass} />, label: t('member.attendanceHistory'), to: '/member/attendance' },
    { icon: <Share2 className={iconClass} />, label: t('member.inviteFriendsTitle'), to: '/member/referral' },
    { icon: <Gift className={iconClass} />, label: t('member.rewardWalletMenu'), to: '/member/rewards' },
    { icon: <Star className={iconClass} />, label: t('member.badgeCollectionMenu'), to: '/member/badges' },
    { icon: <ScanLine className={iconClass} />, label: t('member.checkIn'), to: '/member/check-in' },
    { icon: <Calendar className={iconClass} />, label: t('member.bookClass'), to: '/member/schedule' },
    { icon: <Shield className={iconClass} />, label: t('member.securityLogin'), to: '/member/security' },
    { icon: <Bell className={iconClass} />, label: t('member.notifications'), to: '/member/notifications' },
  ];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {quickItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center line-clamp-1">
              {item.label}
            </span>
          </button>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <MoreHorizontal className={iconClass} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
            {t('member.moreMenu')}
          </span>
        </button>
      </div>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('member.moreMenu')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-2">
            {allPages.map((item) => (
              <button
                key={item.to}
                onClick={() => { setMoreOpen(false); navigate(item.to); }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
