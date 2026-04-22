import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Mail, Key, Chrome, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderInfo {
  id: string;
  provider: string;
  email?: string;
}

export function IdentityLinkingCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const identities: ProviderInfo[] = (user?.identities ?? []).map(i => ({
    id: i.id,
    provider: i.provider,
    email: (i.identity_data as Record<string, unknown>)?.email as string | undefined,
  }));

  const hasGoogle = identities.some(i => i.provider === 'google');
  const hasEmail = identities.some(i => i.provider === 'email');

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/member/security',
      });
      if (result.error) {
        toast.error(t('identity.linkGoogleFailed'));
      }
    } catch {
      toast.error(t('identity.linkGoogleFailed'));
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 8) {
      toast.error(t('identity.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('identity.passwordMismatch'));
      return;
    }
    setSettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('identity.passwordSetSuccess'));
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      toast.error(t('identity.setPasswordFailed'));
    } finally {
      setSettingPassword(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{t('identity.loginMethods')}</h3>

      {/* Linked providers */}
      <div className="space-y-2">
        {identities.map(i => (
          <div key={i.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            {i.provider === 'google' ? (
              <Chrome className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Mail className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground capitalize">{i.provider}</p>
              {i.email && <p className="text-xs text-muted-foreground truncate">{i.email}</p>}
            </div>
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Link Google */}
      {!hasGoogle && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLinkGoogle}
          disabled={linkingGoogle}
        >
          {linkingGoogle ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Chrome className="h-4 w-4 mr-2" />
          )}
          {t('identity.linkGoogle')}
        </Button>
      )}

      {/* Set password */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {hasEmail ? t('identity.updatePassword') : t('identity.setPassword')}
          </p>
        </div>
        <div className="space-y-2">
          <div>
            <Label htmlFor="new-pw" className="text-xs text-muted-foreground">{t('identity.newPassword')}</Label>
            <Input
              id="new-pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('identity.minCharsPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="confirm-pw" className="text-xs text-muted-foreground">{t('identity.confirmPassword')}</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t('identity.reEnterPassword')}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSetPassword}
            disabled={settingPassword || !password}
          >
            {settingPassword ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            {hasEmail ? t('identity.updatePassword') : t('identity.setPassword')}
          </Button>
        </div>
      </div>
    </div>
  );
}
