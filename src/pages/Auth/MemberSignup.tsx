import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

type SignupFormData = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string };
type SignupMode = 'email' | 'phone';

const RESEND_COOLDOWN = 60;

const MemberSignup: React.FC = () => {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [signupMode, setSignupMode] = useState<SignupMode>('email');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFirstName, setPhoneFirstName] = useState('');
  const [phoneLastName, setPhoneLastName] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const schema = z.object({
    firstName: z.string().min(1, t('validation.required')),
    lastName: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.passwordMinLength').replace('{n}', '6')),
    confirmPassword: z.string(),
  }).refine(d => d.password === d.confirmPassword, {
    message: t('validation.passwordsNotMatch'),
    path: ['confirmPassword'],
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email.toLowerCase().trim(), data.password, data.firstName, data.lastName, 'member', referralCode ? { referral_code: referralCode } : undefined);
      if (error) {
        toast({ variant: 'destructive', title: t('auth.signupFailed'), description: error.message });
      } else {
        toast({ title: t('auth.signupSuccess'), description: t('auth.checkEmail') });
        navigate('/member/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/member`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast({ variant: 'destructive', title: t('auth.signupFailed'), description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.signupFailed'), description: t('auth.googleSignInFailed') });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 8) {
      toast({ variant: 'destructive', title: t('auth.signupFailed'), description: t('validation.required') });
      return;
    }
    if (!phoneFirstName.trim()) {
      toast({ variant: 'destructive', title: t('auth.signupFailed'), description: t('validation.required') });
      return;
    }
    setIsPhoneLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleaned,
        options: {
          data: {
            signup_surface: 'member',
            first_name: phoneFirstName.trim(),
            last_name: phoneLastName.trim(),
            ...(referralCode ? { referral_code: referralCode } : {}),
          },
        },
      });
      if (error) {
        toast({ variant: 'destructive', title: t('auth.signupFailed'), description: error.message });
      } else {
        setPhoneOtpSent(true);
        setResendTimer(RESEND_COOLDOWN);
        toast({ title: t('auth.otpSent'), description: t('auth.otpSentDescription') + ' ' + cleaned });
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.signupFailed') });
    } finally {
      setIsPhoneLoading(false);
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
        toast({ title: t('auth.signupSuccess'), description: t('auth.welcomeBack') });
        navigate('/member');
      }
    } catch {
      toast({ variant: 'destructive', title: t('auth.signupFailed') });
    } finally {
      setIsVerifying(false);
    }
  }, [phoneNumber, navigate, t, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.joinMoom')}</CardTitle>
          <CardDescription>{t('auth.signupDescription')}</CardDescription>
          {referralCode && (
            <div className="mt-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
              <p className="text-xs text-primary font-semibold">{t('auth.referralApplied').replace('{{code}}', referralCode)}</p>
              <p className="text-xs text-muted-foreground">{t('auth.referralBothEarn')}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" className="w-full" disabled={isGoogleLoading} onClick={handleGoogleSignIn}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t('auth.signUpWithGoogle')}
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('common.or')}</span>
          </div>

          {/* Mode toggle: Email / Phone */}
          <div className="flex rounded-lg bg-muted p-1 mb-4">
            <button
              type="button"
              onClick={() => { setSignupMode('email'); setPhoneOtpSent(false); setPhoneOtpCode(''); }}
              className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${signupMode === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('auth.email')}
            </button>
            <button
              type="button"
              onClick={() => { setSignupMode('phone'); setPhoneOtpSent(false); setPhoneOtpCode(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${signupMode === 'phone' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Phone className="h-3.5 w-3.5" />
              {t('auth.phoneOtp')}
            </button>
          </div>

          {signupMode === 'email' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                  <Input id="firstName" {...register('firstName')} className={errors.firstName ? 'border-destructive' : ''} />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                  <Input id="lastName" {...register('lastName')} className={errors.lastName ? 'border-destructive' : ''} />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" placeholder="email@example.com" {...register('email')} className={`lowercase ${errors.email ? 'border-destructive' : ''}`} />
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} className={errors.confirmPassword ? 'border-destructive' : ''} />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.signUp')}
              </Button>
            </form>
          ) : (
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
                      <Button variant="ghost" size="sm" onClick={handleSendPhoneOtp} disabled={isPhoneLoading}>
                        {t('auth.resendCode')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(''); }}>
                      {t('auth.useDifferentNumber')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t('auth.firstName')}</Label>
                      <Input
                        value={phoneFirstName}
                        onChange={(e) => setPhoneFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('auth.lastName')}</Label>
                      <Input
                        value={phoneLastName}
                        onChange={(e) => setPhoneLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('auth.phoneNumber')}</Label>
                    <Input
                      type="tel"
                      placeholder={t('auth.phonePlaceholder')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendPhoneOtp()}
                    />
                  </div>
                  <Button type="button" className="w-full" disabled={isPhoneLoading} onClick={handleSendPhoneOtp}>
                    {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendOtp')}
                  </Button>
                </>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('auth.hasAccount')}{' '}
            <Link to="/member/login" className="text-primary hover:underline font-medium">{t('auth.login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberSignup;
