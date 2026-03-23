/* 3-zone check-in: camera + member QR + code input — CHECKIN_V3 */
const CHECKIN_VERSION = 'CHECKIN_V3';
console.info(`[MemberCheckInPage] module loaded — ${CHECKIN_VERSION}`);
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Loader2, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMomentumProfile } from '../features/momentum/api';
import { CheckInCelebration } from '../features/momentum/CheckInCelebration';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { useValidateQRToken } from '@/hooks/useCheckinQR';
import { fireGamificationEvent } from '@/lib/gamificationEvents';

/* ─── State Machine ───
 *  ready      → user taps camera card → scanning
 *  scanning   → useEffect starts camera after DOM renders → camera live
 *  processing → QR decoded, validating → celebration or back to scanning
 *  fallback   → camera unavailable, scanner section shows message
 *
 *  RULE: Never call startScanner() while state === 'ready'.
 *        The #qr-reader container only exists when state is scanning/processing.
 */
type CameraState = 'ready' | 'scanning' | 'processing' | 'fallback';

/* ─── Camera Scanner Section ─── */
function CameraScannerSection({
  cameraState,
  onTapToScan,
  containerRef,
  t,
}: {
  cameraState: CameraState;
  onTapToScan: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  t: (key: string) => string;
}) {
  if (cameraState === 'ready') {
    return (
      <button
        onClick={onTapToScan}
        className="w-full flex flex-col items-center gap-3 py-6 active:scale-[0.97] transition-transform"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
          <Camera className="h-9 w-9 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{t('member.tapToScan')}</p>
        <p className="text-xs text-muted-foreground">{t('member.scanQrAtGym')}</p>
      </button>
    );
  }

  if (cameraState === 'scanning' || cameraState === 'processing') {
    return (
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="relative w-full max-w-[220px] aspect-square rounded-xl overflow-hidden border-2 border-primary/30 shadow-md bg-black/5">
          <div id="qr-reader" ref={containerRef} className="w-full h-full" />
          {cameraState === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-1" />
              <p className="text-xs font-semibold text-foreground">{t('member.qrCheckInSuccess')}</p>
            </div>
          )}
          {/* Corner markers */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-sm pointer-events-none" />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-primary" />
          {t('member.scanQrAtGym')}
        </p>
      </div>
    );
  }

  // fallback
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Camera className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground max-w-[200px]">{t('member.cameraAccessDenied')}</p>
    </div>
  );
}

