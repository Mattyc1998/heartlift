# 🔧 SUPABASE SYNC FIX - Database Writes Restored

## Problem Fixed

**Issue:** Purchases were unlocking locally but NOT saving to Supabase database.

**Root Cause:** The `healing_kit_purchases` table requires an `amount` field (non-nullable), but the sync was trying to insert without it → Database rejected the write silently.

---

## Changes Made

### 1. **Added Missing Schema Fields** (`purchaseService.ts` line 514-525)

**Before (BROKEN):**
```typescript
await supabase.from('healing_kit_purchases').upsert({
  user_id: user.id,
  status: 'completed',
  purchased_at: new Date().toISOString()
  // ❌ Missing 'amount' field - database rejects this
});
```

**After (FIXED):**
```typescript
await supabase.from('healing_kit_purchases').upsert({
  user_id: user.id,
  amount: 499,  // ✅ Required field (£4.99 in pence)
  currency: 'gbp',
  status: 'completed',
  purchased_at: new Date().toISOString()
});
```

### 2. **Added Comprehensive Error Logging**

**New logs:**
- ✅ "Authenticated user: [id]" → Confirms user is logged in
- 🔄 "Updating Healing Kit in Supabase..." → Shows sync started
- ✅ "Healing Kit updated in Supabase: [data]" → Shows actual data written
- ❌ "SYNC FAILED: [error]" → Shows why it failed (if it fails)

**Alert popups:**
- "✅ HEALING KIT SYNCED TO DATABASE" → Success
- "❌ SYNC FAILED: [reason]" → Failure (you'll know immediately)

### 3. **Verified Flow Order (UNCHANGED - Immediate Unlock Still Works)**

```typescript
// 1. FIRST: Resolve promise → UI unlocks
resolver.resolve(); // ✅ Instant unlock

// 2. THEN: Finish transaction
transaction.finish();

// 3. FINALLY: Background sync (non-blocking)
this.syncToSupabase()  // ✅ Doesn't block UI
  .then(() => alert('✅ SYNCED'))
  .catch(() => alert('❌ FAILED'));
```

---

## Database Schema Reference

### `healing_kit_purchases` Table:
```sql
CREATE TABLE healing_kit_purchases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- UNIQUE constraint
  amount INTEGER NOT NULL,  -- Required! (in pence)
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'pending',  -- 'pending' | 'completed' | 'failed'
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `subscribers` Table:
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  email TEXT,
  plan_type TEXT DEFAULT 'free',  -- 'free' | 'premium'
  subscribed BOOLEAN DEFAULT false,  -- CRITICAL for AuthContext
  payment_status TEXT DEFAULT 'inactive',  -- 'active' | 'inactive' | 'expired'
  updated_at TIMESTAMPTZ
);
```

---

## Testing This Fix

### Test 1: Immediate Unlock (MUST STILL WORK)
1. Purchase Healing Kit
2. ✅ Alert: "💰 PURCHASE SUCCESS"
3. ✅ Alert: "🔓 UNLOCK HEALING KIT CALLED"
4. ✅ Alert: "✅ HEALING KIT UNLOCKED"
5. ✅ Features unlock immediately (no delay)

### Test 2: Database Sync (NOW FIXED)
**After purchase completes:**
6. ✅ Alert: "✅ HEALING KIT SYNCED TO DATABASE"
   - If you see this → Sync worked! ✅
7. ❌ Alert: "❌ SYNC FAILED: [reason]"
   - If you see this → Check the error message

### Test 3: Persistence (SHOULD NOW WORK)
1. Purchase Healing Kit
2. Wait for "✅ SYNCED TO DATABASE" alert
3. **Logout**
4. **Login again**
5. ✅ Healing Kit should still be unlocked (loaded from Supabase)

### Test 4: Check Database Directly
**Go to Supabase Dashboard:**
1. Open `healing_kit_purchases` table
2. Look for row with your `user_id`
3. Verify:
   - `user_id`: Your UUID
   - `amount`: 499
   - `status`: 'completed'
   - `purchased_at`: Recent timestamp

If you see this row → Sync is working! ✅

---

## Expected Alert Sequence

### During Purchase:
```
1. 💰 PURCHASE SUCCESS - about to unlock
2. 🔓 UNLOCK HEALING KIT CALLED
3. ✅ HEALING KIT UNLOCKED (localStorage: 'true')
4. 📊 AFTER UNLOCK (Context: ?, localStorage: 'true')
5. [Success modal appears]
```

### A few seconds later:
```
6. ✅ HEALING KIT SYNCED TO DATABASE
```

### On Healing Kit page load:
```
7. 🔍 HEALING KIT PAGE LOAD (Context: true, localStorage: 'true')
8. [Content appears]
```

---

## Debugging Failed Syncs

### If you see "❌ SYNC FAILED":

**Check the error message in the alert:**

#### Error: "No user logged in"
- **Cause:** User session expired during purchase
- **Fix:** This shouldn't happen, but try logging out and back in

#### Error: "duplicate key value violates unique constraint"
- **Cause:** Purchase already exists in database
- **Solution:** This is actually OK! It means you already purchased it
- The sync just needs to UPDATE instead of INSERT

#### Error: "permission denied for table healing_kit_purchases"
- **Cause:** RLS (Row Level Security) policy blocking the write
- **Fix:** Check Supabase policies for `healing_kit_purchases` table
- Verify INSERT policy allows `auth.uid() = user_id`

#### Error: "null value in column 'amount' violates not-null constraint"
- **Cause:** The amount field is missing (but we just fixed this!)
- **Fix:** Rebuild and deploy the latest code

### Check Purple LOG Button:
**Look for these logs:**
```
✅ [EVENT] Healing Kit promise resolved (UI can unlock now)
✅ [EVENT] Transaction finished
🔄 [EVENT] Starting background Supabase sync...
🔄 [SYNC] Starting Supabase sync...
✅ [SYNC] Authenticated user: [uuid]
🔄 [SYNC] Updating Healing Kit in Supabase...
✅ [SYNC] Healing Kit updated in Supabase: [data]
✅ [EVENT] ✓ Background sync to Supabase completed
```

If sync fails, you'll see:
```
❌ [SYNC] Failed to update healing kit in Supabase: [error]
❌ [EVENT] Background sync failed: [error]
```

---

## Common Issues and Solutions

### Issue 1: User Not Authenticated
**Symptom:** "No user logged in" error
**Check:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user); // Should show user object
```

**Solution:** Ensure user is logged in before making purchase

### Issue 2: RLS Policies Blocking Writes
**Symptom:** "permission denied" error
**Check Supabase Dashboard:**
- Go to `healing_kit_purchases` table
- Check "Policies" tab
- Verify INSERT policy exists:
```sql
CREATE POLICY "Users can insert their own purchases"
ON healing_kit_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Issue 3: Wrong Table or Column Names
**Symptom:** "relation does not exist" or "column does not exist"
**Verify in Supabase:**
- Table name: `healing_kit_purchases` (not `user_purchases` or `purchases`)
- Columns: `user_id`, `amount`, `currency`, `status`, `purchased_at`

