# CodeMagic Environment Variables - REQUIRED

## Go to: CodeMagic → HeartLift → Settings → Environment Variables → `production` group

Add these 4 variables:

### 1. Backend URL
```
Name: REACT_APP_BACKEND_URL
Value: https://heartlift-launch.emergent.host
Secret: NO
Group: production
```

### 2. Supabase URL
```
Name: VITE_SUPABASE_URL
Value: https://hmmimemzznsyilxqakty.supabase.co
Secret: NO
Group: production
```

### 3. Supabase Publishable Key
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU2MjgsImV4cCI6MjA2ODA5MTYyOH0.MrfJUkMzIPk12SFGuxWEtdLCVHq55ZWJLqDwOCIA2ZM
Secret: NO
Group: production
```

### 4. RevenueCat API Key
```
Name: VITE_REVENUECAT_API_KEY
Value: appl_sibzKJJEoGylRMhTqXeehSmVWoZ
Secret: NO
Group: production
```

---

## Verification Steps:

1. In CodeMagic, go to HeartLift app → Settings → Environment Variables
2. You should see a group called "production" with 4 variables
3. Verify each name matches EXACTLY (case-sensitive!)
4. Verify codemagic.yaml has `groups: - production` under environment section

---

## Common Mistakes:

❌ `REACT_BACKEND_URL` (missing APP)
❌ `VITE_REVENUE_CAT_API_KEY` (underscore instead of camelCase)
❌ Wrong group name (must be "production")
❌ Ticking "Secret" checkbox (don't!)

✅ All variable names must match EXACTLY as shown above
