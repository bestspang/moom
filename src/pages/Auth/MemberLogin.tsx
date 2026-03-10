import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Phone, KeyRound } from 'lucide-react';
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

type LoginFormData = { email: string; password: string };
type LoginMode = 'password' | 'email_otp' | 'phone_otp';

const RESEND_COOLDOWN = 60;

const MemberLogin: React.FC = () => {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');

  // Email OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Resend timer
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

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
      if (isCustomDomain()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/member',
            skipBrowserRedirect: true,
            queryParams: { prompt: 'select_account' },
          },
        });
        if (error) {
          toast({ variant: 'destructive', title: t('auth.loginFailed'), description: error.message });
        } else if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });
        if (result.error) {
          toast({ variant: 'destructive', title: t('auth.loginFailed'), description: result.error.message });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.loginFailed'), description: t('auth.googleSignInFailed') });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      toast({ variant: 'destructive', title: t('validation.invalidEmail') });
      return;
    }
    setIsOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          emailRedirectTo: window.location.origin + '/member',
          data: { signup_surface: 'member' },
        },
      });
      if (error) {
        toast({ variant: 'destructive', title: t('auth.loginFailed'), description: error.message });
      } else {
        setEmailOtpSent(true);
        setResendTimer(RESEND_COOLDOWN);
        toast({ title: t('auth.checkYourEmail'), description: t('auth.weSentLink') + ' ' + otpEmail });
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.loginFailed') });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 8) {
      toast({ variant: 'destructive', title: t('auth.loginFailed'), description: t('auth.phoneNumber') + ' is required' });
      return;
    }
    setIsOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleaned,
        options: { data: { signup_surface: 'member' } },
      });
      if (error) {
        toast({ variant: 'destructive', title: t('auth.loginFailed'), description: error.message });
      } else {
        setPhoneOtpSent(true);
        setResendTimer(RESEND_COOLDOWN);
        toast({ title: t('auth.otpSent'), description: t('auth.otpSentDescription') + ' ' + cleaned });
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.loginFailed') });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    const cleaned = phoneNumber.replace(/\s/g, '');
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: cleaned,
        token: code,
        type: 'sms',
      });
      if (error) {
        toast({ variant: 'destructive', title: t('auth.invalidCode'), description: error.message });
        setPhoneOtpCode('');
      } else {
        toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeBack') });
        navigate('/member');
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.loginFailed') });
    } finally {
      setIsVerifying(false);
    }
  }, [phoneNumber, navigate, t, toast]);

  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setEmailOtpSent(false);
    setPhoneOtpSent(false);
    setPhoneOtpCode('');
    setResendTimer(0);
  };

  const modes: { key: LoginMode; label: string; icon: React.ReactNode }[] = [
    { key: 'password', label: t('auth.passwordLogin'), icon: <KeyRound className="h-3.5 w-3.5" /> },
    { key: 'email_otp', label: t('auth.emailLink'), icon: <Mail className="h-3.5 w-3.5" /> },
    { key: 'phone_otp', label: t('auth.phoneOtp'), icon: <Phone className="h-3.5 w-3.5" /> },
  ];

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
          {/* Google sign-in */}
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

          {/* 3-option mode selector */}
          <div className="flex rounded-lg bg-muted p-1 mb-4">
            {modes.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => switchMode(m.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                  loginMode === m.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {/* === Password mode === */}
          {loginMode === 'password' && (
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
          )}

          {/* === Email OTP mode === */}
          {loginMode === 'email_otp' && (
            <div className="space-y-4">
              {emailOtpSent ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">{t('auth.checkYourEmail')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('auth.weSentLink')} <span className="font-medium text-foreground">{otpEmail}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setEmailOtpSent(false)}>
                    {t('auth.useDifferentEmail')}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSendEmailOtp()}
                    />
                  </div>
                  <Button type="button" className="w-full" disabled={isOtpLoading} onClick={handleSendEmailOtp}>
                    {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendSignInLink')}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t('auth.noPasswordNeeded')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* === Phone OTP mode === */}
          {loginMode === 'phone_otp' && (
            <div className="space-y-4">
              {phoneOtpSent ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('auth.enterCode')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('auth.otpSentDescription')} <span className="font-medium text-foreground">{phoneNumber}</span>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={phoneOtpCode}
                      onChange={(val) => {
                        setPhoneOtpCode(val);
                        if (val.length === 6) handleVerifyPhoneOtp(val);
                      }}
                      disabled={isVerifying}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {isVerifying && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.verifyCode')}...
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t('auth.resendIn').replace('{{seconds}}', String(resendTimer))}
                      </p>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={handleSendPhoneOtp} disabled={isOtpLoading}>
                        {t('auth.resendCode')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(''); }}>
                      {t('auth.useDifferentEmail').replace('email', 'number')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('auth.phonePlaceholder')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendPhoneOtp()}
                    />
                  </div>
                  <Button type="button" className="w-full" disabled={isOtpLoading} onClick={handleSendPhoneOtp}>
                    {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendOtp')}
                  </Button>
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
