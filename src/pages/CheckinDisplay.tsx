import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/hooks/useLocations';
import { useGenerateQRToken, getTokenTimeRemaining } from '@/hooks/useCheckinQR';
import { supabase } from '@/integrations/supabase/client';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Settings, Dumbbell, LogIn, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'checkin-display-location';
const TOKEN_LIFETIME = 15; // seconds

function CircularCountdown({ remaining, total }: { remaining: number; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const offset = circumference * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-foreground tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function CheckinDisplay() {
  const { t } = useLanguage();
  const { user, loading: authLoading, signIn, accessLevel } = useAuth();
  const { data: locations = [] } = useLocations();
  const generateQR = useGenerateQRToken();

  const [locationId, setLocationId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [showSettings, setShowSettings] = useState(false);
  const [tokenData, setTokenData] = useState<{ token: string; expires_at: string; id?: string } | null>(null);
  const [countdown, setCountdown] = useState(TOKEN_LIFETIME);
  const [pulse, setPulse] = useState(false);
  const [celebration, setCelebration] = useState<{ memberName: string } | null>(null);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const locationName = locations.find((l) => l.id === locationId)?.name || '';

  // Check if user has operator-level access
  const levelOrder: Record<string, number> = {
    level_1_minimum: 1,
    level_2_operator: 2,
    level_3_manager: 3,
    level_4_master: 4,
  };
  const hasAccess = user && accessLevel && (levelOrder[accessLevel] ?? 0) >= 2;

  // Determine if location selector should show
  const needsLocation = !locationId || showSettings;

  // Request wake lock to prevent screen sleep
  useEffect(() => {
    let active = true;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // silently fail
      }
    };
    if (!needsLocation) requestWakeLock();
    return () => {
      active = false;
      wakeLockRef.current?.release();
    };
  }, [needsLocation]);

  // Realtime subscription for check-in events
  useEffect(() => {
    if (!locationId || needsLocation) return;

    const channel = supabase
      .channel('kiosk-checkin-feedback')
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'checkin_qr_tokens',
          filter: `location_id=eq.${locationId}`,
        },
        async (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          const oldRecord = payload.old as Record<string, unknown>;

          // Only trigger when used_at changes from null to a value
          if (!oldRecord?.used_at && newRecord?.used_at) {
            // Try to fetch member name
            let memberName = '';
            const memberId = newRecord.member_id as string | null;
            if (memberId) {
              const { data: member } = await supabase
                .from('members')
                .select('first_name, last_name')
                .eq('id', memberId)
                .single();
              if (member) {
                memberName = [member.first_name, member.last_name].filter(Boolean).join(' ');
              }
            }

            setCelebration({ memberName: memberName || 'Member' });

            // Clear after 3 seconds
            if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
            celebrationTimeoutRef.current = setTimeout(() => {
              setCelebration(null);
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
    };
  }, [locationId, needsLocation]);

  // Generate QR token
  const generate = useCallback(async () => {
    if (!locationId) return;
    try {
      const result = await generateQR.mutateAsync({
        locationId,
        expiresInSeconds: TOKEN_LIFETIME,
        tokenType: 'checkin',
      });
      setTokenData({ token: result.token, expires_at: result.expires_at, id: result.id });
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch {
      // retry after 5s on error
      setTimeout(() => generate(), 5000);
    }
  }, [locationId, generateQR]);

  // Auto-generate on location select
  useEffect(() => {
    if (locationId && !needsLocation) {
      generate();
    }
  }, [locationId, needsLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown + auto-refresh
  useEffect(() => {
    if (!tokenData) return;
    const interval = setInterval(() => {
      const remaining = getTokenTimeRemaining(tokenData.expires_at);
      setCountdown(remaining);
      if (remaining <= 0) {
        generate();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenData, generate]);

  const handleSelectLocation = (id: string) => {
    setLocationId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setShowSettings(false);
    setTokenData(null);
  };

  const checkinUrl = tokenData
    ? `${window.location.origin}/checkin?token=${tokenData.token}`
    : '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
    if (error) {
      toast.error(error.message || 'Login failed');
    }
  };

  // ── Auth loading ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Dumbbell className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  // ── Login screen (staff must authenticate) ──
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {t('checkinDisplay.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            Staff login required to start kiosk
          </p>
          <Input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loginLoading}>
            <LogIn className="h-4 w-4 mr-2" />
            {loginLoading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    );
  }

  // ── Location selector screen ──
  if (needsLocation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {t('checkinDisplay.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('checkinDisplay.selectLocation')}
          </p>
          <Select value={locationId} onValueChange={handleSelectLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('lobby.location')} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showSettings && (
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Kiosk display ──
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none relative">
      {/* Celebration overlay */}
      {celebration && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-success text-success-foreground text-center animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-lg font-bold">Check-in สำเร็จ! ✨ — {celebration.memberName}</span>
          </div>
        </div>
      )}

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Logo + title */}
      <div className="mb-8 text-center">
        <Dumbbell className="h-10 w-10 text-primary mx-auto mb-3" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {t('checkinDisplay.scanToCheckIn')}
        </h1>
      </div>

      {/* QR Code */}
      <div
        className={`bg-white p-5 rounded-2xl shadow-lg transition-transform duration-300 ${
          pulse ? 'scale-105' : 'scale-100'
        }`}
      >
        {checkinUrl ? (
          <QRCodeSVG
            value={checkinUrl}
            size={280}
            level="M"
            className="w-[200px] h-[200px] md:w-[280px] md:h-[280px]"
          />
        ) : (
          <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{t('common.loading')}</span>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="mt-6 flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-medium">{locationName}</span>
      </div>

      {/* Countdown ring */}
      <div className="mt-6">
        <CircularCountdown remaining={countdown} total={TOKEN_LIFETIME} />
      </div>

      {/* Live clock */}
      <div className="mt-4">
        <LiveClock />
      </div>
    </div>
  );
}
