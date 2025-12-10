# Debug Console Visual Guide

## What You'll See

### 1. **Purple LOG Button** (Bottom Right Corner)
When you open the app, you'll see a purple circular button in the bottom-right corner that says "LOG"

### 2. **When You Tap LOG**
A full-screen black debug console will appear with:
- **Header**: "Debug Console" with Copy, Clear, Close buttons
- **Log area**: Scrollable list of all console messages
- **Footer**: Stats showing total logs, errors, and warnings

## Color-Coded Messages

- **Green** `[LOG]` = Normal information ✅
- **Yellow** `[WARN]` = Warnings ⚠️  
- **Red** `[ERROR]` = Errors ❌

## What to Look For

### ✅ **Success Messages** (Green)
```
✅ Loaded conversation history: { count: 5 }
✅ Loaded user progress: { currentDay: 3, completedDays: 2 }
✅ Loaded mood history: { count: 10 }
```
This means data loaded successfully.

### ❌ **Error Messages** (Red)
```
❌ SUPABASE ERROR - conversation_history: {
  message: "permission denied for table conversation_history",
  details: null,
  hint: null,
  code: "42501",
  userId: "fe868152..."
}
```
This shows **exactly** what went wrong with Supabase queries.

### 🔍 **Session Check**
```
🔍 Auth Session Check: {
  hasSession: true,
  userId: "fe868152-2eb9-4cda-a2d7-5e0d803e17bf",
  expiresAt: "2024-12-11T18:43:52+00:00"
}
```
or
```
❌ NO SESSION on app resume!
```
This tells you if the auth session is present or lost.

## How to Use It

### During Testing:
1. **Open the app** - The purple LOG button appears in bottom-right
2. **Navigate around** - Chat, Healing Plan, Mood Tracker
3. **When content fails to load** - Tap the purple LOG button
4. **Look for RED error messages** - These show what failed
5. **Tap COPY** - Copies all logs to clipboard
6. **Share the logs** - Paste into chat or take screenshots

### Buttons in Console:
- **Copy**: Copies all logs to clipboard
- **Clear**: Erases current logs (starts fresh)
- **Close**: Closes the console (LOG button still visible)

## Example Scenario

**Problem**: Mood Tracker won't load

**What to do:**
1. Open Mood Tracker (see blank/loading state)
2. Tap purple LOG button
3. Look for logs mentioning "mood_entries"
4. You might see:
   ```
   ❌ SUPABASE ERROR - mood_entries: {
     message: "permission denied",
     code: "42501"
   }
   ```
5. Tap COPY and share the logs

This tells me **exactly** what's wrong (RLS policy blocking access).

---

**The debug console captures EVERYTHING that happens in the app, so we can see exactly where and why things fail!**
