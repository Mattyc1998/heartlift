# HeartLift iOS App - Submission Ready Checklist

**Last Updated:** 29/10/2025

## ✅ COMPLETED & READY

### 1. App Configuration
- **Bundle ID:** `com.mattyc.heartlift`
- **App Name:** HeartLift
- **Display Name:** HeartLift
- **Version:** 1.0
- **Build:** Will auto-increment on each build

### 2. App Icons
✅ **ALL iOS app icons generated** using HeartLift brand colors
- Primary Color: Rose/Pink (RGB: 235, 101, 132)
- White heart symbol on brand background
- All 16 required sizes created:
  - 1024x1024 (App Store)
  - All iPhone sizes (20pt - 60pt, @1x, @2x, @3x)
  - All iPad sizes (76pt, 83.5pt)
- Location: `/app/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 3. Build System
✅ **CodeMagic CI/CD configured**
- File: `/app/codemagic.yaml`
- Xcode 15.2
- Node 20.11.0
- Workspace: App.xcworkspace
- Scheme: App
- Automated build & IPA generation

### 4. App Info
✅ **Info.plist configured**
- Display name: HeartLift
- Supported orientations: Portrait, Landscape
- iPad support: Yes
- Capabilities: Basic (no special permissions needed yet)

### 5. Web Application
✅ **Production frontend ready**
- React + Vite build system
- All features functional
- Capacitor integrated

---

## 📋 WHAT YOU NEED TO PROVIDE

### Apple Developer Account Information

Once your Apple Developer account is approved, you'll need:

1. **Apple ID** 
   - The email associated with your Apple Developer account
   
2. **Team ID**
   - Found in: Apple Developer Portal → Membership
   - Format: 10-character alphanumeric (e.g., ABC123XYZ9)

3. **App Store Connect API Key** (for CodeMagic)
   - In App Store Connect → Users and Access → Keys
   - Create key with "App Manager" role
   - Download the `.p8` file (SAVE THIS - can only download once!)
   - Note the Key ID and Issuer ID

### CodeMagic Configuration Update

Update `/app/codemagic.yaml` with:
```yaml
APP_STORE_APPLE_ID: your-apple-id@example.com  # Line 15
```

And configure CodeMagic with:
- App Store Connect API credentials
- Signing certificates (auto-managed or manual)

---

## 🎨 APP STORE ASSETS NEEDED

### Required Screenshots
You'll need screenshots for:

**iPhone 6.7" Display** (iPhone 14 Pro Max, 15 Pro Max) - REQUIRED
- Size: 1290 x 2796 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots

**iPhone 6.5" Display** (iPhone 11 Pro Max, XS Max) - REQUIRED  
- Size: 1242 x 2688 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots

**Recommended Screenshots to Show:**
1. Chat with AI coaches screen
2. Daily quiz interface
3. Personalized insights report
4. Daily reflections view
5. Coach selection screen

### App Store Text Content

**App Title:** HeartLift (already set)

**Subtitle:** (30 chars max)
Suggestion: "AI Relationship Wellness Coach"

**Description:** (4000 chars max)
```
HeartLift is your personal AI-powered relationship wellness companion, 
designed to help you build healthier, more fulfilling connections.

KEY FEATURES:

🤖 4 UNIQUE AI COACHES
Choose from distinct coaching personalities to match your needs:
- Dr. Sage: Evidence-based relationship guidance
- Luna Love: Confident dating and attraction advice
- Phoenix Fire: Bold, transformative tough-love mentorship
- River Calm: Mindful, grounding emotional support

❤️ DAILY ATTACHMENT STYLE QUIZZES
- AI-generated questions that change every day
- Track your attachment patterns over time
- Get personalized insights based on your responses

📊 PERSONALIZED INSIGHTS REPORTS
- Analyze your emotional patterns
- Track healing progress
- Receive tailored recommendations
- Access your complete report history

📝 DAILY REFLECTIONS
- Record what you're working on
- Coaches remember and reference your goals
- Build a journal of your growth journey

💬 INTELLIGENT CONVERSATIONS
- Context-aware AI that remembers your conversations
- Natural, empathetic responses
- Personalized based on your reflections

🔒 YOUR PRIVACY MATTERS
- All data encrypted
- Never shared with third parties
- You control your information