### Issue 4: Sync Running Before User Session Initialized
**Symptom:** Intermittent "No user" errors
**Solution:** The sync runs after purchase approval, user should already be authenticated

---

## What Success Looks Like

### Immediate Unlock (Still Working):
- Purchase → Features unlock instantly ✅
- No waiting for database ✅
- No paywalls ✅

### Database Persistence (Now Fixed):
- Data saved to Supabase ✅
- Logout → Login → Still unlocked ✅
- Multi-device sync works ✅

### User Experience:
1. User purchases
2. Features unlock immediately
3. "SYNCED TO DATABASE" alert appears
4. User can logout/login and features persist

---

## Rollback Plan

If this breaks immediate unlock (which it shouldn't):

**The unlock logic is UNTOUCHED:**
```typescript
// In HealingKitPurchase.tsx (line 176)
unlockHealingKit(); // ← This still runs immediately

// In AuthContext.tsx (line 382)
setHasHealingKit(true); // ← This still runs immediately
localStorage.setItem('hasHealingKit', 'true'); // ← This still runs immediately
```

**Only the sync changed:**
- Added `amount` field to database write
- Added error logging and alerts
- Everything else is the same

---

## Next Steps

1. **Build on CodeMagic**
2. **Install on TestFlight**
3. **Purchase Healing Kit**
4. **Wait for alerts:**
   - ✅ "UNLOCKED" → Immediate unlock worked
   - ✅ "SYNCED TO DATABASE" → Persistence fixed!
5. **Test logout/login** → Should preserve purchase
6. **Check Supabase Dashboard** → Verify data is there

If you see "✅ SYNCED TO DATABASE" alert → **WE'RE DONE!** 🎉

If you see "❌ SYNC FAILED" alert → Share the error message and we'll debug further.
