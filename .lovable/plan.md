

# Plan: Add Stripe Connection Status to Settings

## What We're Building
A new "Integrations" tab in the Settings page showing Stripe configuration status (connected/not connected) and the webhook URL for reference.

## Steps

### 1. Add "Integrations" tab to Settings router
- Add a new tab entry in `src/pages/Settings.tsx` with path `/setting/integrations`
- Add route in `src/App.tsx` for the new settings sub-page

### 2. Create `src/pages/settings/SettingsIntegrations.tsx`
- New page component with a `SettingsLayout` sidebar containing a single "Stripe" menu item (expandable later for other integrations)
- Shows:
  - **Connection status**: Calls `supabase.functions.invoke('stripe-create-checkout', { body: { health_check: true } })` or simply checks if the `credit_card_enabled` setting is on — simpler approach: just show static config info since secrets are server-side only
  - **Webhook URL**: Display the endpoint URL as a read-only copyable field
  - **Configured events**: `checkout.session.completed`, `charge.refunded`
  - **Test mode reminder**: Note about using test card `4242 4242 4242 4242`

Since we can't verify secrets from the client side, the status will reflect whether Stripe payment is enabled in general settings (`credit_card_enabled`). The webhook URL is a known constant.

### 3. Add i18n keys
- Add `settings.tabs.integrations` and `settings.integrations.*` keys to both `en.ts` and `th.ts`

### Files Modified/Created

| File | Action |
|---|---|
| `src/pages/settings/SettingsIntegrations.tsx` | New — Stripe status card |
| `src/pages/Settings.tsx` | Add "Integrations" tab |
| `src/App.tsx` | Add route for integrations settings |
| `src/i18n/locales/en.ts` | Add i18n keys |
| `src/i18n/locales/th.ts` | Add i18n keys |

### Risk
- **Zero regression**: Additive only — new tab, new page, new i18n keys
- No existing files modified beyond adding a tab entry and a route

