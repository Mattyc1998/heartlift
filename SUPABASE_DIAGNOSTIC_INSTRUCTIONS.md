# Supabase Content Loading Diagnostic Instructions

## Changes Made
I've added comprehensive diagnostic logging to track Supabase query failures. The logs now include:

### 1. **Auth Session Verification** (App.tsx)
On app resume, the app now logs:
```
🔍 Auth Session Check: {
  hasSession: true/false,
  userId: "xxx",
  expiresAt: "timestamp",
  sessionError: "error message if any"
}
```

### 2. **Content Query Error Logging**
For each content table query, detailed errors are logged:
- **conversation_history** (ChatInterface.tsx) - AI chat messages
- **user_healing_progress** (HealingPlan.tsx) - healing plan progress
- **mood_entries** (MoodTracker.tsx) - mood tracker data

Error format:
```
❌ SUPABASE ERROR - [table_name]: {
  message: "error message",
  details: "detailed info",
  hint: "suggestion from Supabase",
  code: "error code",
  userId: "user id"
}
```

Success format:
```
✅ Loaded [content]: { count: X }
```

## Testing Instructions

### Push to GitHub and Build on CodeMagic
1. Push this code to GitHub
2. Trigger a CodeMagic build
3. Install the TestFlight build

### Test the App
1. **Launch the app** - Check the purple LOG button for initial logs
2. **Navigate to different sections:**
   - AI Coaches (chat)
   - Healing Plan
   - Mood Tracker
   - Journal
3. **Close and reopen the app 5-10 times** - Check for inconsistent loading
4. **Note which sections fail to load**

### Capture the Logs
When content fails to load, open the debug console (purple LOG button) and look for:

1. **Session Check Failures:**
   ```
   ❌ NO SESSION on app resume!
   ```
   This means auth session is lost

2. **RLS Policy Errors:**
   ```
   ❌ SUPABASE ERROR - conversation_history: {
     message: "permission denied for table conversation_history",
     code: "42501"
   }
   ```
   This means RLS policies are blocking the query

3. **Missing Data:**
   ```
   ✅ Loaded conversation history: { count: 0 }
   ```
   Data loads but is empty

## What to Report

Please share screenshots or copy-paste of the logs showing:

1. **What loads successfully?** (✅ messages)
2. **What fails?** (❌ messages with full error details)
3. **Does the session exist on app resume?** (🔍 Auth Session Check)
4. **Is the failure consistent or intermittent?**

## Next Steps Based on Logs

### If you see "NO SESSION":
→ Auth session is expiring/lost. We need to fix session persistence.

### If you see "permission denied" or RLS errors:
→ RLS policies need to be fixed in Supabase dashboard.

### If you see successful loads but empty data:
→ Data query logic needs adjustment, not an RLS issue.

### If logs don't appear at all:
→ App is crashing before logging. Need to check browser/iOS console directly.

---

**Please test and share the logs so we can identify the exact root cause.**
