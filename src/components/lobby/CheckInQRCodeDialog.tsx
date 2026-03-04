import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocations } from '@/hooks/useLocations';
import { useGenerateQRToken, getTokenTimeRemaining } from '@/hooks/useCheckinQR';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Printer, RefreshCw } from 'lucide-react';

interface CheckInQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInQRCodeDialog({ open, onOpenChange }: CheckInQRCodeDialogProps) {
  const { t } = useLanguage();
  const { data: locations = [] } = useLocations();
  const generateQR = useGenerateQRToken();
  const [locationId, setLocationId] = useState('');
  const [tokenData, setTokenData] = useState<{ token: string; expires_at: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const qrRef = useRef<HTMLDivElement>(null);

  const locationName = locations.find(l => l.id === locationId)?.name || '';

  // Generate QR when location selected
  const handleGenerate = useCallback(async () => {
    if (!locationId) return;
    const result = await generateQR.mutateAsync({
      locationId,
      expiresInSeconds: 120,
      tokenType: 'checkin',
    });
    setTokenData({ token: result.token, expires_at: result.expires_at });
  }, [locationId, generateQR]);

  // Countdown timer
  useEffect(() => {
    if (!tokenData) return;
    const interval = setInterval(() => {
      const remaining = getTokenTimeRemaining(tokenData.expires_at);
      setCountdown(remaining);
      if (remaining <= 0) {
        // Auto-refresh
        handleGenerate();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenData, handleGenerate]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setLocationId('');
      setTokenData(null);
      setCountdown(0);
    }
  }, [open]);

  const checkinUrl = tokenData
    ? `${window.location.origin}/checkin?token=${tokenData.token}`
    : '';

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `checkin-qr-${locationName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    printWindow.document.write(`
      <html><head><title>Check-in QR - ${locationName}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}
      h2{margin-bottom:8px;}p{color:#666;}</style></head>
      <body>
        <h2>Scan to check in</h2>
        <p>${locationName}</p>
        ${svgData}
        <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('lobby.qrCheckin')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Location selector */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('lobby.location')}</label>
            <Select
              value={locationId}
              onValueChange={(v) => {
                setLocationId(v);
                setTokenData(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('lobby.location')} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {locationId && !tokenData && (
            <Button onClick={handleGenerate} disabled={generateQR.isPending} className="w-full">
              {generateQR.isPending ? t('common.loading') : t('lobby.generateQR')}
            </Button>
          )}

          {tokenData && (
            <div className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={checkinUrl} size={240} level="M" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan to check in at <strong>{locationName}</strong>
              </p>
              <p className="text-sm font-medium">
                {countdown > 0
                  ? `${t('lobby.expiresIn')} ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                  : t('lobby.refreshing')}
              </p>

              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> {t('lobby.downloadQR')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> {t('lobby.printQR')}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-1" /> {t('lobby.refreshQR')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
