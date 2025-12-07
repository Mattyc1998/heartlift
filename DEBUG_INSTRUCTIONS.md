# 🔍 Debug Instructions for IAP Feature Unlock Issue

## What Was Added

I've added comprehensive alert-based debugging to track exactly what happens when you purchase the Healing Kit or Premium subscription. This will help us identify where the state is failing to propagate.

### Debug Features Added:

1. **Purple LOG Button (Bottom Right)** 
   - Tap this to see all console logs on-screen
   - Available throughout the entire app

2. **Alert Popups at Critical Points**
   - These will appear automatically during the purchase flow
   - They show the exact state values at each step

## Testing Instructions

### Step 1: Build on CodeMagic
1. Push this code to GitHub
2. Trigger a build on CodeMagic
3. Wait for TestFlight upload

### Step 2: Install and Test Purchase
1. Install the new build from TestFlight
2. Log in to your test account
3. Navigate to Healing Kit Purchase page
4. Initiate a purchase

### Step 3: Document Alert Sequence
**YOU WILL SEE THESE ALERTS IN THIS ORDER:**

1. **"💰 PURCHASE SUCCESS - about to unlock"**
   - This appears when the purchase completes successfully
   - ✅ Take a screenshot

2. **"🔓 UNLOCK HEALING KIT CALLED"**
   - This appears when the unlock function starts
   - ✅ Take a screenshot

3. **"✅ HEALING KIT UNLOCKED"**
   - Shows state values: `hasHealingKit` from context and localStorage
   - ✅ Take a screenshot and **WRITE DOWN THE VALUES**

4. **"📊 AFTER UNLOCK"**
   - Shows state values immediately after unlock
   - ✅ Take a screenshot and **WRITE DOWN THE VALUES**

5. **Success Modal Appears**
   - The green success modal should show
   - Click "Start Healing Journey" to navigate to the Healing Kit page

6. **"🔍 HEALING KIT PAGE LOAD"**
   - This appears when the Healing Kit page loads
   - Shows what state the page actually reads
   - ✅ Take a screenshot and **WRITE DOWN THE VALUES**
   - **THIS IS THE CRITICAL ONE** - it will show if the state was preserved

### Step 4: Share Results
Please provide:
1. **Screenshots of ALL alerts** (in order)
2. **The values shown** in each alert (especially the localStorage and context values)
3. **What happened** - Did the Healing Kit page show the content or the paywall?

## What to Look For

### ✅ Expected Flow (if working):
- Alert #3 shows: `hasHealingKit: true`, `localStorage: "true"`
- Alert #4 shows: `hasHealingKit: true`, `localStorage: "true"`
- Alert #6 shows: `hasHealingKit: true`, `localStorage: "true"`
- **Result**: Healing Kit page shows CONTENT (not paywall)

### ❌ Current Bug Symptoms:
- Alert #3 and #4 might show `hasHealingKit: false` (because React state updates asynchronously)
- Alert #6 shows: `hasHealingKit: false` or localStorage is missing
- **Result**: Healing Kit page shows PAYWALL (even though purchase completed)

## Additional Debugging

If you want more detailed logs:
1. **Tap the purple LOG button** (bottom right) at any time
2. This shows ALL console logs with timestamps
3. You can tap "Copy" to copy all logs to clipboard
4. Share the logs with me

## What This Will Tell Us

The alert sequence will reveal:
1. ✅ Is the unlock function actually being called?
2. ✅ Is localStorage being updated correctly?
3. ✅ Is React state being set?
4. ❌ Is the state being lost during navigation?
5. ❌ Is something clearing the state after unlock?
6. ❌ Is the Healing Kit page reading stale state?

Once I see the alert sequence, I'll know EXACTLY where the problem is and can fix it.

---

## Quick Reference: Build Commands

```bash
cd /app/frontend
yarn build
npx cap sync ios
```

Then push to GitHub and build on CodeMagic.
