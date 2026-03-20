import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { Zap, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMomentumProfile } from '../features/momentum/api';
import { CheckInCelebration } from '../features/momentum/CheckInCelebration';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { useValidateQRToken } from '@/hooks/useCheckinQR';
import { memberSelfCheckin } from '../api/services';
import { fireGamificationEvent } from '@/lib/gamificationEvents';

type PageState = 'ready' | 'scanning' | 'processing' | 'fallback';

export default function MemberCheckInPage() {
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const queryClient = useQueryClient();
  const validateQR = useValidateQRToken();

  const [state, setState] = useState<PageState>('ready');
  const [isChecking, setIsChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  const { data: profile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  // Extract token from scanned QR URL
  const extractToken = useCallback((text: string): string | null => {
    try {
      const url = new URL(text);
      return url.searchParams.get('token');
    } catch {
      // If not a URL, treat the raw text as a token
      return text.length > 20 ? text : null;
    }
  }, []);

  // Handle successful check-in (shared between QR and self-service)
  const onCheckInSuccess = useCallback(async () => {
    if (!memberId) return;
    fireGamificationEvent({
      event_type: 'check_in',
      member_id: memberId,
      idempotency_key: `checkin:${memberId}:${new Date().toISOString().split('T')[0]}:${Date.now()}`,
      metadata: { method: 'self_service' },
    });
    await queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['my-quests'] });
    setShowCelebration(true);
  }, [memberId, queryClient]);

  // Handle QR scan result
  const handleQrScan = useCallback(async (decodedText: string) => {
    if (processingRef.current || !memberId) return;
    processingRef.current = true;
    setState('processing');

    const token = extractToken(decodedText);
    if (!token) {
      toast.error(t('member.checkinFailed'));
      processingRef.current = false;
      setState('scanning');
      return;
    }

    try {
      // Stop scanner before processing
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch { /* ignore stop errors */ }

    try {
      await validateQR.mutateAsync({ token, memberId });
      await onCheckInSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already') || msg.includes('used')) {
        toast.error(t('member.alreadyCheckedIn'));
      } else if (msg.includes('expired')) {
        toast.error(t('member.checkinFailed'));
      } else {
        toast.error(t('member.checkinFailed'));
      }
      setState('scanning');
      startScanner();
    } finally {
      processingRef.current = false;
    }
  }, [memberId, extractToken, validateQR, onCheckInSuccess, t]);

  // Start camera scanner
  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    const containerId = 'qr-reader';

    try {
      // Clean up existing
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch { /* ignore */ }
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => handleQrScan(decodedText),
        () => { /* ignore scan errors (no QR in frame) */ }
      );

      setState('scanning');
    } catch (err) {
      console.warn('[check-in] Camera failed:', err);
      setState('fallback');
    }
  }, [handleQrScan]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch { /* ignore cleanup errors */ }
      }
    };
  }, []);

  // Start camera from user gesture (required by mobile browsers)
  const handleStartCamera = useCallback(() => {
    startScanner();
  }, [startScanner]);

  // Self-service fallback handler
  const handleSelfCheckin = useCallback(async () => {
    if (!memberId) return;
    setIsChecking(true);
    try {
      await memberSelfCheckin(memberId);
      await onCheckInSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already_checked_in') || msg.includes('already checked in')) {
        toast.error(t('member.alreadyCheckedIn'));
      } else if (msg.includes('member_inactive') || msg.includes('not active')) {
        toast.error(t('member.membershipInactive'));
      } else {
        toast.error(t('member.checkinFailed'));
      }
    } finally {
      setIsChecking(false);
    }
  }, [memberId, onCheckInSuccess, t]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] animate-in fade-in-0 duration-200">
      {/* Camera Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-2">
        {state === 'ready' ? (
          /* Ready: tap to activate camera */
          <button
            onClick={handleStartCamera}
            className="flex flex-col items-center gap-4 text-center px-4 active:scale-[0.97] transition-transform"
          >
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">{t('member.tapToScan')}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t('member.scanQrAtGym')}</p>
          </button>
        ) : state === 'scanning' || state === 'processing' ? (
          <>
            <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg bg-black/5">
              <div id="qr-reader" ref={containerRef} className="w-full h-full" />

              {state === 'processing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-sm font-semibold text-foreground">{t('member.qrCheckInSuccess')}</p>
                </div>
              )}

              {/* Corner markers */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Camera className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">{t('member.scanQrAtGym')}</p>
            </div>
          </>
        ) : (
          /* Fallback: no camera */
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t('member.cameraAccessDenied')}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-6 py-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('member.orQuickCheckin')}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Self-service button */}
      <div className="px-4 pb-3">
        <Button
          onClick={handleSelfCheckin}
          disabled={isChecking}
          className="w-full h-14 text-base font-bold gap-2 rounded-xl"
          size="lg"
        >
          <Zap className="h-5 w-5" />
          {isChecking ? t('member.checkingIn') : t('member.quickCheckIn')}
        </Button>
      </div>

      {/* Streak info */}
      {profile?.currentStreak != null && profile.currentStreak > 0 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <StreakFlame weeklyCheckinDays={profile.weeklyCheckinDays} currentStreakWeeks={profile.currentStreak} />
          <span className="text-sm text-muted-foreground">
            {t('member.streakDay', { n: profile.currentStreak })}
          </span>
        </div>
      )}

      <CheckInCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        profile={profile ?? null}
      />
    </div>
  );
}
