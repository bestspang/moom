import { useEffect, useRef, useState } from 'react';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { ScanLine, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useValidateQRToken } from '@/hooks/useCheckinQR';
import { useAuth } from '@/contexts/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

interface CheckinResult {
  success: boolean;
  memberName?: string;
  message: string;
}

export default function StaffCheckinPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const validateToken = useValidateQRToken();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const processingRef = useRef(false);

  const startScanner = async () => {
    if (!containerRef.current) return;
    setResult(null);
    processingRef.current = false;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            // Extract token from QR URL
            const url = new URL(decodedText);
            const params = new URLSearchParams(url.search);
            const memberId = params.get('member');
            const token = params.get('t');

            if (!token) {
              setResult({ success: false, message: t('staff.invalidQrCode', 'Invalid QR code') });
              return;
            }

            const data = await validateToken.mutateAsync({
              token,
              memberId: memberId || undefined,
              staffId: user?.id,
            });

            setResult({
              success: true,
              memberName: data?.memberId || memberId || undefined,
              message: t('staff.checkinSuccess', 'Check-in successful!'),
            });
          } catch (err: any) {
            setResult({
              success: false,
              message: err?.message || t('staff.checkinFailed', 'Check-in failed'),
            });
          }

          // Stop scanner after result
          try {
            await scanner.stop();
          } catch { /* ignore */ }
          setScanning(false);
        },
        () => { /* ignore scan failures */ }
      );

      setScanning(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setResult({ success: false, message: t('staff.cameraError', 'Could not access camera') });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.nav.checkin')} subtitle={t('staff.scanQrCodes')} />

      <Section className="mb-4">
        {/* QR Scanner viewport */}
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-muted aspect-square"
          style={{ display: scanning ? 'block' : 'none' }}
        />

        {/* Result display */}
        {result && (
          <div className={`flex flex-col items-center gap-3 p-6 rounded-lg ${result.success ? 'bg-success/10' : 'bg-destructive/10'}`}>
            {result.success ? (
              <CheckCircle2 className="h-12 w-12 text-success" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
            <p className={`text-lg font-semibold ${result.success ? 'text-success' : 'text-destructive'}`}>
              {result.message}
            </p>
          </div>
        )}

        {/* Scanner icon when idle */}
        {!scanning && !result && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <ScanLine className="h-16 w-16" />
            <p className="text-sm">{t('staff.tapToScan', 'Tap below to start scanning')}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center mt-4">
          {!scanning ? (
            <Button onClick={startScanner} className="gap-2">
              <ScanLine className="h-4 w-4" />
              {result ? t('staff.scanAgain', 'Scan Again') : t('staff.startScanning', 'Start Scanning')}
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanner} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('staff.stopScanning', 'Stop Scanning')}
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
}
