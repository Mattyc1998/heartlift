# DISABLED - DO NOT USE

This Stripe-based subscription check function has been **DISABLED** because:

1. HeartLift uses Apple In-App Purchases (RevenueCat), NOT Stripe
2. This function was overwriting Apple IAP data and resetting users to "free" 
3. It caused paying customers to lose premium access

## Current Subscription System:

- **Payment Processing**: Apple In-App Purchases via RevenueCat
- **Data Storage**: Supabase `subscribers` table
- **Required Fields**: 
  - `subscribed: true`
  - `plan_type: premium`
  - `payment_status: active`

## If you need Stripe in the future:

This function would need to be rewritten to:
1. NOT overwrite existing Apple IAP purchases
2. Check for Apple IAP FIRST before checking Stripe
3. Only update if user has NO existing premium access

**DO NOT RE-ENABLE without ensuring Apple IAP protection.**
