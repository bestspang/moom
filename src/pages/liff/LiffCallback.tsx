import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * LIFF Callback page
 * Handles redirect from LIFF login and routes to the correct app shell.
 * In a real setup, LIFF SDK would be initialized here and the ID token
 * would be sent to the line-auth edge function.
 */
const LiffCallback: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Determine target app from state param or default to member
        const targetApp = searchParams.get('app') || 'member';
        const liffState = searchParams.get('liff.state');

        // In production: LIFF SDK init → get ID token → call line-auth edge function
        // For now, redirect to the target app
        const targetPath = targetApp === 'trainer' ? '/liff/trainer' : '/liff/member';
        
        // If there's a liff.state, it may contain the original path
        if (liffState) {
          navigate(liffState, { replace: true });
        } else {
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        console.error('LIFF callback error:', err);
        setError(t('liff.callbackError'));
      }
    };

    handleCallback();
  }, [navigate, searchParams, t]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-destructive font-medium mb-2">{error}</p>
        <button
          onClick={() => navigate('/liff/member', { replace: true })}
          className="text-sm text-primary underline"
        >
          {t('liff.backToApp')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('liff.loggingIn')}</p>
    </div>
  );
};

export default LiffCallback;
