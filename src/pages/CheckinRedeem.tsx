import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTokenInfo, useValidateQRToken } from '@/hooks/useCheckinQR';
import { supabase } from '@/integrations/supabase/client';

type PageState = 'loading' | 'member-input' | 'checking-in' | 'success' | 'error';

const CheckinRedeem = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const { data: tokenInfo, isLoading: tokenLoading, error: tokenError } = useTokenInfo(token);
  const validateToken = useValidateQRToken();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [identifier, setIdentifier] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (tokenLoading) return;

    if (!token || tokenError) {
      setPageState('error');
      setErrorMessage(t('checkinRedeem.invalid'));
      return;
    }

    if (tokenInfo) {
      if (tokenInfo.used_at) {
        setPageState('error');
        setErrorMessage(t('checkinRedeem.alreadyUsed'));
      } else if (new Date(tokenInfo.expires_at) < new Date()) {
        setPageState('error');
        setErrorMessage(t('checkinRedeem.expired'));
      } else {
        setLocationName(tokenInfo.location_name || '');
        setPageState('member-input');
      }
    } else {
      setPageState('error');
      setErrorMessage(t('checkinRedeem.invalid'));
    }
  }, [tokenInfo, tokenLoading, tokenError, token, t]);

  const handleCheckIn = async () => {
    if (!identifier.trim()) return;

    setLookupLoading(true);
    setErrorMessage('');

    try {
      // Look up member by phone or member_id
      const trimmed = identifier.trim();
      // Sanitize: only allow alphanumeric, dash, plus, spaces (prevent PostgREST filter injection)
      const sanitized = trimmed.replace(/[^a-zA-Z0-9\-+\s]/g, '');
      if (!sanitized) {
        setErrorMessage(t('checkinRedeem.memberNotFound'));
        setLookupLoading(false);
        return;
      }
      const { data: members, error: lookupError } = await supabase
        .from('members')
        .select('id, first_name, last_name, nickname')
        .or(`phone.eq."${sanitized}",member_id.eq."${sanitized}"`)
        .limit(1);

      if (lookupError) throw lookupError;

      if (!members || members.length === 0) {
        setErrorMessage(t('checkinRedeem.memberNotFound'));
        setLookupLoading(false);
        return;
      }

      const member = members[0];

      // Validate and redeem the token
      await validateToken.mutateAsync({
        token,
        memberId: member.id,
      });

      setPageState('success');
    } catch (err: any) {
      setErrorMessage(err.message || t('checkinRedeem.error'));
    } finally {
      setLookupLoading(false);
    }
  };

  const isProcessing = lookupLoading || validateToken.isPending;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">{t('checkinRedeem.noToken')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('checkinRedeem.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          )}

          {/* Member Input */}
          {pageState === 'member-input' && (
            <div className="space-y-4">
              {locationName && (
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier">{t('checkinRedeem.enterIdentifier')}</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('checkinRedeem.identifierPlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                  disabled={isProcessing}
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive text-center">{errorMessage}</p>
              )}

              <Button
                className="w-full"
                onClick={handleCheckIn}
                disabled={!identifier.trim() || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('checkinRedeem.checkInButton')}
              </Button>
            </div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-medium text-center">
                {t('checkinRedeem.successMessage', { location: locationName })}
              </p>
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-lg font-medium text-center">{errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckinRedeem;
