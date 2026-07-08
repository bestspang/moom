import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, LifeBuoy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const THROTTLE_KEY = 'moom-support-last-submit';
const THROTTLE_MS = 60_000;

const CATEGORIES = [
  'complaint',
  'facility',
  'trainer',
  'class',
  'billing',
  'membership',
  'cleanliness',
  'suggestion',
  'other',
] as const;

// TH phone: allow digits, spaces, dashes, parens, leading +. Normalizes to 10-digit '0xxxxxxxxx'.
// Server re-validates; this catches obvious typos before submit.
const TH_PHONE_RE = /^[\d+\-\s()]{9,20}$/;
function normalizeTHPhone(raw: string): string | null {
  let d = raw.replace(/\D+/g, '');
  if (!d) return null;
  if (d.startsWith('66')) d = '0' + d.slice(2);
  if (d.length === 9 && !d.startsWith('0')) d = '0' + d;
  return (d.length === 9 || d.length === 10) && d.startsWith('0') ? d : null;
}

const REWARD_CATEGORIES = new Set(['suggestion', 'complaint']);

const schema = z
  .object({
    is_anonymous: z.boolean().default(false),
    name: z.string().trim().max(100).optional().or(z.literal('')),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || (TH_PHONE_RE.test(v) && normalizeTHPhone(v) !== null), {
        message: 'invalidPhoneTH',
      }),
    email: z.string().trim().max(255).email('Invalid email').optional().or(z.literal('')),
    category: z.enum(CATEGORIES, { required_error: 'Required' }),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(10).max(2000),
  });

type FormValues = z.infer<typeof schema>;

const PublicSupportPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicketNo, setSubmittedTicketNo] = useState<string | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<{ xp: number; coin: number } | null>(null);
  const [noMemberMatch, setNoMemberMatch] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_anonymous: false,
      name: '',
      phone: '',
      email: '',
      category: undefined as unknown as FormValues['category'],
      subject: '',
      message: '',
    },
  });

  const isAnon = form.watch('is_anonymous');
  const category = form.watch('category');

  const onSubmit = async (values: FormValues) => {
    const last = Number(localStorage.getItem(THROTTLE_KEY) ?? 0);
    if (Date.now() - last < THROTTLE_MS) {
      toast.error(t('support.public.throttled'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        is_anonymous: values.is_anonymous,
        name: values.is_anonymous ? null : values.name?.trim() || null,
        phone: values.phone?.trim() || null,
        email: values.email ? values.email.trim().toLowerCase() : null,
        category: values.category,
        subject: values.subject.trim(),
        message: values.message.trim(),
      };
      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: payload,
      });
      if (error) throw error;
      const envelope = data as {
        data?: {
          ticket_no: string;
          points_awarded: { xp: number; coin: number } | null;
          member_matched?: boolean;
          phone_provided?: boolean;
          reward_eligible_category?: boolean;
        };
        error?: { message: string } | null;
      };
      if (envelope?.error || !envelope?.data?.ticket_no) {
        throw new Error(envelope?.error?.message || 'submit failed');
      }
      localStorage.setItem(THROTTLE_KEY, String(Date.now()));
      setSubmittedTicketNo(envelope.data.ticket_no);
      setPointsAwarded(envelope.data.points_awarded);
      // Show "no member match" notice only when reward was actually pursuable:
      // user gave a phone AND picked a reward-eligible category, but member lookup missed.
      setNoMemberMatch(
        Boolean(
          envelope.data.phone_provided &&
            envelope.data.reward_eligible_category &&
            !envelope.data.member_matched,
        ),
      );
    } catch (err) {
      console.error('[PublicSupportPage] submit failed', err);
      toast.error(t('support.public.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicketNo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t('support.public.successTitle')}</CardTitle>
            <CardDescription>{t('support.public.successDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <div className="text-xs text-muted-foreground">
                {t('support.public.ticketNo')}
              </div>
              <div className="mt-1 font-mono text-lg font-semibold">{submittedTicketNo}</div>
            </div>
            {pointsAwarded && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  {t('support.public.pointsAwardedTitle')}
                </div>
                <div className="mt-1 text-sm text-foreground">
                  {t('support.public.pointsAwardedDesc', { xp: pointsAwarded.xp, coin: pointsAwarded.coin })}
                </div>
              </div>
            )}
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setSubmittedTicketNo(null);
                setPointsAwarded(null);
                form.reset();
              }}
            >
              {t('support.public.submitAnother')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <LifeBuoy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t('support.public.title')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('support.public.subtitle')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
            aria-label="Toggle language"
          >
            {t('support.public.langToggle')}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="anon-toggle" className="cursor-pointer">
                    {t('support.public.anonymous')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('support.public.anonymousHint')}
                  </p>
                </div>
                <Switch
                  id="anon-toggle"
                  checked={isAnon}
                  onCheckedChange={(v) => {
                    form.setValue('is_anonymous', v);
                    if (v) form.setValue('name', '');
                  }}
                />
              </div>

              {!isAnon && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('support.public.name')}</Label>
                  <Input id="name" placeholder={t('support.public.namePlaceholder')} {...form.register('name')} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t('support.public.phone')}</Label>
                  <Input id="phone" inputMode="tel" placeholder="08x-xxx-xxxx" {...form.register('phone')} />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{t('support.public.invalidPhone')}</p>
                  )}
                  <p className="text-xs text-primary/80 leading-relaxed">
                    {t('support.public.phoneRewardHint', { xp: 10, coin: 5 })}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('support.public.email')}</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{t('support.public.invalidEmail')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {t('support.public.category')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => form.setValue('category', v as FormValues['category'], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('support.public.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`support.category.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-xs text-destructive">{t('support.public.categoryRequired')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">
                  {t('support.public.subject')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  maxLength={200}
                  placeholder={t('support.public.subjectPlaceholder')}
                  {...form.register('subject')}
                />
                {form.formState.errors.subject && (
                  <p className="text-xs text-destructive">{t('support.public.subjectRequired')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">
                  {t('support.public.message')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  rows={6}
                  maxLength={2000}
                  placeholder={t('support.public.messagePlaceholder')}
                  {...form.register('message')}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {form.formState.errors.message ? (
                      <span className="text-destructive">{t('support.public.messageRequired')}</span>
                    ) : (
                      t('support.public.messageHint')
                    )}
                  </span>
                  <span>{form.watch('message')?.length ?? 0}/2000</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? t('support.public.submitting') : t('support.public.submit')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t('support.public.privacyNote')}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicSupportPage;
