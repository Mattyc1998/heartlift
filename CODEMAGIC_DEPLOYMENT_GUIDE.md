# 🚀 HeartLift iOS Deployment via CodeMagic (No Xcode Needed!)

## ✅ What You Have Already

- ✅ `codemagic.yaml` configured in your repo
- ✅ App icons and screenshots ready
- ✅ Privacy Policy hosted publicly
- ✅ App Store marketing copy ready
- ✅ Apple IAP implementation complete

---

## 📋 Complete Deployment Workflow

### **PHASE 1: Apple Developer Program Approval** ⏳

**Wait for Apple to approve your developer enrollment ($99/year)**

Once approved, you'll get access to:
- App Store Connect (https://appstoreconnect.apple.com)
- Apple Developer Portal (https://developer.apple.com)

---

### **PHASE 2: Create App in App Store Connect**

1. **Go to**: https://appstoreconnect.apple.com
2. **My Apps** → **"+"** → **New App**
3. **Fill in**:
   - **Platform**: iOS
   - **Name**: HeartLift
   - **Primary Language**: English (UK)
   - **Bundle ID**: Select `com.mattyc.heartlift` (create if not exists)
   - **SKU**: `heartlift-ios-001`
   - **User Access**: Full Access

4. **Save** and note the **Apple ID** (numeric, like 1234567890)
   - You'll see it in the URL: `...apps/1234567890/appstore`

---

### **PHASE 3: Create In-App Purchases**

#### **3.1 Premium Subscription:**
1. In your app → **In-App Purchases** → **"+"**
2. **Type**: Auto-Renewable Subscription
3. **Details**:
   - **Product ID**: `com.mattyc.heartlift.premium.monthly` ⚠️ EXACT
   - **Reference Name**: HeartLift Premium Monthly
   - **Subscription Group**: Create new → "HeartLift Premium"
   - **Duration**: 1 Month
   - **Price**: £11.99
4. **Localization** (English UK):
   - **Display Name**: Premium
   - **Description**: Unlimited support for your relationship growth. Unlimited AI coach conversations, regenerate responses, guided programs, personalized insights, and priority support.
5. **Save** and **Submit for Review**

#### **3.2 Healing Kit:**
1. **"+"** → **Non-Consumable**
2. **Details**:
   - **Product ID**: `com.mattyc.heartlift.healingkit` ⚠️ EXACT
   - **Reference Name**: Healing Kit
   - **Price**: £4.99
3. **Localization** (English UK):
   - **Display Name**: Healing Kit
   - **Description**: Complete break-up recovery package. Includes 30-day healing plan, daily affirmations, visualization practices, no-contact tracker, journal prompts, and priority support.
4. **Save** and **Submit for Review**

---

### **PHASE 4: Get Apple Credentials for CodeMagic**

#### **4.1 App Store Connect API Key:**

1. **App Store Connect** → **Users and Access** → **Keys** (Integrations tab)
2. Click **"+"** → **Generate API Key**
3. **Name**: CodeMagic
4. **Access**: App Manager
5. Click **Generate**
6. **Download** the `.p8` file ⚠️ YOU CAN ONLY DOWNLOAD ONCE!
7. **Save these 3 things**:
   ```
   Issuer ID: 12345678-1234-1234-1234-123456789012
   Key ID: ABC123XYZ
   Private Key: (contents of .p8 file)
   ```

#### **4.2 Apple Distribution Certificate:**

**Option A: Let CodeMagic Generate It (Easiest)**
- CodeMagic can auto-generate certificates for you
- You'll do this in CodeMagic settings

**Option B: Generate Manually**
1. Go to: https://developer.apple.com/account/resources/certificates
2. **"+"** → **iOS Distribution (App Store and Ad Hoc)**
3. Follow prompts (may need Mac for CSR, or use online CSR generator)
4. Download the certificate

#### **4.3 Provisioning Profile:**

1. Go to: https://developer.apple.com/account/resources/profiles
2. **"+"** → **App Store**
3. **App ID**: com.mattyc.heartlift
4. **Certificate**: Select your distribution certificate
5. **Name**: HeartLift App Store
6. **Download** the profile

---

### **PHASE 5: Configure CodeMagic** 🎯

#### **5.1 Sign Up & Connect Repo:**

1. Go to: https://codemagic.io/signup
2. Sign up with GitHub
3. **Add application** → Authorize GitHub → Select `Mattyc1998/heartlift`
4. CodeMagic auto-detects your `codemagic.yaml` ✅

#### **5.2 Add Code Signing:**

1. In CodeMagic → Your App → **Team settings** → **Code signing identities**
2. **iOS certificates** section:
   
   **Option A: Automatic (Recommended)**
   - Click **Automatic code signing**
   - CodeMagic will generate certificate for you
   - Provide App Store Connect API key (from 4.1)
   
   **Option B: Manual**
   - Upload your Distribution Certificate (.p12 or .cer)
   - Upload your Provisioning Profile (.mobileprovision)
   - Enter certificate password if set

#### **5.3 Add App Store Connect Integration:**

1. **Team settings** → **Integrations** → **App Store Connect**
2. Click **Enable App Store Connect**
3. **Paste**:
   - Issuer ID (from 4.1)
   - Key ID (from 4.1)
   - Private Key (entire contents of .p8 file)
4. **Name the integration**: `codemagic` (matches your codemagic.yaml)
5. **Save**

#### **5.4 Update Environment Variables:**

1. **App settings** → **Environment variables**
2. Add these variables:
   ```
   APP_STORE_APPLE_ID = 1234567890  (your app's numeric ID from Phase 2)
   ```
3. **Optional** (if not using automatic signing):
   ```
   CERTIFICATE_PRIVATE_KEY = (your cert password)
   ```

#### **5.5 Update Email Notification:**

1. Edit `codemagic.yaml` in your repo
2. Line 63: Replace `support@heart-lift.com` with your actual email
3. Line 16: Replace `1234567890` with your App Store Apple ID
4. Commit and push to GitHub

---

### **PHASE 6: Trigger Build & Deploy** 🚀

#### **6.1 Start Build:**

1. **CodeMagic Dashboard** → Your App → **Start new build**
2. **Branch**: main
3. **Workflow**: ios-workflow
4. Click **Start new build**

#### **6.2 What Happens Next (Automated):**

CodeMagic will automatically:
1. ✅ Clone your GitHub repo
2. ✅ Install dependencies (`yarn install`)
3. ✅ Build React app (`yarn build`)
4. ✅ Sync Capacitor (`npx cap sync ios`)
5. ✅ Code sign with your certificate
6. ✅ Build iOS IPA file
7. ✅ Upload to TestFlight automatically
8. ✅ Email you when done (success or failure)

**Build time**: ~15-20 minutes

#### **6.3 Check Build Status:**

- Watch live logs in CodeMagic dashboard
- You'll get email notification when complete
- Build artifacts (IPA file) saved automatically

---

### **PHASE 7: TestFlight Testing** 🧪

After successful build:

1. **App Store Connect** → Your App → **TestFlight**
2. You'll see your build appear (usually within 5-10 minutes)
3. **Add Internal Testers**:
   - Users and Access → Testers
   - Add yourself and test users
   - They'll get TestFlight invite email
4. **Install TestFlight app** on iPhone
5. **Open invite** and install HeartLift
6. **Test everything**:
   - [ ] All features work
   - [ ] In-App Purchases (sandbox mode)
   - [ ] Premium subscription flow
   - [ ] Healing kit purchase
   - [ ] Message limits for free users
   - [ ] No crashes or errors

---

### **PHASE 8: Submit for App Store Review** 📝

Once testing is complete:

#### **8.1 Fill Out App Store Listing:**

1. **App Store Connect** → Your App → **App Store** tab
2. **App Information**:
   - Category: Health & Fitness (primary), Lifestyle (secondary)
   - Content Rights: Check "I own the rights..."
3. **Pricing and Availability**:
   - Price: Free
   - Availability: All countries
4. **App Privacy**:
   - Privacy Policy URL: `https://mattyc1998.github.io/heartlift/privacy-policy.html`
   - Data types: Fill questionnaire honestly
5. **Prepare for Submission**:
   - Version: 1.0
   - Copyright: © 2025 HeartLift
   - Age Rating: 13+ (answer questionnaire)
6. **Description**: Use the copy I provided earlier (3,847 characters)
7. **Keywords**: Use the keywords I provided (100 characters)
8. **Promotional Text**: Use the 169-character text I provided
9. **Screenshots**: Upload from `/app/app-store-screenshots/final/`
10. **App Preview Video**: Optional but recommended

#### **8.2 App Review Information:**

1. **Contact Information**:
   - Email: support@heart-lift.com
   - Phone: Your phone number
2. **Demo Account** (REQUIRED):
   - Create a test user account in your app
   - Username: reviewer@heartlift.app
   - Password: TestReview123!
   - Share these credentials in the review notes
3. **Notes for Reviewer**:
   ```
   HeartLift is an AI-powered relationship coaching app.
   
   Demo Account:
   Email: reviewer@heartlift.app
   Password: TestReview123!
   
   Key Features to Test:
   - Free tier: 10 messages/day limit (resets midnight UTC)
   - Premium IAP: Unlimited messages (Product ID: com.mattyc.heartlift.premium.monthly)
   - Healing Kit IAP: Break-up recovery content (Product ID: com.mattyc.heartlift.healingkit)
   - Safety guardrails redirect crisis topics to helplines
   - Daily reflections accessible via profile
   
   All AI features use OpenAI GPT-4o-mini. Content is age-appropriate for 13+.
   ```

#### **8.3 Build Selection:**

1. Select the build from TestFlight you tested
2. Check "This app uses the Advertising Identifier (IDFA)": **No** (unless you added analytics)
3. Export Compliance: **No** (standard HTTPS encryption)

#### **8.4 Submit:**

1. Click **Add for Review**
2. Click **Submit to App Review**
3. Wait for Apple's review (typically 1-7 days)

---

### **PHASE 9: While Waiting for Review** ⏳

Use this time to:
- [ ] Set up RevenueCat account (for IAP management)
- [ ] Configure RevenueCat API key in your app
- [ ] Prepare social media announcements
- [ ] Create launch marketing plan
- [ ] Set up customer support email workflow
- [ ] Monitor CodeMagic builds (should auto-deploy TestFlight updates)

---

### **PHASE 10: App Approved! 🎉**

When Apple approves:

1. **App Store Connect** → Your App → **Pricing and Availability**
2. Click **Make Available** (or it auto-releases based on settings)
3. **🎊 YOUR APP IS LIVE!**

**Next Steps:**
- Announce on social media
- Ask friends/family to download and review
- Monitor reviews and respond
- Track analytics in App Store Connect
- Start marketing campaigns

---

## 🔄 **Future Updates (Easy with CodeMagic)**

To release updates:

1. Make changes to your code
2. Commit and push to GitHub
3. **CodeMagic auto-builds** (if you enable auto-trigger)
4. OR manually trigger build in CodeMagic dashboard
5. Test in TestFlight
6. Submit new version in App Store Connect

---

## 🐛 **Common Issues & Solutions**

### **Build Fails: "Code signing error"**
**Solution**: Re-upload certificates in CodeMagic, ensure Bundle ID matches

### **Build Fails: "Node/Yarn error"**
**Solution**: Check `codemagic.yaml` node version, ensure package.json is valid

### **TestFlight: "Build is processing"**
**Solution**: Wait 5-10 minutes, Apple processes all builds

### **App Review: Rejected for IAP**
**Solution**: Ensure demo account has Premium unlocked, or provide sandbox tester credentials

### **Build works but IAP doesn't**
**Solution**: Test with sandbox account, ensure Product IDs match exactly

---

## 💰 **Costs Summary**

- **Apple Developer Program**: $99/year (mandatory)
- **CodeMagic**: 
  - Free tier: 500 build minutes/month (usually enough for indie apps)
  - Paid: $49/month for 3,000 minutes if you need more
- **RevenueCat**: Free up to $2.5k monthly tracked revenue
- **Hosting/Backend**: Your existing setup (Emergent)

---

## 📚 **Resources**

- **CodeMagic Docs**: https://docs.codemagic.io/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com
- **RevenueCat Setup**: See `/app/APPLE_IAP_SETUP_GUIDE.md`

---

## ✅ **Final Checklist Before Submit**

- [ ] App built successfully in CodeMagic
- [ ] Tested in TestFlight (no crashes)
- [ ] IAP products created and submitted for review
- [ ] Demo account created for Apple reviewers
- [ ] Privacy Policy accessible at public URL
- [ ] Screenshots uploaded (all required sizes)
- [ ] App description, keywords, promotional text added
- [ ] Age rating questionnaire completed (13+)
- [ ] Contact email set up (support@heart-lift.com)
- [ ] All features work as expected

---

## 🎯 **YOU'RE READY!**

With CodeMagic, you don't need:
- ❌ A Mac
- ❌ Xcode installed locally
- ❌ Manual signing/building
- ❌ Transporter app

Everything happens in the cloud! 🚀

**Questions?** Check CodeMagic's excellent documentation or their support chat.
