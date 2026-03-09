import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { isCustomDomain } from '@/apps/shared/hostname';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type LoginFormData = { email: string; password: string };

const MemberLogin: React.FC = () => {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  const schema = z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.passwordMinLength').replace('{n}', '6')),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({ variant: 'destructive', title: t('auth.loginFailed'), description: error.message });
      } else {
        toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeBack') });
        navigate('/member');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log('[MemberLogin] Starting Google OAuth...');

      // On custom domains, bypass the lovable auth-bridge and use supabase directly
      if (isCustomDomain()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/member',
            skipBrowserRedirect: true,
          },
        });
        if (error) {
          toast({ variant: 'destructive', title: t('auth.loginFailed'), description: error.message });
        } else if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        // On lovable.app / localhost, use the managed auth-bridge
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });
        console.log('[MemberLogin] OAuth result:', { redirected: (result as any).redirected, error: result.error?.message });
        if (result.error) {
          toast({ variant: 'destructive', title: t('auth.loginFailed'), description: result.error.message });
        }
      }
    } catch (err) {
      console.error('[MemberLogin] OAuth exception:', err);
      toast({ variant: 'destructive', title: t('auth.loginFailed'), description: t('auth.googleSignInFailed') });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      toast({ variant: 'destructive', title: 'Invalid email', description: 'Please enter a valid email address.' });
      return;
    }
    setIsOtpLoading(true);
    try {
      console.log('[MemberLogin] Sending magic link to:', otpEmail);
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          emailRedirectTo: window.location.origin + '/member',
          data: { signup_surface: 'member' },
        },
      });
      if (error) {
        console.error('[MemberLogin] OTP error:', error);
        toast({ variant: 'destructive', title: 'Send failed', description: error.message });
      } else {
        setOtpSent(true);
        toast({ title: 'Check your email ✉️', description: 'We sent a sign-in link to your email.' });
      }
    } catch (err) {
      console.error('[MemberLogin] OTP exception:', err);
      toast({ variant: 'destructive', title: 'Send failed', description: 'Something went wrong.' });
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">MOOM</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google sign-in first for member (preferred flow) */}
          <Button type="button" variant="outline" className="w-full" disabled={isGoogleLoading} onClick={handleGoogleSignIn}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t('auth.googleLogin')}
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('common.or')}</span>
          </div>

          {/* Toggle between password and email OTP */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={loginMode === 'password' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => { setLoginMode('password'); setOtpSent(false); }}
            >
              Password
            </Button>
            <Button
              type="button"
              variant={loginMode === 'otp' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => { setLoginMode('otp'); setOtpSent(false); }}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email Link
            </Button>
          </div>

          {loginMode === 'password' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" placeholder="email@example.com" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">{t('auth.forgotPassword')}</Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.login')}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {otpSent ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">Check your email ✉️</p>
                  <p className="text-sm text-muted-foreground">
                    We sent a sign-in link to <span className="font-medium text-foreground">{otpEmail}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setOtpSent(false)}>
                    Use a different email
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">{t('auth.email')}</Label>
                    <Input
                      id="otp-email"
                      type="email"
                      placeholder="email@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                  <Button type="button" className="w-full" disabled={isOtpLoading} onClick={handleSendOtp}>
                    {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send sign-in link
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No password needed — we'll email you a magic link
                  </p>
                </>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">{t('auth.signUp')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberLogin;
