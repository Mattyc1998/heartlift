# IAP Purchase Detection Fix

## The Problem (Identified from Logs)

Apple was returning the **wrong product ID** in purchase transactions:

```javascript
Transaction products: [{ id: "com.mattyc.heartlift" }]  // ❌ App bundle ID
```

Instead of the correct product IDs:
```javascript
{ id: "com.mattyc.heartlift.premium.monthly" }  // ✅ Premium subscription
{ id: "com.mattyc.heartlift.healingkit" }       // ✅ Healing Kit
```

### Why This Happens
When iOS restores purchases or uses application receipts (transaction type `"appstore.application"`), it sometimes returns the app's bundle ID instead of individual product IDs. This is a known behavior with `cordova-plugin-purchase` v13.

### The Impact
The code was checking `transaction.products` array for product IDs, couldn't find matches, so it concluded:
```javascript
isPremium: false
isHealingKit: false
// ⚠️ No products matched for sync
```

Even though the user HAD purchased them!

## The Fix

Changed the `.approved()` handler to **ignore** `transaction.products` and instead check product ownership **directly from the store**:

### Before (Broken):
```javascript
// ❌ Relied on transaction.products array (had wrong IDs)
const products = transaction.products || [];
for (const product of products) {
  if (product.id === PRODUCT_IDS.PREMIUM_MONTHLY) {
    isPremium = true;
  }
}
```

### After (Fixed):
```javascript
// ✅ Check product.owned directly from store
const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);

const isPremium = premiumProduct && premiumProduct.owned ? true : false;
const isHealingKit = healingKitProduct && healingKitProduct.owned ? true : false;
```

## What Will Happen Now

When you test the new build:

1. **On app launch**, the logs will show:
   ```
   ✅ [EVENT] Premium product owned: true {...}
   ✅ [EVENT] Healing Kit product owned: true {...}
   ✅ [EVENT] Final detection: { isPremium: true, isHealingKit: true }
   ```

2. **Features will unlock immediately** via localStorage

3. **Background Supabase sync will run** to persist the status

## Testing Instructions

1. Push to GitHub
2. Build on CodeMagic
3. Install on TestFlight
4. Open the app
5. Check the purple LOG button - you should now see:
   - `✅ Premium product owned: true`
   - `✅ Healing Kit product owned: true`
   - Content should load reliably

## Why This Fix Works

The `product.owned` property is set by the cordova-plugin-purchase library based on the **actual receipt validation**, not the transaction's product array. It's more reliable because it:
- Checks the validated receipt from Apple
- Works regardless of transaction type (purchase, restore, application receipt)
- Is updated in real-time by the StoreKit framework

This is the **correct** way to check ownership in cordova-plugin-purchase v13.
