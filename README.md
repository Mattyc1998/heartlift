# HeartLift - iOS App Deployment

Welcome to the HeartLift iOS app project! This app has been converted from a web application to a native iOS app using Capacitor and is ready for App Store deployment.

## 🚀 Quick Start

Your HeartLift app is now configured for iOS! Here's what to do next:

### 1️⃣ Immediate Actions
1. **Create Apple Developer Account** - Visit https://developer.apple.com/programs/ ($99/year)
2. **Sign Up for CodeMagic** - Visit https://codemagic.io/ (free tier available)
3. **Push to GitHub** - Ensure this code is in a GitHub repository

### 2️⃣ Read the Guides
- 📖 **[IOS_QUICK_START.md](./IOS_QUICK_START.md)** - Start here! Quick reference and checklist
- 📘 **[IOS_DEPLOYMENT_GUIDE.md](./IOS_DEPLOYMENT_GUIDE.md)** - Complete step-by-step instructions
- ✅ **[APP_STORE_SUBMISSION_CHECKLIST.md](./APP_STORE_SUBMISSION_CHECKLIST.md)** - Pre-submission checklist
- 🔧 **[IOS_TECHNICAL_SUMMARY.md](./IOS_TECHNICAL_SUMMARY.md)** - Technical details and architecture
- 🔌 **[SUPABASE_CONFIGURATION_VERIFIED.md](./SUPABASE_CONFIGURATION_VERIFIED.md)** - Supabase setup confirmed ✓

### 3️⃣ Critical Requirements
⚠️ **IMPORTANT**: The app currently uses placeholder icons (pink/purple gradient with heart). You **MUST** replace these with professional designs before App Store submission:
- Location: `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Required: 1024x1024 high-quality app icon
- Use `frontend/generate_icons.py` to regenerate all sizes from your master icon

## 📱 What's Been Configured

✅ Capacitor 7.4.3 installed and configured  
✅ iOS platform added with native project  
✅ Bundle ID: `com.mattyc.heartlift`  
✅ App Name: `HeartLift`  
✅ Placeholder icons generated  
✅ CodeMagic CI/CD configuration  
✅ Build scripts added  
✅ Comprehensive documentation  

## 🏗️ Project Structure

```
/app/
├── frontend/
│   ├── ios/                    # Native iOS project (Xcode)
│   ├── src/                    # React source code
│   ├── dist/                   # Built web app (generated)
│   ├── capacitor.config.ts     # Capacitor configuration
│   ├── generate_icons.py       # Icon generator script
│   └── package.json            # Includes iOS build scripts
├── backend/                    # FastAPI backend
├── codemagic.yaml             # CI/CD configuration for iOS builds
├── IOS_QUICK_START.md         # ⭐ Start here!
├── IOS_DEPLOYMENT_GUIDE.md    # Complete instructions
├── APP_STORE_SUBMISSION_CHECKLIST.md
└── IOS_TECHNICAL_SUMMARY.md   # Technical details
```

## 🛠️ Useful Commands

```bash
# Frontend Development
cd frontend
yarn install              # Install dependencies
yarn dev                  # Start development server
yarn build               # Build for production

# iOS-Specific Commands
yarn build:ios           # Build web app + sync to iOS
yarn cap:sync:ios        # Sync web assets to iOS
yarn cap:open:ios        # Open in Xcode (Mac only)

