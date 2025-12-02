# HeartLift iOS Deployment Guide

This guide walks you through deploying the HeartLift app to the iOS App Store using CodeMagic for cloud builds.

## 📋 Prerequisites

Before you begin, you'll need:

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Wait for account approval (usually 24-48 hours)

2. **GitHub Repository**
   - This code should be in a GitHub repository
   - You'll connect this repo to CodeMagic

3. **CodeMagic Account** (Free tier available)
   - Sign up at: https://codemagic.io/
   - Use GitHub to sign in for easy integration

## 🚀 Step-by-Step Deployment Process

### Step 1: Apple Developer Account Setup

1. **Create App ID**
   - Go to: https://developer.apple.com/account/resources/identifiers/list
   - Click the "+" button
   - Select "App IDs" and click Continue
   - Select "App" and click Continue
   - Fill in:
     - Description: `HeartLift`
     - Bundle ID: `com.mattyc.heartlift` (Explicit)
   - Select capabilities you need:
     - ✅ Push Notifications (if using)
     - ✅ In-App Purchase (for premium features)
     - ✅ Sign in with Apple (if using Supabase social auth)
   - Click Continue and Register

2. **Create App Store Connect App**
   - Go to: https://appstoreconnect.apple.com/
   - Click "My Apps" > "+" > "New App"
   - Fill in:
     - Platform: iOS
     - Name: HeartLift
     - Primary Language: English (U.S.)
     - Bundle ID: com.mattyc.heartlift
     - SKU: heartlift-ios (or any unique identifier)
   - Click Create

### Step 2: Connect GitHub to CodeMagic

1. **Sign Up/Sign In to CodeMagic**
   - Go to: https://codemagic.io/
   - Click "Sign up with GitHub"
   - Authorize CodeMagic to access your repositories

2. **Add Your Repository**
   - In CodeMagic dashboard, click "Add application"
   - Select your GitHub repository
   - Choose "Flutter/React Native/Ionic/Capacitor" as project type
   - Select the repository containing this code

### Step 3: Configure CodeMagic Build

1. **Set Up Environment Variables**
   - In your CodeMagic app settings, go to "Environment variables"
   - Add these variables:
     ```
     XCODE_WORKSPACE=App.xcworkspace
     XCODE_SCHEME=App
     BUNDLE_ID=com.mattyc.heartlift
     APP_STORE_APPLE_ID=your_apple_id_here
     ```

2. **Add Apple Developer Credentials**
   - Go to "Teams" > "Integrations" > "Developer Portal"
   - Click "Connect" next to Apple Developer Portal
   - Enter your Apple ID and App-Specific Password:
     - Generate App-Specific Password at: https://appleid.apple.com/account/manage
     - Go to "Security" > "App-Specific Passwords" > "Generate Password"
     - Copy the generated password

3. **Set Up Code Signing**
   - In CodeMagic, go to "iOS code signing"
   - Click "Automatic code signing"
   - Select your team
   - Choose "App Store" distribution type
   - CodeMagic will automatically manage certificates and provisioning profiles

### Step 4: Configure the Build

The `codemagic.yaml` file in the root of the project is already configured. You just need to update:

1. Open `codemagic.yaml`
2. Replace `your-email@example.com` with your actual email
3. Replace `YOUR_APPLE_ID` with your Apple ID (if not set in environment variables)

### Step 5: Trigger Your First Build

1. **Start a Build**
   - In CodeMagic dashboard, click "Start new build"
   - Select branch: `main` (or your default branch)
   - Select workflow: `ios-workflow`
   - Click "Start new build"

2. **Monitor the Build**
   - Watch the build logs in real-time
   - The build process includes:
     - Installing dependencies
     - Building the React app
     - Syncing with Capacitor
     - Building the iOS app
     - Creating the .ipa file

3. **Build Duration**
   - First build: 15-25 minutes (includes dependency installation)
   - Subsequent builds: 10-15 minutes

### Step 6: Download and Test the .ipa

1. **Download the Build Artifact**
   - Once build succeeds, click on the build
   - Go to "Artifacts" tab
   - Download the .ipa file

