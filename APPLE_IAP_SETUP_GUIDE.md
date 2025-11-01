# Apple In-App Purchases Implementation Guide

## ✅ What's Been Implemented

### Frontend (React/Capacitor)
- ✅ Installed `@revenuecat/purchases-capacitor` plugin
- ✅ Created `purchaseService.ts` - handles all IAP operations
- ✅ Created `usePurchases.tsx` hook - React hook for easy component integration
- ✅ Created `SubscriptionPage.tsx` - beautiful pricing/subscription UI

### Backend (FastAPI/MongoDB)
- ✅ Added `/api/subscriptions/sync` endpoint - syncs subscription status
- ✅ Added `/api/subscriptions/status/{user_id}` endpoint - checks subscription
- ✅ MongoDB collection `subscriptions` for storing user subscription data

### Product IDs (Match these in App Store Connect)
- **Premium Monthly**: `com.mattyc.heartlift.premium.monthly` (£11.99/month)
- **Healing Kit**: `com.mattyc.heartlift.healingkit` (£4.99 one-time)

---

## 🚀 Step-by-Step Setup Instructions

### STEP 1: Create RevenueCat Account (FREE)

RevenueCat makes IAP 10x easier. It handles receipt validation, subscription management, webhooks, and analytics.

1. **Sign up**: Go to https://www.revenuecat.com/
2. **Create Project**: Click "Create new project" → Name: "HeartLift"
3. **Add iOS App**:
   - Click "Add App" → Select "iOS"
   - Bundle ID: `com.mattyc.heartlift`
   - App Name: HeartLift
4. **Get API Keys**:
   - Go to Project Settings → API Keys
   - Copy your **iOS API Key** (starts with `appl_`)
   - Save this - you'll need it next!

---

### STEP 2: Update Frontend with RevenueCat API Key

1. **Open**: `/app/frontend/src/services/purchaseService.ts`
2. **Find line 30**: `const REVENUECAT_API_KEY = 'appl_YOUR_KEY_HERE';`
3. **Replace** `appl_YOUR_KEY_HERE` with your actual RevenueCat iOS API key
4. **OR** (Better): Add to `.env` file:
   ```
   VITE_REVENUECAT_API_KEY=appl_your_actual_key_here
   ```
   Then update line 30 to:
   ```typescript
   const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;
   ```

---

### STEP 3: Create Products in App Store Connect

Once Apple approves your developer account:

#### Create Premium Subscription:
1. **App Store Connect** → Your App → **In-App Purchases**
2. Click **"+"** → **Auto-Renewable Subscription**
3. Fill in:
   - **Reference Name**: `HeartLift Premium Monthly`
   - **Product ID**: `com.mattyc.heartlift.premium.monthly` ⚠️ EXACT MATCH
   - **Subscription Group**: Create new → `HeartLift Premium`
   - **Duration**: 1 Month
   - **Price**: £11.99
4. **Localization** (English UK):
   - Display Name: `Premium`
   - Description: `Unlimited support for your relationship growth. Unlimited AI coach conversations, regenerate responses, guided programs, personalized insights, and priority support.`
5. **Save** and **Submit for Review**

#### Create Healing Kit Purchase:
1. Click **"+"** → **Non-Consumable**
2. Fill in:
   - **Reference Name**: `Healing Kit`
   - **Product ID**: `com.mattyc.heartlift.healingkit` ⚠️ EXACT MATCH
   - **Price**: £4.99
3. **Localization** (English UK):
   - Display Name: `Healing Kit`
   - Description: `Complete break-up recovery package. Includes 30-day healing plan, daily affirmations, visualization practices, no-contact tracker, journal prompts, and priority support.`
4. **Save** and **Submit for Review**

---

### STEP 4: Link RevenueCat to App Store Connect

1. **RevenueCat Dashboard** → Your iOS App
2. **Service Credentials** → **App Store Connect**
3. **Add App Store Connect API Key**:
   - Go to App Store Connect → Users and Access → Keys (Integrations tab)
   - Create new key with "App Manager" access
   - Download the `.p8` file
   - Upload to RevenueCat with Issuer ID and Key ID
4. **Create Entitlements**:
   - RevenueCat → Entitlements → **Create Entitlement**
   - Name: `premium` (lowercase, exact)
   - This unlocks premium features
5. **Add Products**:
   - RevenueCat → Products → **Add Products**
   - Add `com.mattyc.heartlift.premium.monthly`
   - Add `com.mattyc.heartlift.healingkit`
