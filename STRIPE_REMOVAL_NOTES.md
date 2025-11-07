# Stripe Function Removal - Critical Fix

## Date: November 7, 2025

## Issue:
The Stripe `check-subscription` Edge Function was overwriting Apple In-App Purchase (IAP) data in the `subscribers` table, causing paying customers to lose premium access.

## What Happened:
1. Users purchased premium via Apple IAP (RevenueCat)
2. Purchase data was stored in Supabase: `plan_type: 'premium'`, `status: 'active'`
3. Stripe check-subscription function ran (looking for Stripe subscriptions)
4. Found no Stripe subscription for the user
5. **OVERWROTE the database** with: `subscribed: false`, `plan_type: 'free'`, `payment_status: 'inactive'`
6. User lost premium access despite paying!

## Solution Applied:

### 1. Disabled Stripe Function
- Renamed `/app/frontend/supabase/functions/check-subscription` to `check-subscription.DISABLED`
- Added README explaining why it's disabled
- Function can no longer run or interfere with Apple IAP data

### 2. Fixed AuthContext.tsx
- Removed call to `check-subscription` Edge Function
- Now reads directly from `subscribers` table
- Checks for: `subscribed: true` OR (`plan_type: 'premium'` AND `payment_status: 'active'`)
- No longer depends on external Stripe functions

### 3. Fixed purchaseService.ts
- Apple IAP purchases now set `subscribed: true` (critical field)
- Fixed healing kit to use correct table: `healing_kit_purchases` with `status: 'completed'`
- Added `onConflict` handling to prevent data overwrites

### 4. Updated Backend .env
- Corrected Supabase service role key for proper database access

## Current Payment System:
- **iOS App**: Apple In-App Purchases via RevenueCat
- **Web App**: Stripe (via PricingSection.tsx - not affected by this fix)
- **Data Storage**: Supabase `subscribers` and `healing_kit_purchases` tables

## Database Schema (subscribers table):
```
- subscribed: boolean (MUST be true for premium)
- plan_type: 'free' | 'premium'
- payment_status: 'active' | 'inactive'
- stripe_customer_id: (for web Stripe purchases only)
```

## Prevention:
The disabled Stripe function cannot run. If re-enabled in the future, it MUST:
1. Check for existing Apple IAP purchases FIRST
2. NOT overwrite if Apple IAP is active
3. Only update for users with NO existing premium access

## Files Changed:
- `/app/frontend/src/contexts/AuthContext.tsx`
- `/app/frontend/src/services/purchaseService.ts`
- `/app/backend/.env` (service role key)
- `/app/frontend/supabase/functions/check-subscription` (disabled)

## Next Steps:
1. Push all changes to GitHub
2. Trigger new CodeMagic build
3. Test premium access persists after app restart
4. Submit to App Store with fixed build
