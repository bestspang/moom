/* Check-In Page — 3-Zone Thumb-Friendly Layout
   Zone 1 (top):    Member QR card — staff scans this
   Zone 2 (middle): Code input + streak
   Zone 3 (bottom): Scan CTA button — thumb zone
*/
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Loader2, Send, X } from 'lucide-react';
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

type CameraState = 'ready' | 'scanning' | 'processing' | 'fallback';

/* ─── Member QR Card ─── */
function MemberQRCard({ memberId, t }: { memberId: string; t: (key: string) => string }) {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 30000));
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTick(Math.floor(now / 30000));
      setCountdown(30 - Math.floor((now % 30000) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const qrValue = useMemo(
    () => `${window.location.origin}/checkin?member=${memberId}&t=${tick}`,
    [memberId, tick],
  );

  return (
    <div className="flex flex-col items-center gap-3 px-4">
      <div className="bg-card rounded-2xl p-6 shadow-lg border border-border w-full max-w-xs flex flex-col items-center gap-4">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <QRCodeSVG value={qrValue} size={200} level="M" />
        </div>
        <p className="text-sm font-medium text-foreground">{t('member.showToStaff')}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t('member.refreshesIn')}</span>
          <span className="font-mono font-semibold text-foreground">
            0:{countdown.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Code Input ─── */
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

/* ─── Fullscreen Camera Overlay ─── */
function CameraOverlay({
  cameraState,
  containerRef,
  onClose,
  t,
}: {
  cameraState: CameraState;
  containerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <p className="text-white text-sm font-medium">{t('member.scanQrAtGym')}</p>
        <button
          onClick={onClose}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 active:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-[280px] h-[280px] rounded-2xl overflow-hidden">
          <div id="qr-reader" ref={containerRef} className="w-full h-full" />
          {cameraState === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
              <Loader2 className="h-10 w-10 text-white animate-spin mb-2" />
              <p className="text-sm font-semibold text-white">{t('member.qrCheckInSuccess')}</p>
            </div>
          )}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg pointer-events-none" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg pointer-events-none" />
        </div>
      </div>

      <div className="pb-safe px-4 py-6 flex justify-center">
        <p className="text-white/60 text-xs text-center">{t('member.scanQrAtGym')}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  Main Page
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

  const extractToken = useCallback((text: string): string | null => {
    try {
      const url = new URL(text);
      return url.searchParams.get('token');
    } catch {
      return text.length > 20 ? text : null;
    }
  }, []);

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
        setCameraState('ready');
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
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decoded) => handleQrScan(decoded),
        () => {},
      );
    } catch {
      scannerRef.current = null;
      setCameraState('fallback');
    } finally {
      startingRef.current = false;
    }
  }, [handleQrScan]);

  useEffect(() => {
    if (cameraState === 'scanning' && !scannerRef.current?.isScanning && !startingRef.current) {
      startScanner();
    }
  }, [cameraState, startScanner]);

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s) {
        try { if (s.isScanning) s.stop(); s.clear(); } catch { /* ignore */ }
      }
    };
  }, []);

  const handleOpenCamera = useCallback(() => setCameraState('scanning'), []);

  const handleCloseCamera = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current?.clear();
    } catch { /* ignore */ }
    scannerRef.current = null;
    startingRef.current = false;
    processingRef.current = false;
    setCameraState('ready');
  }, []);

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
          toast.error(t('member.codeExpired'));
        } else {
          toast.error(t('member.checkinFailed'));
        }
      } finally {
        setIsCodeSubmitting(false);
      }
    },
    [memberId, validateQR, onCheckInSuccess, t],
  );

  const showOverlay = cameraState === 'scanning' || cameraState === 'processing';

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] overflow-hidden animate-in fade-in-0 duration-200">

      {/* ── Page header ── */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-foreground">{t('member.checkinTitle')}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t('member.checkinSubtitle')}</p>
      </div>

      {/* ── Zone 1: Member QR (top) ── */}
      <div className="pt-2 pb-3">
        {memberId ? (
          <MemberQRCard memberId={memberId} t={t} />
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* ── Zone 2: Code input ── */}
      <Divider label={t('member.orEnterCode')} />
      <div className="py-3">
        <CodeInputSection onSubmit={handleCodeSubmit} isSubmitting={isCodeSubmitting} t={t} />
      </div>

      {/* ── Streak (motivation) ── */}
      {profile?.currentStreak != null && profile.currentStreak > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 px-4">
          <StreakFlame weeklyCheckinDays={profile.weeklyCheckinDays} currentStreakWeeks={profile.currentStreak} />
          <span className="text-sm text-muted-foreground">
            {t('member.streakDay', { n: profile.currentStreak })}
          </span>
        </div>
      )}

      {/* ── Spacer ── */}
      <div className="flex-1 min-h-4" />

      {/* ── Zone 3: Scan CTA (bottom, thumb zone) ── */}
      <div className="px-4 pb-4">
        {cameraState === 'fallback' ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground max-w-[220px]">{t('member.cameraAccessDenied')}</p>
          </div>
        ) : (
          <Button
            onClick={handleOpenCamera}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-3 shadow-lg"
            size="lg"
          >
            <Camera className="h-5 w-5" />
            {t('member.scanAtGym')}
          </Button>
        )}
      </div>

      {/* ── Camera overlay ── */}
      {showOverlay && (
        <CameraOverlay
          cameraState={cameraState}
          containerRef={containerRef}
          onClose={handleCloseCamera}
          t={t}
        />
      )}

      {/* ── Celebration ── */}
      <CheckInCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        profile={profile ?? null}
      />
    </div>
  );
}