FREE FEATURES:
- 10 daily messages with AI coaches
- Daily attachment quizzes
- Reflection tracking
- Basic insights

PREMIUM FEATURES:
- Unlimited messaging
- Advanced insights and analytics
- Priority support
- Early access to new features

IMPORTANT: HeartLift provides wellness coaching, not therapy. 
For mental health crises, please contact professional services.

Start your journey to healthier relationships today with HeartLift!
```

**Keywords:** (100 chars max, comma-separated)
```
relationship,dating,attachment,wellness,ai coach,therapy,mental health,self improvement
```

**Promotional Text:** (170 chars - can be updated without review)
```
Transform your relationships with AI-powered coaching. 
4 unique coaches, daily quizzes, and personalized insights. 
Start your wellness journey today!
```

**Support URL:**
- Current: Need to provide a support website or email
- Suggestion: Create simple support page or use: support@heartlift.app

**Marketing URL:** (optional)
- Suggestion: https://heartlift.app (if you have a website)

**Privacy Policy URL:**
- Already available in app
- Will need public URL: `https://your-domain.com/privacy`

### App Information

**Primary Category:** Lifestyle OR Health & Fitness
**Secondary Category:** (optional) Health & Fitness OR Lifestyle

**Age Rating:**
- Recommended: **13+** 
- Content: General relationship wellness, friendships, family dynamics, emotional intelligence
- Quiz content: Age-appropriate questions about relationships, friendships, and life situations (no sexual or adult-only content)

**Copyright:** 
```
© 2025 HeartLift
```

### Optional but Recommended

**App Preview Video** (15-30 seconds)
- Shows key features
- Auto-plays in App Store
- Format: .mov, .m4v, or .mp4

---

## 🚀 BUILD & SUBMISSION PROCESS

### Once Developer Account Ready:

1. **Update CodeMagic Configuration**
   ```bash
   # Update /app/codemagic.yaml line 15:
   APP_STORE_APPLE_ID: your-apple-id@example.com
   ```

2. **Configure CodeMagic**
   - Add App Store Connect API credentials
   - Set up automatic signing (recommended)

3. **Trigger Build**
   - Push code or manually trigger in CodeMagic
   - Build time: ~20-30 minutes
   - Output: `.ipa` file

4. **Create App in App Store Connect**
   - Log into App Store Connect
   - Create new app with Bundle ID: `com.mattyc.heartlift`
   - Upload screenshots and metadata
   - Add description, keywords, etc.

5. **Upload IPA**
   - CodeMagic can auto-upload to TestFlight
   - Or manually upload via Transporter app
   - Or use Xcode Organizer

6. **Submit for Review**
   - Complete all App Store fields
   - Add test account (if needed)
   - Submit for App Store review
   - Review typically takes 24-48 hours

---

## ⚠️ CRITICAL REMINDERS

### Privacy & Compliance
✅ Privacy Policy updated and accurate
✅ Terms of Service updated
✅ Crisis support disclaimers in place
✅ UK & US helplines included

### App Review Guidelines
- App is fully functional
- No broken features or placeholder content
- Privacy policy accessible
- Age rating appropriate (13+)
- Crisis support properly handled

### Testing Before Submission
- Test all 4 AI coaches
- Verify quiz generation and saving
- Check insights report generation
- Test chat persistence
- Verify daily reflection saving
- Test free tier message limits (10/day)
- Test upgrade flow (though not required for approval)

---

## 📞 SUPPORT NEEDED FROM YOU

Please provide when ready:

1. ☐ Apple Developer Account credentials
2. ☐ App Store Connect API key
3. ☐ Screenshots (or I can help generate)
4. ☐ Support URL/email
5. ☐ Marketing URL (if available)
6. ☐ Copyright holder name
7. ☐ Any specific description changes

---

## 📧 NEXT STEPS

**Message me with:**
1. Your Apple Developer account status
2. Team ID (once account approved)
3. Whether you want help with screenshots
4. Any questions about the submission process

**I'm ready to:**
- Update CodeMagic configuration
- Generate screenshot templates
- Trigger the build
- Guide you through App Store Connect setup
- Help with submission review

---

**Status:** ✅ App ready for submission once Apple Developer account approved
**Estimated Time to Live:** 3-5 days after account approval (including review time)
