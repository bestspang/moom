import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings, getSettingValue } from '@/hooks/useSettings';
import { Copy, CheckCircle2, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'qedxqilmnkbjncpnopty'}.supabase.co/functions/v1/stripe-webhook`;

const CONFIGURED_EVENTS = [
  'checkout.session.completed',
  'charge.refunded',
];

const SettingsIntegrations = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('stripe');
  const { data: generalSettings, isLoading } = useSettings('general');

  const isCreditCardEnabled = getSettingValue<boolean>(generalSettings, 'credit_card_enabled', false);

  const sidebarItems = [
    { id: 'stripe', label: 'Stripe' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied') || 'Copied!');
  };

  return (
    <SettingsLayout
      items={sidebarItems}
      activeId={activeSection}
      onSelect={setActiveSection}
      withCard={false}
    >
      {activeSection === 'stripe' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t('settings.integrations.stripeTitle')}</CardTitle>
                    <CardDescription>{t('settings.integrations.stripeDescription')}</CardDescription>
                  </div>
                </div>
                <Badge variant={isCreditCardEnabled ? 'default' : 'secondary'} className="gap-1.5">
                  {isCreditCardEnabled ? (
                    <><CheckCircle2 className="h-3 w-3" /> {t('settings.integrations.enabled')}</>
                  ) : (
                    <><AlertCircle className="h-3 w-3" /> {t('settings.integrations.disabled')}</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCreditCardEnabled && (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {t('settings.integrations.enableHint')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Webhook URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('settings.integrations.webhookUrl')}</CardTitle>
              <CardDescription>{t('settings.integrations.webhookDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={WEBHOOK_URL}
                  className="font-mono text-xs bg-muted"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(WEBHOOK_URL)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('settings.integrations.configuredEvents')}</p>
                <div className="flex flex-wrap gap-2">
                  {CONFIGURED_EVENTS.map((event) => (
                    <Badge key={event} variant="outline" className="font-mono text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Mode Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('settings.integrations.testMode')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
                <p className="text-muted-foreground">{t('settings.integrations.testModeDescription')}</p>
                <div className="flex items-center gap-2">
                  <code className="bg-background px-2 py-1 rounded text-xs font-mono border">4242 4242 4242 4242</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard('4242424242424242')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <a
                  href="https://docs.stripe.com/testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1"
                >
                  Stripe Testing Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </SettingsLayout>
  );
};

export default SettingsIntegrations;
