# HeartLift - Final Fix Checklist

## Critical Issues Found:

1. ❌ **Coach messages not working** - iOS app not connecting to backend
2. ❌ **Purchases don't work** - RevenueCat not properly initialized  
3. ❌ **Daily reflection error** - Pattern mismatch on response
4. ❌ **Premium page screenshot** - UI layout issue
5. ❌ **Boxes too big** - Design/padding issues

---

## Root Cause:

**The iOS app (Build #13) doesn't have the correct backend URL configured!**

The CodeMagic build needs to create a `.env` file during build, but it's not happening correctly.

---

## Fixes Required:

### 1. Fix codemagic.yaml Script

The `.env` creation script needs to be BEFORE the iOS sync, not before web build.

### 2. Add All Environment Variables to CodeMagic

Currently missing or incorrect:
- REACT_APP_BACKEND_URL
- VITE_SUPABASE_URL  
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_REVENUECAT_API_KEY

### 3. Fix UI Issues

- Premium page layout
- Box sizing across app
- Safe area padding

---

## Action Plan:

1. Fix codemagic.yaml to create .env at correct step
2. Verify ALL environment variables in CodeMagic
3. Fix UI layout issues in components
4. Push to GitHub
5. Build #14 in CodeMagic
6. Test on TestFlight

---

## Expected Results After Fixes:

✅ Coach messages send successfully
✅ Purchases work via RevenueCat
✅ Daily reflections load without errors
✅ Premium page displays correctly
✅ UI boxes properly sized