# Icon Generation
python3 frontend/generate_icons.py  # Generate placeholder icons
```

## 📦 Tech Stack

- **Frontend**: React 18.3 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB (existing)
- **Authentication**: Supabase
- **Payments**: Stripe
- **Mobile Framework**: Capacitor 7.4.3
- **Platform**: iOS 13.0+
- **CI/CD**: CodeMagic

## 🔗 Important URLs

- **Backend API**: https://wellness-buddy-97.preview.emergentagent.com
- **Supabase**: hmmimemzznsyilxqakty.supabase.co
- **Bundle ID**: com.mattyc.heartlift

## 📋 Next Steps

### Phase 1: Setup (2-3 hours)
1. Create Apple Developer Account and wait for approval
2. Sign up for CodeMagic using GitHub
3. Create App ID in Apple Developer Portal: `com.mattyc.heartlift`
4. Create app in App Store Connect
5. Connect CodeMagic to Apple Developer account
6. Configure automatic code signing in CodeMagic

### Phase 2: Build (15-20 minutes)
7. Update `codemagic.yaml` with your email and Apple ID
8. Push code to GitHub
9. Trigger first build in CodeMagic
10. Download .ipa file from artifacts

### Phase 3: Test (4-8 hours)
11. Upload to TestFlight (automatic via CodeMagic or manual)
12. Install on iOS device and test thoroughly
13. Test all features: auth, payments, subscriptions, chat, mood tracking, etc.
14. Fix any bugs and rebuild

### Phase 4: Launch (1-2 weeks)
15. **CRITICAL**: Replace placeholder icons with professional designs
16. Create required screenshots for App Store
17. Complete App Store listing (description, keywords, etc.)
18. Set up in-app purchases/subscriptions
19. Add privacy policy URL
20. Submit for review
21. Respond to any Apple feedback
22. Release to App Store! 🎉

## ⚠️ Important Notes

### Icons (Critical!)
The app currently uses **placeholder icons**. These are temporary gradient icons with a simple heart design. You **MUST** replace these before App Store submission:
- Design a professional 1024x1024 icon
- Use a designer or service like Fiverr, 99designs, or Dribbble
- Budget: $50-$500 depending on quality
- Once you have the master icon, update the generator script or use an online tool

### Payments & Subscriptions
HeartLift includes premium subscriptions via Stripe. Important considerations:
- Apple requires using their In-App Purchase (IAP) system for digital goods
- You may need to implement Apple IAP alongside or instead of Stripe
- External payment processors require special approval from Apple
- Review App Store guidelines section 3.1.1 (In-App Purchase)

### Privacy Policy
Required for App Store submission:
- Must be publicly accessible URL
- Must detail data collection and usage
- Must comply with GDPR, CCPA, etc.
- Consider using a privacy policy generator

### TestFlight
- Free beta testing platform from Apple
- Can have up to 10,000 external testers
- No approval needed for internal testing
- External testing requires Apple review (faster than App Store review)

## 🐛 Troubleshooting

**Q: Build fails in CodeMagic**  
A: Check build logs for specific errors. Common issues:
- Missing Apple Developer credentials
- Code signing misconfiguration
- Node/yarn version mismatch
- Missing dependencies

**Q: App crashes on iOS device**  
A: Check these:
- Backend URL is accessible from device
- Supabase credentials are correct
- Check Safari Web Inspector for console errors
- Verify all APIs return expected responses

**Q: Icons not showing up**  
A: Make sure:
- All icon files exist in the correct location
- `Contents.json` references correct filenames
- Re-sync with `npx cap sync ios`
- Clean build in Xcode (if building locally)

For more troubleshooting, see **IOS_DEPLOYMENT_GUIDE.md**

## 📞 Support Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs
- **CodeMagic Documentation**: https://docs.codemagic.io/
- **Apple Developer**: https://developer.apple.com/documentation/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Mobile**: https://stripe.com/docs/mobile

## 🎯 Success Metrics

Current status of your iOS deployment:

- ✅ **iOS project configured**
- ✅ **CodeMagic setup documented**
- ✅ **Build scripts ready**
- ✅ **Documentation complete**
- ⚠️ **Icons**: Using placeholders - MUST REPLACE
- ⏳ **Apple Account**: Not yet created
- ⏳ **CodeMagic Build**: Not yet run
- ⏳ **TestFlight**: Not yet tested
- ⏳ **App Store**: Not yet submitted

## 🚦 Status: Ready for Cloud Build

Your HeartLift app is fully configured and ready for iOS deployment! 

**Next Step**: Read **[IOS_QUICK_START.md](./IOS_QUICK_START.md)** and begin the deployment process.

**Timeline to App Store**: 1-2 weeks with the provided guides

Good luck with your iOS launch! 🚀

---

## App Information

**App Name**: HeartLift  
**Bundle ID**: com.mattyc.heartlift  
**Category**: Health & Fitness  
**Description**: Mental wellness and healing support app with AI-powered coaching, daily affirmations, mood tracking, and personalized recovery plans.

**Key Features**:
- 🤖 AI-powered life coaching
- 💭 Daily affirmations and reflections
- 📊 Mood tracking and insights
- 🎯 Recovery milestones
- 📝 Journal prompts
- 🧘 Visualization practices
- ⚡ No-contact tracking support
- 💎 Premium subscriptions
- 🎁 Healing kit purchases

**Target Audience**: Adults seeking mental wellness support, particularly those recovering from difficult relationships or life transitions.

**Age Rating**: 12+ or 17+ (complete age rating questionnaire during submission)

