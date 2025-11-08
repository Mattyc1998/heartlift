# HeartLift Usage Monitoring Guide

## Overview
A simple tracking system has been added to monitor coach chat usage and help you understand user patterns.

## What's Being Tracked

Every coach chat interaction logs:
- **Timestamp**: When the message was sent
- **Coach ID**: Which coach was used
- **User ID**: Anonymous tracking (no personal data)
- **Success/Failure**: Whether the AI responded successfully
- **Message lengths**: For analyzing conversation depth

## How to View Stats

### Access the Stats Endpoint

**URL:** `https://heartlift-launch.emergent.host/api/admin/usage-stats`

**Optional Parameters:**
- `?days=7` - View stats for last 7 days (default)
- `?days=30` - View stats for last 30 days
- `?days=1` - View today's stats only

### What You'll See

```json
{
  "period_days": 7,
  "total_messages": 1250,
  "successful_messages": 1230,
  "failed_messages": 20,
  "success_rate": 98.4,
  "average_per_day": 178.6,
  "daily_breakdown": [
    {"_id": "2025-11-08", "count": 180},
    {"_id": "2025-11-09", "count": 165},
    ...
  ],
  "peak_hours": [
    {"_id": 9, "count": 85},   // 9 AM
    {"_id": 20, "count": 120}, // 8 PM - Peak!
    ...
  ],
  "popular_coaches": [
    {"_id": "phoenix", "count": 450},
    {"_id": "luna", "count": 380},
    ...
  ]
}
```

## Key Metrics to Monitor

### 1. Total Messages Per Day
- **Normal**: 10-100 messages/day during launch
- **Growing**: 100-500 messages/day
- **Popular**: 500-2,000 messages/day
- **Viral**: 2,000+ messages/day

**Action**: If approaching 2,000+/day, check Emergent LLM key balance and consider enabling auto-top up.

### 2. Success Rate
- **Healthy**: 95-100%
- **Warning**: 90-95% (some API issues)
- **Critical**: <90% (investigate errors)

**Action**: If below 95%, check error logs for API key issues or rate limiting.

### 3. Peak Hours
- Helps you understand when users are most active
- Plan maintenance during low-traffic hours
- Expect higher load during evenings (8-10 PM typically peak)

### 4. Popular Coaches
- See which coaches users prefer
- Consider featuring popular coaches
- Identify if any coach has low usage (maybe needs personality adjustment)

## Viewing Stats in Browser

**Method 1: Direct URL**
```
https://heartlift-launch.emergent.host/api/admin/usage-stats?days=7
```

**Method 2: Using curl**
```bash
curl "https://heartlift-launch.emergent.host/api/admin/usage-stats?days=30"
```

**Method 3: Browser + JSON Formatter**
Install a JSON formatter extension for Chrome/Firefox, then visit the URL.

## When to Check Stats

**Daily (First Week):**
- Monitor for any spikes or issues
- Check success rate stays high

**Weekly (Ongoing):**
- Review growth trends
- Check for any unusual patterns

**After Updates:**
- Verify no drop in success rate
- Check for any new error patterns

## Warning Signs

🚨 **Check immediately if you see:**
- Success rate drops below 90%
- Sudden spike in failed messages
- Total messages drop to zero (service might be down)
- Messages suddenly spike 10x (possible bot/spam)

## Data Storage

- Stored in MongoDB `usage_tracking` collection
- Minimal data (no message content stored)
- Automatic cleanup after 30 days (to save space)

## Security Note

⚠️ **Important:** This endpoint has no authentication! 

**For production, you should:**
1. Add API key authentication to this endpoint
2. Or restrict access to admin users only
3. Or keep the URL private (security through obscurity - not ideal but works for MVP)

## Example Use Cases

**Scenario 1: "Is my app working?"**
Check success_rate - should be >95%

**Scenario 2: "Am I getting users?"**
Check average_per_day - watch it grow!

**Scenario 3: "When should I do maintenance?"**
Check peak_hours - avoid your busiest times

**Scenario 4: "Which coach should I feature?"**
Check popular_coaches - promote the favorites

## Future Enhancements

If you want more detailed tracking later, you could add:
- User retention metrics
- Average conversation length
- Premium vs Free user breakdown
- Geographic distribution (by timezone)
- Response time tracking

But for now, this covers the essentials for monitoring growth and stability!
