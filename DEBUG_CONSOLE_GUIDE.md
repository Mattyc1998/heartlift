# Debug Console Guide for HeartLift IAP Testing

## What I Added

I've added an **on-screen debug console** to your app that captures and displays all console logs in real-time. This allows you to see exactly what's happening with the IAP initialization without needing a Mac or Safari DevTools.

## How to Use It

1. **Build and Install:**
   - Push this code to GitHub
   - Build on CodeMagic
   - Install the new TestFlight build on your iPhone

2. **Open the Debug Console:**
   - Look for a purple circular button labeled "LOG" in the bottom-right corner of the screen
   - Tap it to open the debug console overlay

3. **View Logs:**
   - All console logs will appear in the overlay with timestamps
   - Logs are color-coded:
     - **Green**: Normal logs
     - **Yellow**: Warnings
     - **Red**: Errors
   - The console auto-scrolls to show the latest logs

4. **Test IAP Initialization:**
   - Open the app and log in
   - The debug console will show all initialization logs with `[INIT]` prefix
   - Look for these key messages:
     - `[INIT] Device ready event fired`
     - `[INIT] CdvPurchase is defined`
     - `[INIT] Store instance obtained`
     - `[INIT] Products registered`
     - `[INIT] store.initialize() completed`
     - `[INIT] Store initialized successfully`

5. **Test Purchase Flow:**
   - Navigate to a purchase page (Premium or Healing Kit)
   - Tap the purchase button
   - The console will show logs with `[BUY_PREMIUM]` or `[BUY_KIT]` prefix
   - Look for:
     - `[BUY_PREMIUM] Store is initialized`
     - `[BUY_PREMIUM] Product found`
     - `[BUY_PREMIUM] Offer found`
     - `[BUY_PREMIUM] Premium purchase initiated successfully`

6. **Take Screenshots:**
   - Take screenshots of the debug console showing:
     - The initialization sequence
     - Any errors or warnings
     - The purchase flow logs
   - Share these screenshots so I can analyze them

7. **Copy Logs:**
   - Tap the "Copy" button in the console header
   - Paste the logs into Notes or Messages
   - Share them for detailed analysis

8. **Clear Logs:**
   - Tap "Clear" to remove old logs and start fresh
   - Useful when testing multiple scenarios

## What to Look For

### ✅ Success Indicators:
- `✅ [INIT] Store initialized successfully with v13 API`
- `✅ [INIT] Premium product:` (shows product details)
- `✅ [BUY_PREMIUM] Premium purchase initiated successfully`
- StoreKit payment sheet appears

### ❌ Failure Indicators:
- `❌ [INIT] CdvPurchase is not defined`
- `❌ [INIT] Failed to initialize Apple IAP`
- `❌ [BUY_PREMIUM] Premium subscription product not found`
- `❌ [BUY_PREMIUM] No offer available`
- Any errors about "Purchase service not initialized"

## Specific Things to Check

When you test, please look for and share:

1. **Does deviceready fire?**
   - Look for: `📱 [INIT] Cordova deviceready event fired`

2. **Is CdvPurchase loaded?**
   - Look for: `✅ [INIT] CdvPurchase is defined`
   - If you see: `❌ [INIT] CdvPurchase is not defined` → Plugin not loaded

3. **Are products registered?**
   - Look for: `✅ [INIT] Products registered`
   - Then: `🔍 [INIT] Store products after registration: [...]`

4. **Does store.initialize() complete?**
   - Look for: `✅ [INIT] store.initialize() completed`
   - Then: `📦 [INIT] Premium product: [product details]`

5. **Are products available?**
   - After initialization, look for product objects with:
     - `id`, `title`, `price`, `description`
   - If products are null or undefined → Products not loaded from App Store Connect

6. **What happens when you tap purchase?**
   - Look for the full `[BUY_PREMIUM]` or `[BUY_KIT]` sequence
   - Does it get to "placing order" or fail before that?

## Next Steps

After testing with the debug console:

1. Take screenshots of the entire initialization sequence
2. Take screenshots of a purchase attempt
3. Copy all logs using the "Copy" button
4. Share the screenshots and logs with me

This will allow me to see exactly where the StoreKit initialization is failing and fix the root cause.

## Removing the Debug Console Later

Once the IAP is working, I can remove the debug console in a future update. For now, it's essential for troubleshooting.
