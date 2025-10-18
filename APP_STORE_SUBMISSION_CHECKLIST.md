# App Store Submission Checklist for HeartLift

Use this checklist when you're ready to submit HeartLift to the App Store.

## 📋 Pre-Submission Requirements

### Apple Developer Account Setup
- [ ] Apple Developer Account created and active ($99/year)
- [ ] Two-factor authentication enabled
- [ ] App-Specific Password generated for CodeMagic
- [ ] Team ID obtained

### App Store Connect Setup
- [ ] App created in App Store Connect
- [ ] Bundle ID registered: `com.mattyc.heartlift`
- [ ] App name "HeartLift" reserved
- [ ] SKU assigned

### Code Signing
- [ ] Distribution certificate created (or auto-managed by CodeMagic)
- [ ] App Store provisioning profile created
- [ ] CodeMagic connected to Apple Developer account
- [ ] Automatic code signing configured in CodeMagic

## 🎨 Assets & Design

### App Icons (CRITICAL - Must Replace Placeholders!)
- [ ] Professional 1024x1024 app icon designed
- [ ] All icon sizes generated and added to project
- [ ] Icons follow Apple's guidelines (no transparency, rounded corners handled by iOS)
- [ ] Icons look good at all sizes

**Current Status**: ⚠️ Using placeholder icons (pink/purple gradient)
**Location**: `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Screenshots (Required for App Store)
- [ ] iPhone 6.7" (iPhone 15 Pro Max) - Minimum 3, maximum 10
- [ ] iPhone 5.5" (iPhone 8 Plus) - Minimum 3, maximum 10
- [ ] Optional: iPad Pro 12.9" screenshots
- [ ] Optional: iPad Pro 11" screenshots

**Recommended Screenshots**:
1. Hero screen showing main value proposition
2. Key feature showcase (e.g., healing kit)
3. Premium features highlight
4. User testimonial or results
5. Coach interaction or daily affirmations

### App Preview Video (Optional but Recommended)
- [ ] 15-30 second app preview video created
- [ ] Shows app in action on real device
- [ ] Follows Apple's guidelines

## 📝 App Store Listing

### Basic Information
- [ ] **App Name**: HeartLift
- [ ] **Subtitle**: (Max 30 characters)
      Example: "Mental Wellness & Healing"
- [ ] **Primary Language**: English (U.S.)
- [ ] **Category**: Primary - Health & Fitness
- [ ] **Secondary Category**: Lifestyle (optional)

### Description
- [ ] **Promotional Text** (170 characters max - editable after submission)
      Example: "Transform your healing journey with AI-powered coaching, daily affirmations, and personalized wellness tools."

- [ ] **Description** (Max 4,000 characters)
      Include:
      - What the app does
      - Key features (healing kits, coach personas, mood tracking, etc.)
      - Benefits for users
      - Premium features
      - No contact tracking
      - Recovery milestones

- [ ] **Keywords** (Max 100 characters, comma-separated)
      Suggestions: healing,recovery,wellness,mental health,mindfulness,coach,affirmations,mood tracker,self care,therapy

- [ ] **Support URL**: Your support website
- [ ] **Marketing URL**: Your marketing website (optional)

### Privacy & Legal
- [ ] **Privacy Policy URL**: Required - must be publicly accessible
- [ ] **Terms of Service URL**: Recommended (especially with subscriptions)
- [ ] **Age Rating**: Complete questionnaire
      - Likely rating: 12+ or 17+ (depending on content)
      - Mental health content may require specific ratings

### App Review Information
- [ ] **Contact Name**: Your name
- [ ] **Contact Phone**: Your phone number
- [ ] **Contact Email**: Support email address
- [ ] **Demo Account**: If app requires login (recommended for faster review)
      - Username: demo@heartlift.com or similar
      - Password: DemoPassword123!
      - Include special instructions if needed
- [ ] **Notes**: Any special instructions for reviewers
      Example: "This app includes in-app purchases for premium features. Test account provided for full access."

## 💰 In-App Purchases & Subscriptions

HeartLift includes premium subscriptions. You need to set these up:

### Subscription Setup
- [ ] Create subscription group in App Store Connect
- [ ] Add individual subscription tiers:
      - [ ] Monthly subscription
      - [ ] Annual subscription (if applicable)
      - [ ] Healing Kit purchase
- [ ] Set pricing for each tier
- [ ] Set pricing for each territory/country
- [ ] Add subscription display names and descriptions
- [ ] Upload subscription promotional images
- [ ] Submit subscriptions for review

### Stripe Integration Note
- [ ] Verify Stripe integration works on iOS
- [ ] Ensure Apple knows about external payment options (must comply with Apple's rules)
- [ ] Consider using Apple's in-app purchase system to comply with App Store guidelines

**Important**: Apple requires use of their IAP system for digital goods/services. External payment processors like Stripe may require special approval or may need to be supplemented with Apple IAP.

## 🔒 Privacy & Data

### App Privacy Details (Required)
Complete the questionnaire in App Store Connect:

- [ ] **Data Collection**:
      - User credentials (email, password) - YES
      - Health data (mood tracking, recovery data) - YES
      - Payment information - YES (if using IAP)
      - User content (journal entries, reflections) - YES
      - Usage data - YES (likely)

- [ ] **Data Usage**:
      - App functionality - YES
      - Personalization - YES
      - Analytics - YES (if applicable)

- [ ] **Data Linking**:
      Specify if data is linked to user identity

- [ ] **Data Tracking**:
      Specify if data is used for tracking

### Required Permissions
Document what permissions your app requests:
- [ ] Push Notifications (if using)
- [ ] Camera (if app uses camera)
- [ ] Photo Library (if users can upload images)
- [ ] Location (if using location features)

**HeartLift likely needs**: None of these based on current implementation
(Using Supabase for data storage doesn't require special iOS permissions)

## 🧪 Testing

### Before Submission
- [ ] Full app tested on iOS device via TestFlight
- [ ] Tested on multiple iOS versions (minimum iOS 13+)
- [ ] Tested on multiple device sizes (iPhone SE, standard, Plus/Max, iPad)
- [ ] All features working:
      - [ ] Authentication (sign up, login, logout)
      - [ ] Password reset flow
      - [ ] Email verification
      - [ ] Premium purchase flow
      - [ ] Healing kit purchase
      - [ ] Subscription management
      - [ ] Chat interface
      - [ ] Mood tracking
      - [ ] Daily affirmations
      - [ ] Coach personas
      - [ ] Advanced tools
      - [ ] All navigation and routes
- [ ] No crashes or critical bugs
- [ ] Performance is acceptable (no lag, smooth animations)
- [ ] Backend API connection working
- [ ] Supabase authentication working
- [ ] Payment processing tested (use test cards)

### Edge Cases Tested
- [ ] Offline behavior (graceful degradation)
- [ ] Poor network conditions
- [ ] Background/foreground transitions
- [ ] Push notifications (if applicable)
- [ ] Deep links (if applicable)
- [ ] iPad display (if supporting iPad)

## 🚀 Build & Deployment

### CodeMagic Setup
- [ ] CodeMagic account created
- [ ] GitHub repository connected
- [ ] Apple Developer credentials added
- [ ] Code signing configured (automatic)
- [ ] Build workflow tested and successful
- [ ] Artifacts downloading correctly
- [ ] TestFlight upload configured (optional)

### Final Build
- [ ] Professional app icons installed (not placeholders!)
- [ ] All placeholder content removed
- [ ] Version number set (e.g., 1.0.0)
- [ ] Build number incremented
- [ ] Release notes prepared
- [ ] Final build uploaded to App Store Connect

## 📤 Submission

### App Store Connect
- [ ] All required fields completed
- [ ] Screenshots uploaded for all required sizes
- [ ] App privacy details completed
- [ ] App review information provided with demo account
- [ ] Subscriptions submitted and approved
- [ ] Build selected for submission
- [ ] Export compliance information completed
      (Usually "No" for encryption if not using custom encryption)
- [ ] Content rights information completed
- [ ] Advertising identifier information completed

### Final Review
- [ ] Reviewed all information for accuracy
- [ ] Screenshots match actual app
- [ ] Description is accurate and not misleading
- [ ] Age rating is appropriate
- [ ] No forbidden content (see guidelines)
- [ ] Complies with App Store Review Guidelines

### Submit!
- [ ] Click "Submit for Review"
- [ ] Monitor status in App Store Connect
- [ ] Respond promptly to any Apple questions
- [ ] Celebrate when approved! 🎉

## 📊 Post-Submission

### Monitoring
- [ ] Set up App Store Connect alerts
- [ ] Monitor for crashes (iOS Crash Reports)
- [ ] Watch for user reviews
- [ ] Track download metrics
- [ ] Monitor revenue (if applicable)

### Support
- [ ] Support email actively monitored
- [ ] FAQ prepared for common questions
- [ ] Ready to respond to user feedback
- [ ] Bug fix process established

### Updates
- [ ] Update schedule planned (recommend monthly)
- [ ] Bug tracking system in place
- [ ] User feedback collection method
- [ ] Feature request tracking

## ⏱️ Timeline Estimates

- **App Store Connect Setup**: 1-2 hours
- **Assets Creation (icons, screenshots)**: 4-8 hours
- **Privacy & Legal Documentation**: 2-4 hours
- **Subscription Setup**: 1-2 hours
- **Testing**: 4-8 hours
- **App Review**: 24-72 hours (Apple's review time)
- **Resubmission** (if rejected): 24-72 hours

**Total Time from Start to Approval**: 1-2 weeks (depending on asset creation time)

## 🚫 Common Rejection Reasons (Avoid These!)

1. **Placeholder Icons**: Using generic or placeholder icons
   - **Solution**: Professional, unique icon required

2. **Incomplete Functionality**: Features mentioned but not working
   - **Solution**: Test everything thoroughly

3. **Crashes**: App crashes during review
   - **Solution**: Extensive testing, crash reporting

4. **Misleading Description**: Features described but not present
   - **Solution**: Accurate, honest description

5. **Missing Privacy Policy**: No privacy policy or inaccessible URL
   - **Solution**: Public, accessible privacy policy required

6. **In-App Purchase Issues**: IAP not working or using external payment incorrectly
   - **Solution**: Follow Apple's IAP guidelines strictly

7. **Demo Account Issues**: Provided account doesn't work
   - **Solution**: Test demo account before submission

8. **Age Rating Mismatch**: Content doesn't match selected age rating
   - **Solution**: Honest age rating based on content

## 🎯 Tips for Approval

1. **First Impressions Matter**: Make your icon and first screenshot compelling
2. **Clear Value Proposition**: Immediately show what your app does
3. **Demo Account**: Provide a working demo account with premium features enabled
4. **Test on Real Devices**: Don't just use simulator
5. **Read Guidelines**: Familiarize yourself with App Store Review Guidelines
6. **Be Responsive**: If Apple contacts you, respond within 24 hours
7. **Professional Assets**: Invest in quality icons and screenshots
8. **Clear Communication**: Write clear, concise descriptions and notes

## 📞 Resources

- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **In-App Purchase Guidelines**: https://developer.apple.com/in-app-purchase/
- **App Privacy Details**: https://developer.apple.com/app-store/app-privacy-details/

---

## ✅ Ready to Submit?

Make sure EVERY checkbox above is checked before clicking "Submit for Review"!

**Current Status**:
- ✅ iOS project configured
- ✅ CodeMagic setup documented
- ⚠️ Icons: Using placeholders - MUST REPLACE
- ⚠️ Screenshots: Not yet created
- ⚠️ App Store listing: Not yet completed
- ⚠️ Subscriptions: Not yet configured

**Next Steps**:
1. Replace placeholder icons
2. Create required screenshots
3. Set up App Store Connect
4. Complete this entire checklist
5. Submit! 🚀

Good luck with your submission!
