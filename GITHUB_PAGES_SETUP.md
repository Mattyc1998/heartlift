# How to Host Privacy Policy on GitHub Pages

## Quick Setup (5 minutes)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `heartlift-privacy` (or any name)
3. Set to **Public**
4. ✅ Check "Add a README file"
5. Click "Create repository"

### Step 2: Upload Privacy Policy
1. In your new repo, click "Add file" → "Upload files"
2. Drag and drop `/app/privacy-policy.html` from this project
3. Commit the file (click "Commit changes")

### Step 3: Enable GitHub Pages
1. In your repo, go to **Settings** tab
2. Scroll down to **Pages** section (left sidebar)
3. Under "Source", select **main** branch
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Step 4: Get Your Public URL
Your Privacy Policy will be live at:
```
https://YOUR-GITHUB-USERNAME.github.io/heartlift-privacy/privacy-policy.html
```

Example: `https://johndoe.github.io/heartlift-privacy/privacy-policy.html`

### Step 5: Use in App Store
Copy your URL and use it in App Store Connect:
- **Privacy Policy URL:** (paste your GitHub Pages URL)

---

## Alternative: Use Existing HeartLift Repo

If you already have a HeartLift repository:

1. Add `privacy-policy.html` to the root of your repo
2. Go to **Settings** → **Pages**
3. Enable GitHub Pages (main branch)
4. URL will be: `https://YOUR-USERNAME.github.io/REPO-NAME/privacy-policy.html`

---

## Quick Option: Use Raw GitHub URL (Not Recommended)

If you need it immediately and can't wait:
1. Upload `privacy-policy.html` to any GitHub repo
2. Go to the file in GitHub
3. Click "Raw" button
4. Copy that URL (e.g., `https://raw.githubusercontent.com/...`)

⚠️ **Warning:** Raw URLs are not as professional. Use GitHub Pages for official submission.

---

## File Location

The HTML file is ready at: **`/app/privacy-policy.html`**

You can also view/edit it before uploading.

---

## Test Your URL

Before submitting to Apple:
1. Open your GitHub Pages URL in a browser
2. Verify all content displays correctly
3. Check on mobile (responsive design included)
4. Bookmark it for App Store submission

---

## Update Submission Documents

Once you have your URL, update:

1. **App Store Connect:**
   - Privacy Policy URL field

2. **IOS_SUBMISSION_READY.md:**
   - Update "Privacy Policy URL" section

---

## Need Help?

If you encounter issues:
- Check repository is Public (not Private)
- Wait 2-3 minutes after enabling Pages
- Clear browser cache
- Try incognito/private browsing mode

Your Privacy Policy is ready to host! 🎉