6. **Create Offering**:
   - RevenueCat → Offerings → **Create Offering**
   - Identifier: `default`
   - Add both products as packages

---

### STEP 5: Update Your App to Use Subscriptions

#### Option A: Add to existing App (Recommended)
Add a route to your App.tsx or navigation:

```typescript
import { SubscriptionPage } from '@/pages/SubscriptionPage';

// In your routes/navigation:
<Route path="/subscription" element={<SubscriptionPage />} />
```

#### Option B: Connect to "Go Premium" buttons
Update your existing components to use the `usePurchases` hook:

```typescript
import { usePurchases } from '@/hooks/usePurchases';

function YourComponent() {
  const { isPremium, purchasePremium, purchasing } = usePurchases();

  return (
    <button onClick={purchasePremium} disabled={isPremium || purchasing}>
      {isPremium ? 'Premium Active' : 'Go Premium'}
    </button>
  );
}
```

---

### STEP 6: Update Message Limit Logic

Update your chat interface to check premium status:

```typescript
import { usePurchases } from '@/hooks/usePurchases';

function ChatInterface() {
  const { isPremium } = usePurchases();
  
  // Only check usage limit if NOT premium
  if (!isPremium) {
    // Existing usage tracking code
  } else {
    // Skip limit checking for premium users
  }
}
```

---

### STEP 7: Test with Sandbox Accounts

1. **Create Sandbox Tester**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Create test account (use different email than your real Apple ID)
2. **Test on Physical Device**:
   - Build and install app on iPhone
   - Sign OUT of App Store on device
   - Open your app and try purchasing
   - Sign in with sandbox tester when prompted
   - Purchase should complete (no real charge)
3. **Verify**:
   - Check RevenueCat dashboard for test transaction
   - Check your backend MongoDB `subscriptions` collection
   - Verify premium features unlock in app

---

### STEP 8: Build and Submit

1. **Sync Capacitor**:
   ```bash
   cd /app/frontend
   yarn build:ios
   ```

2. **Open Xcode**:
   ```bash
   yarn cap:open:ios
   ```

3. **In Xcode**:
   - Select your Development Team
   - Archive the app
   - Upload to App Store Connect

4. **Submit for Review** (see main checklist)

---

## 🔍 Testing Checklist

Before submitting to Apple:

- [ ] Premium subscription purchase works in sandbox
- [ ] Healing Kit purchase works in sandbox
- [ ] Restore Purchases works
- [ ] Premium users have unlimited messages
- [ ] Free users hit 10 message limit
- [ ] Subscription status persists after app restart
- [ ] Backend MongoDB has subscription records
- [ ] RevenueCat dashboard shows test transactions

---

## 🐛 Common Issues & Solutions

### Issue: "Product not found"
**Solution**: Make sure products are approved in App Store Connect and added to RevenueCat offering

### Issue: "Invalid API Key"
**Solution**: Double-check RevenueCat API key is correct and matches iOS (starts with `appl_`)

### Issue: "Purchase fails silently"
**Solution**: Check device logs in Xcode → Window → Devices and Simulators → View Device Logs

### Issue: "Subscription doesn't sync"
**Solution**: Check backend logs, ensure MongoDB is running, verify backend endpoint is accessible

---

## 📚 Additional Resources

- **RevenueCat Docs**: https://www.revenuecat.com/docs
- **Apple IAP Guidelines**: https://developer.apple.com/in-app-purchase/
- **Capacitor Docs**: https://capacitorjs.com/

---

## 🎯 Next Steps After Setup

1. Monitor RevenueCat dashboard for real purchases
2. Set up webhooks (optional) for real-time subscription updates
3. Add analytics to track conversion rates
4. A/B test pricing (can be done through RevenueCat)
5. Consider adding annual subscription (£99-119/year = better value)

---

## ⚠️ Important Notes

1. **App Store Review**: Apple reviews IAP products separately. Submit them ASAP.
2. **Subscription Management**: Users manage subscriptions through iPhone Settings → Apple ID → Subscriptions
3. **Refunds**: Handled by Apple, not you. RevenueCat will be notified automatically.
4. **Commission**: Apple takes 15-30% of subscription revenue (15% after year 1)
5. **Testing**: ALWAYS test in sandbox before going live

---

## 🚀 You're Ready!

Once you complete these steps:
- Premium subscriptions will work automatically
- Healing Kit purchases will unlock content
- RevenueCat handles all the complex receipt validation
- Your backend tracks subscription status
- Users can manage subscriptions through iOS Settings

**Need help?** Check RevenueCat support (excellent) or Apple Developer Forums.