/* ─── Member QR Section ─── */
function MemberQRSection({ memberId, t }: { memberId: string; t: (key: string) => string }) {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 30000));
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentTick = Math.floor(now / 30000);
      const remaining = 30 - Math.floor((now % 30000) / 1000);
      setTick(currentTick);
      setCountdown(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const qrValue = useMemo(
    () => `${window.location.origin}/checkin?member=${memberId}&t=${tick}`,
    [memberId, tick],
  );

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="bg-white p-3 rounded-xl shadow-sm border border-border">
        <QRCodeSVG value={qrValue} size={160} level="M" />
      </div>
      <p className="text-xs text-muted-foreground">
        {t('member.gymScansThis')} · {t('member.refreshesIn')} 0:{countdown.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

/* ─── Code Input Section ─── */
function CodeInputSection({
  onSubmit,
  isSubmitting,
  t,
}: {
  onSubmit: (code: string) => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setCode('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 px-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t('member.enterCode')}
        className="flex-1 h-11 rounded-xl text-sm"
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isSubmitting || !code.trim()}
        className="h-11 w-11 rounded-xl shrink-0"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}

/* ─── Divider ─── */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  Main Page Component
 * ═══════════════════════════════════════════════ */
export default function MemberCheckInPage() {
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const queryClient = useQueryClient();
  const validateQR = useValidateQRToken();

  const [cameraState, setCameraState] = useState<CameraState>('ready');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const startingRef = useRef(false);

  const { data: profile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  // ─── Extract token from QR URL ───
  const extractToken = useCallback((text: string): string | null => {
    try {
      const url = new URL(text);
      return url.searchParams.get('token');
    } catch {
      return text.length > 20 ? text : null;
    }
  }, []);

  // ─── Shared success handler ───
  const onCheckInSuccess = useCallback(async () => {
    if (!memberId) return;
    fireGamificationEvent({
      event_type: 'check_in',
      member_id: memberId,
      idempotency_key: `checkin:${memberId}:${new Date().toISOString().split('T')[0]}:${Date.now()}`,
      metadata: { method: 'qr_scan' },
    });
    await queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['my-quests'] });
    setShowCelebration(true);
  }, [memberId, queryClient]);

  // ─── Handle QR scan result ───
  const handleQrScan = useCallback(
    async (decodedText: string) => {
      if (processingRef.current || !memberId) return;
      processingRef.current = true;
      setCameraState('processing');

      const token = extractToken(decodedText);
      if (!token) {
        toast.error(t('member.checkinFailed'));
        processingRef.current = false;
        setCameraState('scanning');
        return;
      }

      try {
        if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      } catch { /* ignore */ }

      try {
        await validateQR.mutateAsync({ token, memberId });
        await onCheckInSuccess();
      } catch (err: any) {
        const msg = err?.message || '';
        toast.error(msg.includes('already') || msg.includes('used') ? t('member.alreadyCheckedIn') : t('member.checkinFailed'));
        setCameraState('scanning');
      } finally {
        processingRef.current = false;
      }
    },
    [memberId, extractToken, validateQR, onCheckInSuccess, t],
  );

  // ─── Start camera (only from useEffect when DOM exists) ───
  const startScanner = useCallback(async () => {
    if (!containerRef.current || startingRef.current) return;
    if (scannerRef.current?.isScanning) return;
    startingRef.current = true;

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.clear(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 180, height: 180 }, aspectRatio: 1 },
        (decoded) => handleQrScan(decoded),
        () => {},
      );
    } catch (err) {
      console.warn('[check-in] Camera failed:', err);
      scannerRef.current = null;
      setCameraState('fallback');
    } finally {
      startingRef.current = false;
    }
  }, [handleQrScan]);

  // Start scanner when scanning state + DOM ready
  useEffect(() => {
    if (cameraState === 'scanning' && !scannerRef.current?.isScanning && !startingRef.current) {
      startScanner();
    }
  }, [cameraState, startScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s) {
        try { if (s.isScanning) s.stop(); s.clear(); } catch { /* ignore */ }
      }
    };
  }, []);

  // ─── Handlers ───
  const handleTapToScan = useCallback(() => setCameraState('scanning'), []);

  const handleCodeSubmit = useCallback(
    async (code: string) => {
      if (!memberId) return;
      setIsCodeSubmitting(true);
      try {
        await validateQR.mutateAsync({ token: code, memberId });
        await onCheckInSuccess();
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('already') || msg.includes('used')) {
          toast.error(t('member.alreadyCheckedIn'));
        } else if (msg.includes('expired')) {
          toast.error(t('member.codeExpired', 'Code expired'));
        } else {
          toast.error(t('member.checkinFailed'));
        }
      } finally {
        setIsCodeSubmitting(false);
      }
    },
    [memberId, validateQR, onCheckInSuccess, t],
  );

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] animate-in fade-in-0 duration-200">
      {/* Zone 1: Camera Scanner */}
      <CameraScannerSection
        cameraState={cameraState}
        onTapToScan={handleTapToScan}
        containerRef={containerRef}
        t={t}
      />

      <Divider label={t('member.myQrCode')} />

      {/* Zone 2: Member QR Code */}
      {memberId ? (
        <MemberQRSection memberId={memberId} t={t} />
      ) : (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
      )}

      <Divider label={t('member.orEnterCode')} />

      {/* Zone 3: Code Input */}
      <CodeInputSection onSubmit={handleCodeSubmit} isSubmitting={isCodeSubmitting} t={t} />

      {/* Streak */}
      {profile?.currentStreak != null && profile.currentStreak > 0 && (
        <div className="flex items-center justify-center gap-2 py-3 mt-auto">
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
