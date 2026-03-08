import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ScanLine, Hash, Camera, CameraOff, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMomentumProfile, fetchMyChallengeProgress } from '../features/momentum/api';
import { CheckInCelebration } from '../features/momentum/CheckInCelebration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsQR from 'jsqr';

export default function MemberCheckInPage() {
  const { memberId } = useMemberSession();
  const [memberCode, setMemberCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const { data: profile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: challenges } = useQuery({
    queryKey: ['my-challenges', memberId],
    queryFn: () => fetchMyChallengeProgress(memberId!),
    enabled: !!memberId,
  });

  const handleCheckIn = useCallback(async (code: string) => {
    if (!code.trim() || !memberId) return;
    setIsChecking(true);
    try {
      // Insert attendance record
      const { error } = await supabase
        .from('member_attendance')
        .insert({
          member_id: memberId,
          checkin_method: 'qr',
          check_in_type: 'walk_in',
          check_in_time: new Date().toISOString(),
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['my-challenges'] });
      setMemberCode('');
      stopScanning();
      setShowCelebration(true);
    } catch {
      toast.error('Failed to check in. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [memberId, queryClient]);

  const stopScanning = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (qr?.data) {
      setMemberCode(qr.data);
      handleCheckIn(qr.data);
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleCheckIn]);

  const startScanning = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError('Camera access denied. Use the manual input below.');
    }
  }, [scanFrame]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Check-in" subtitle="Scan QR or enter code to earn XP" />

      <Section className="mb-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card p-6 shadow-sm border border-border overflow-hidden relative">
          {scanning ? (
            <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border-2 border-primary bg-foreground/5">
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
              {/* Corner markers */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-6 h-6 pointer-events-none border-primary`}
                  style={{
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    borderColor: 'hsl(var(--primary))',
                    ...(pos.includes('top') ? {} : { borderTop: 'none' }),
                    ...(pos.includes('bottom') ? {} : { borderBottom: 'none' }),
                    ...(pos.includes('left') ? {} : { borderLeft: 'none' }),
                    ...(pos.includes('right') ? {} : { borderRight: 'none' }),
                    borderRadius: pos.includes('top') && pos.includes('left') ? '8px 0 0 0'
                      : pos.includes('top') && pos.includes('right') ? '0 8px 0 0'
                      : pos.includes('bottom') && pos.includes('left') ? '0 0 0 8px'
                      : '0 0 8px 0',
                  }}
                />
              ))}
              <canvas ref={canvasRef} className="hidden" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-lg"
                onClick={stopScanning}
              >
                <CameraOff className="h-4 w-4 mr-1.5" />
                Stop
              </Button>
            </div>
          ) : (
            <>
              <button
                onClick={startScanning}
                className="group flex h-28 w-28 items-center justify-center rounded-2xl bg-primary transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
              >
                <div className="flex flex-col items-center gap-1.5 text-primary-foreground">
                  <Camera className="h-10 w-10 group-hover:animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Scan QR</span>
                </div>
              </button>
              {cameraError && (
                <p className="text-xs text-destructive text-center max-w-xs">{cameraError}</p>
              )}
            </>
          )}

          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or type code</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="w-full max-w-xs space-y-3">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Member code..."
                value={memberCode}
                onChange={e => setMemberCode(e.target.value)}
                className="pl-9 text-center font-mono text-lg tracking-wider"
                onKeyDown={e => e.key === 'Enter' && handleCheckIn(memberCode)}
              />
            </div>
            <Button
              className="w-full font-bold text-base gap-2"
              size="lg"
              onClick={() => handleCheckIn(memberCode)}
              disabled={isChecking || !memberCode.trim()}
            >
              <Zap className="h-5 w-5" />
              {isChecking ? 'Checking in...' : 'Check In & Earn XP'}
            </Button>
          </div>
        </div>
      </Section>

      <CheckInCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        profile={profile ?? null}
        challenges={challenges ?? []}
      />
    </div>
  );
}