2. **Install on Test Device (Optional)**
   - Use TestFlight (see Step 7) or
   - Use a tool like Diawi (https://www.diawi.com/) to install on test devices

### Step 7: Submit to TestFlight (Internal Testing)

1. **Enable TestFlight Submission**
   - In `codemagic.yaml`, uncomment these lines:
     ```yaml
     app_store_connect:
       auth: integration
       submit_to_testflight: true
       beta_groups:
         - Internal Testers
     ```

2. **Create Internal Testing Group**
   - In App Store Connect, go to your app
   - Click "TestFlight" tab
   - Create a new internal testing group
   - Add your Apple ID as an internal tester

3. **Trigger a New Build**
   - CodeMagic will automatically upload to TestFlight
   - You'll receive an email when it's ready to test

4. **Test on Your Device**
   - Install TestFlight app on your iOS device
   - Open the invitation email
   - Install HeartLift and test all features

### Step 8: Submit to App Store

1. **Prepare App Store Listing**
   - Go to App Store Connect > Your App
   - Fill in all required information:
     - App Name: HeartLift
     - Subtitle: Mental wellness and healing support
     - Description: (Write compelling description)
     - Keywords: healing, mental health, wellness, recovery, mindfulness
     - Support URL: Your support website
     - Privacy Policy URL: Your privacy policy URL
     - Category: Health & Fitness

2. **Add Screenshots**
   - Required for 6.7" display (iPhone 15 Pro Max)
   - Required for 5.5" display (iPhone 8 Plus)
   - You'll need to take screenshots on these devices or simulators
   - Minimum 3-10 screenshots per device size

3. **App Store Icons**
   - Currently using placeholder icons
   - **IMPORTANT**: Replace with professional 1024x1024 icon before submission
   - Location: `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`

4. **Enable App Store Submission in CodeMagic**
   - In `codemagic.yaml`, update:
     ```yaml
     submit_to_app_store: true
     ```
   - Trigger a new build
   - Once build completes, it will automatically submit for review

5. **App Review**
   - Apple will review your app (typically 24-72 hours)
   - Respond to any questions or issues
   - Once approved, you can release to the App Store!

## 🔧 Local Development Setup (Optional)

If you get a Mac later and want to develop locally:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
yarn install

# Build the web app
yarn build

# Sync with iOS
yarn cap:sync:ios

# Open in Xcode
yarn cap:open:ios

# Then build and run from Xcode
```

## 📱 App Configuration

### Current Settings
- **Bundle ID**: com.mattyc.heartlift
- **App Name**: HeartLift
- **Backend URL**: https://iosapp-launch.preview.emergentagent.com
- **Supabase Project**: hmmimemzznsyilxqakty

### Updating Configuration

If you need to change any settings:

1. **Bundle ID**: Edit `frontend/capacitor.config.ts`
2. **App Name**: Edit `frontend/capacitor.config.ts`
3. **Backend URL**: Edit `frontend/.env` (REACT_APP_BACKEND_URL)
4. **Icons**: Replace files in `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

After changes, run:
```bash
cd frontend
yarn build:ios
```

## 🐛 Troubleshooting

### Build Fails on CodeMagic

**Issue**: "No matching provisioning profiles found"
- **Solution**: Re-run code signing setup in CodeMagic settings

**Issue**: "Build timed out"
- **Solution**: Increase max_build_duration in codemagic.yaml

**Issue**: "Node modules not found"
- **Solution**: Check that yarn.lock is committed to Git

### App Crashes on Launch

**Issue**: White screen on launch
- **Solution**: Check that build output is in `dist` folder, not `build`
- Verify `webDir: 'dist'` in capacitor.config.ts

**Issue**: API calls failing
- **Solution**: Check backend URL in .env file
- Ensure backend server is running and accessible

### App Store Rejection

**Issue**: "Missing Privacy Policy"
- **Solution**: Add privacy policy URL in App Store Connect

**Issue**: "App does not match description"
- **Solution**: Ensure description accurately reflects app features

**Issue**: "Using placeholder icons"
- **Solution**: Replace all app icons with professional designs

## 📚 Additional Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs
- **CodeMagic Documentation**: https://docs.codemagic.io/
- **Apple Developer**: https://developer.apple.com/documentation/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

## 🎉 Success Checklist

Before submitting to App Store, ensure:

- [ ] Apple Developer Account is active
- [ ] App ID created in Developer Portal
- [ ] App created in App Store Connect
- [ ] CodeMagic builds successfully
- [ ] App tested in TestFlight
- [ ] Professional app icons installed (not placeholders)
- [ ] All screenshots prepared
- [ ] App Store listing complete
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] All required metadata filled in
- [ ] App reviewed and approved by your team
- [ ] Payment features tested (if applicable)
- [ ] Authentication flow tested
- [ ] All core features working

## 💡 Tips for Success

1. **Test Thoroughly**: Use TestFlight extensively before public release
2. **Professional Icons**: Invest in professional app icon design
3. **Clear Screenshots**: Use iOS device frames and highlight key features
4. **Compelling Description**: Write benefits-focused description
5. **Keywords**: Research and use relevant App Store Optimization (ASO) keywords
6. **Support Ready**: Have support email/system ready before launch
7. **Privacy Compliance**: Ensure GDPR/CCPA compliance
8. **Regular Updates**: Plan for updates and bug fixes post-launch

## 🆘 Need Help?

If you encounter issues:

1. Check CodeMagic build logs for detailed error messages
2. Review Apple's rejection reasons carefully
3. Search CodeMagic community forums
4. Contact CodeMagic support for build issues
5. Contact Apple Developer Support for App Store issues

---

**Note**: The current setup uses placeholder icons. You MUST replace these with professional designs before App Store submission to avoid rejection.

Good luck with your iOS launch! 🚀
