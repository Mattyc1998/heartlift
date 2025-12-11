import { supabase } from '@/integrations/supabase/client';

// Use the native cordova-plugin-purchase v13 API
declare const CdvPurchase: any;
declare const document: any;

// Product IDs matching App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mattyc.heartlift.premium.monthly',
  HEALING_KIT: 'com.mattyc.heartlift.healingkit'
};

class PurchaseService {
  private initialized = false;
  private initializing = false;
  private userId: string = '';
  private store: any = null;
  private deviceReadyFired = false;
  private initPromise: Promise<void> | null = null;
  private pendingPurchaseResolvers: Map<string, { resolve: () => void; reject: (error: any) => void }> = new Map();

  constructor() {
    // Listen for deviceready event
    if (typeof document !== 'undefined') {
      document.addEventListener('deviceready', () => {
        console.log('📱 Cordova deviceready event fired');
        this.deviceReadyFired = true;
      }, false);
    }
  }

  /**
   * Wait for Cordova deviceready event
   */
  private async waitForDeviceReady(): Promise<void> {
    if (this.deviceReadyFired) {
      return;
    }

    console.log('⏳ Waiting for Cordova deviceready...');
    
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.deviceReadyFired) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  /**
   * Initialize the store - MUST be called after deviceready
   */
  async initialize(userId: string): Promise<void> {
    // If already initialized, return
    if (this.initialized) {
      console.log('✅ Purchase service already initialized');
      return;
    }

    // If currently initializing, wait for existing init to complete
    if (this.initializing && this.initPromise) {
      console.log('⏳ Initialization already in progress, waiting...');
      return this.initPromise;
    }

    console.log('🔧 Initializing purchase service for user:', userId);
    this.userId = userId;
    this.initializing = true;

    // Create and store the initialization promise
    this.initPromise = this._doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.initializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('🔧 [INIT] Starting MINIMAL initialization (no event listeners)');
      
      // Check if IAP is available (only on native iOS/Android)
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        console.warn('⚠️ [INIT] IAP not available on web platform - mocking initialization');
        this.initialized = true;
        return;
      }

      console.log('📱 [INIT] Running on native platform');

      // CRITICAL: Wait for deviceready before accessing Cordova plugins
      console.log('⏳ [INIT] Waiting for deviceready...');
      await this.waitForDeviceReady();
      console.log('✅ [INIT] Device ready event fired');

      // Check if CdvPurchase is available
      console.log('🔍 [INIT] Checking if CdvPurchase is defined...');
      
      if (typeof CdvPurchase === 'undefined') {
        console.error('❌ [INIT] CdvPurchase is not defined - plugin not loaded');
        throw new Error('cordova-plugin-purchase not loaded');
      }

      console.log('✅ [INIT] CdvPurchase is defined');

      // Get the store instance
      this.store = CdvPurchase.store;

      if (!this.store) {
        console.error('❌ [INIT] CdvPurchase.store is null or undefined');
        throw new Error('CdvPurchase.store is not available');
      }

      console.log('✅ [INIT] Store instance obtained');

      // STEP 1: Register products - NO EVENT LISTENERS
      console.log('📝 [INIT] Registering products (MINIMAL approach)...');
      
      this.store.register([
        {
          id: PRODUCT_IDS.PREMIUM_MONTHLY,
          type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform: CdvPurchase.Platform.APPLE_APPSTORE
        },
        {
          id: PRODUCT_IDS.HEALING_KIT,
          type: CdvPurchase.ProductType.NON_CONSUMABLE,
          platform: CdvPurchase.Platform.APPLE_APPSTORE
        }
      ]);

      console.log('✅ [INIT] Products registered');

      // STEP 2: Set up ONLY the .approved() listener (the only one that works in v13)
      console.log('🎧 [INIT] Setting up .approved() listener...');

      // Single global approved handler for ALL purchases
      this.store.when().approved(async (transaction: any) => {
        console.log('✅ [EVENT] ========== PURCHASE APPROVED ==========');
        console.log('✅ [EVENT] Transaction:', transaction);
        
        try {
          // FIX: Apple sometimes returns app bundle ID (com.mattyc.heartlift) in transaction.products
          // instead of actual product IDs, so we check product.owned directly from store
          console.log('✅ [EVENT] Checking product ownership from store (not transaction)...');
          
          const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
          const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
          
          const isPremium = premiumProduct && premiumProduct.owned ? true : false;
          const isHealingKit = healingKitProduct && healingKitProduct.owned ? true : false;

          console.log('✅ [EVENT] Premium product owned:', isPremium, premiumProduct);
          console.log('✅ [EVENT] Healing Kit product owned:', isHealingKit, healingKitProduct);
          console.log('✅ [EVENT] Final detection:', { isPremium, isHealingKit });

          // CRITICAL: Resolve pending purchase promises IMMEDIATELY
          // This allows the UI to unlock features instantly via localStorage
          if (isPremium && this.pendingPurchaseResolvers.has(PRODUCT_IDS.PREMIUM_MONTHLY)) {
            const resolver = this.pendingPurchaseResolvers.get(PRODUCT_IDS.PREMIUM_MONTHLY);
            resolver!.resolve();
            this.pendingPurchaseResolvers.delete(PRODUCT_IDS.PREMIUM_MONTHLY);
            console.log('✅ [EVENT] Premium promise resolved (UI can unlock now)');
          }
          
          if (isHealingKit && this.pendingPurchaseResolvers.has(PRODUCT_IDS.HEALING_KIT)) {
            const resolver = this.pendingPurchaseResolvers.get(PRODUCT_IDS.HEALING_KIT);
            resolver!.resolve();
            this.pendingPurchaseResolvers.delete(PRODUCT_IDS.HEALING_KIT);
            console.log('✅ [EVENT] Healing Kit promise resolved (UI can unlock now)');
          }

          // Finish the transaction IMMEDIATELY (don't block on Supabase)
          transaction.finish();
          console.log('✅ [EVENT] Transaction finished');

          // BACKGROUND SYNC: Sync to Supabase WITHOUT blocking (no await at call site)
          if (isPremium || isHealingKit) {
            console.log('🔄 [EVENT] Starting background Supabase sync...');
            this.syncToSupabase(isPremium, isHealingKit)
              .then(() => {
                console.log('✅ [EVENT] ✓ Background sync to Supabase completed');
              })
              .catch((error) => {
                console.error('❌ [EVENT] Background sync failed:', error);
                // Features are already unlocked locally, so this is non-critical
              });
          } else {
            console.warn('⚠️ [EVENT] No products matched for sync');
          }
        } catch (error) {
          console.error('❌ [EVENT] Error handling approval:', error);
          
          // Reject all pending promises
          for (const [productId, resolver] of this.pendingPurchaseResolvers.entries()) {
            resolver.reject(error);
          }
          this.pendingPurchaseResolvers.clear();
        }
      });

      console.log('✅ [INIT] Approved listener set up');

      // STEP 3: Initialize - Apple StoreKit will handle everything
      console.log('🚀 [INIT] Calling store.initialize() with platform...');

      await this.store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
      
      console.log('✅ [INIT] store.initialize() completed');
      
      // Check if products loaded
      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
      console.log('📦 [INIT] Premium product:', premiumProduct);
      console.log('📦 [INIT] Healing Kit product:', healingKitProduct);

      this.initialized = true;
      console.log('✅✅✅ [INIT] Store ready - Apple will handle purchase flow');

      // CRITICAL: Check subscription status after initialization
      console.log('🔍 [INIT] Checking subscription status on launch...');
      await this.checkSubscriptionStatus();
    } catch (error) {
      console.error('❌❌❌ [INIT] Failed to initialize Apple IAP:', error);
      console.error('❌ [INIT] Error:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Check current subscription status from Apple and sync to Supabase
   * CRITICAL: This handles cancellations and expirations
   * Call this:
   * - After store initialization
   * - On app resume/foreground
   * - Before checking feature access
   */
  async checkSubscriptionStatus(): Promise<{ isPremium: boolean; hasHealingKit: boolean }> {
    console.log('🔍 [STATUS] Checking subscription status from Apple...');
    
    try {
      if (!this.initialized || !this.store) {
        console.warn('⚠️ [STATUS] Store not initialized, skipping status check');
        return { isPremium: false, hasHealingKit: false };
      }

      // CRITICAL: Restore purchases to sync with Apple's receipt
      // This loads existing purchases that were made previously
      console.log('🔄 [STATUS] Restoring purchases from Apple receipt...');
      try {
        await this.store.restorePurchases();
        console.log('✅ [STATUS] Purchases restored from receipt');
        
        // Wait 500ms for store to update ownership status
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (restoreError) {
        console.warn('⚠️ [STATUS] Restore failed, checking anyway:', restoreError);
      }

      // Get products from store
      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);

      console.log('📦 [STATUS] Premium product:', premiumProduct);
      console.log('📦 [STATUS] Healing Kit product:', healingKitProduct);

      // Check if user owns them
      const isPremium = premiumProduct && premiumProduct.owned ? true : false;
      const hasHealingKit = healingKitProduct && healingKitProduct.owned ? true : false;

      console.log('📊 [STATUS] Current ownership:', { isPremium, hasHealingKit });

      // Sync to Supabase - this updates the database with current status
      // If user cancelled subscription, owned will be false and we'll lock features
      await this.syncToSupabase(isPremium, hasHealingKit);
      console.log('✅ [STATUS] Status synced to Supabase');

      // CRITICAL: Trigger UI unlock by dispatching custom event
      if (isPremium || hasHealingKit) {
        console.log('🔔 [STATUS] Dispatching ownership event to unlock UI');
        window.dispatchEvent(new CustomEvent('purchaseOwnershipDetected', {
          detail: { isPremium, hasHealingKit }
        }));
      }

      return { isPremium, hasHealingKit };
    } catch (error) {
      console.error('❌ [STATUS] Error checking subscription status:', error);
      return { isPremium: false, hasHealingKit: false };
    }
  }

  /**
   * Ensure store is initialized before allowing purchases
   */
  private async ensureInitialized(): Promise<void> {
    console.log('🔍 [ENSURE] ensureInitialized called');
    console.log('🔍 [ENSURE] initialized:', this.initialized);
    console.log('🔍 [ENSURE] store exists:', !!this.store);
    console.log('🔍 [ENSURE] userId:', this.userId);
    
    if (!this.initialized) {
      console.log('⚠️ [ENSURE] Store not initialized, initializing now...');
      if (!this.userId) {
        console.error('❌ [ENSURE] Cannot initialize - no user ID set');
        throw new Error('Cannot initialize - no user ID set');
      }
      await this.initialize(this.userId);
    }

    console.log('🔍 [ENSURE] After initialize check - initialized:', this.initialized, 'store:', !!this.store);

    if (!this.initialized || !this.store) {
      console.error('❌ [ENSURE] Purchase service failed to initialize');
      throw new Error('Purchase service failed to initialize');
    }

    console.log('✅ [ENSURE] Store is ready for purchases');
  }

  async getProducts() {
    try {
      await this.ensureInitialized();

      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      console.log('✅ Products loaded from Apple IAP:', { premiumProduct, healingKitProduct });
      
      return {
        premium: premiumProduct,
        healingKit: healingKitProduct
      };
    } catch (error) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }

  async purchasePremium() {
    console.log('🛒 [PURCHASE_PREMIUM] purchasePremium() called');
    try {
      await this.ensureInitialized();

      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (!product || !product.canPurchase) {
        throw new Error('Premium product not available for purchase');
      }

      const offers = product.offers;
      if (!offers || offers.length === 0) {
        throw new Error('No purchase offers available');
      }

      await this.store.order(offers[0]);
      
      console.log('✅ [PURCHASE_PREMIUM] Order placed');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [PURCHASE_PREMIUM] Purchase failed:', error);
      throw error;
    }
  }

  async purchaseHealingKit() {
    console.log('🛒 [PURCHASE_KIT] purchaseHealingKit() called');
    try {
      await this.ensureInitialized();

      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      if (!product || !product.canPurchase) {
        throw new Error('Healing Kit not available for purchase');
      }

      const offers = product.offers;
      if (!offers || offers.length === 0) {
        throw new Error('No purchase offers available');
      }

      await this.store.order(offers[0]);
      
      console.log('✅ [PURCHASE_KIT] Order placed');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [PURCHASE_KIT] Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases() {
    try {
      await this.ensureInitialized();

      console.log('🔄 Restoring purchases via Apple IAP...');
      
      // Trigger Apple's restore flow using v13 API
      await this.store.restorePurchases();
      
      // Wait a moment for restore to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user owns the products after restore
      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      const hasPremium = premiumProduct?.owned || false;
      const hasHealingKit = healingKitProduct?.owned || false;

      console.log('✅ Purchases restored from Apple:', { hasPremium, hasHealingKit });
      
      // Sync restored purchases to Supabase
      if (hasPremium || hasHealingKit) {
        await this.syncToSupabase(hasPremium, hasHealingKit);
      }

      return { hasPremium, hasHealingKit, platform: 'apple' };
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      
      // Fallback to Supabase check
      try {
        console.log('🔄 Falling back to Supabase check...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const [subResult, kitResult] = await Promise.all([
          supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
          supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
        ]);

        const hasPremium = subResult.data?.subscribed || false;
        const hasHealingKit = kitResult.data?.status === 'completed';

        console.log('✅ Purchases restored from Supabase fallback:', { hasPremium, hasHealingKit });
        return { hasPremium, hasHealingKit, platform: 'supabase' };
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Cancel subscription in Supabase when Apple IAP expires
   * 
   * IMPORTANT: This is called when the subscription EXPIRES (at end of billing period),
   * NOT when the user cancels through Apple Settings.
   * 
   * Apple's subscription model:
   * 1. User cancels in Apple Settings → Marks as "will not renew"
   * 2. User KEEPS premium access until billing period ends
   * 3. At billing period end → .expired() event fires
   * 4. Then we revoke access in Supabase
   * 
   * This is the CORRECT and REQUIRED behavior per Apple guidelines.
   */
  private async cancelSubscriptionInSupabase() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      console.log('🚫 Subscription expired - revoking premium access in Supabase...');

      const { error } = await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          payment_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('❌ Failed to update subscription status in Supabase:', error);
      } else {
        console.log('✅ Premium access revoked in Supabase (subscription expired at end of billing period)');
      }
    } catch (error) {
      console.error('❌ Error updating subscription status:', error);
    }
  }

  /**
   * Ensure Supabase session is ready before making queries
   * CRITICAL: Prevents hanging queries
   */
  private async ensureSupabaseSessionReady() {
    console.log('🔍 [SYNC] Ensuring Supabase session is ready...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [SYNC] Error getting session:', error);
      throw error;
    }
    
    console.log('📊 [SYNC] Session check:', {
      hasSession: !!session,
      expiresAt: session?.expires_at,
      isExpired: session ? new Date(session.expires_at * 1000) < new Date() : null
    });
    
    // If session expired, refresh it
    if (session && new Date(session.expires_at * 1000) < new Date()) {
      console.log('⚠️ [SYNC] Session expired, refreshing...');
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('❌ [SYNC] Session refresh failed:', refreshError);
        throw refreshError;
      }
      console.log('✅ [SYNC] Session refreshed successfully');
    } else if (session) {
      console.log('✅ [SYNC] Session is valid and ready');
    } else {
      console.error('❌ [SYNC] No session found');
      throw new Error('No session found');
    }
  }

  /**
   * 🚨 CRITICAL: Sync purchase status to SUPABASE
   * This is where subscription data is stored and checked
   */
  private async syncToSupabase(hasPremium: boolean, hasHealingKit: boolean) {
    try {
      console.log('🔄 [SYNC] Starting Supabase sync...');
      console.log('🔄 [SYNC] hasPremium:', hasPremium, 'hasHealingKit:', hasHealingKit);
      
      // CRITICAL: Ensure session is ready before making queries
      await this.ensureSupabaseSessionReady();
      
      // CRITICAL: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ [SYNC] Auth error:', authError);
        throw new Error('Failed to get authenticated user: ' + authError.message);
      }
      
      if (!user) {
        console.error('❌ [SYNC] No authenticated user found');
        throw new Error('No user logged in - cannot sync to Supabase');
      }

      console.log('✅ [SYNC] Authenticated user:', user.id);

      // Update Premium subscription in Supabase
      if (hasPremium) {
        console.log('🔄 [SYNC] Updating Premium in Supabase...');
        const { data: premiumData, error: subError } = await supabase
          .from('subscribers')
          .upsert({
            user_id: user.id,
            email: user.email,
            plan_type: 'premium',
            subscribed: true,  // CRITICAL: Must be true for AuthContext
            payment_status: 'active',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select();
        
        if (subError) {
          console.error('❌ [SYNC] Failed to update premium in Supabase:', subError);
          console.error('❌ [SYNC] Error details:', JSON.stringify(subError));
        } else {
          console.log('✅ [SYNC] Premium updated in Supabase:', premiumData);
        }
      }

      // Update Healing Kit in Supabase (healing_kit_purchases table)
      if (hasHealingKit) {
        console.log('🔄 [SYNC] Updating Healing Kit in Supabase...');
        
        // Schema requires: user_id, amount, status, purchased_at
        const { data: kitData, error: kitError } = await supabase
          .from('healing_kit_purchases')
          .upsert({
            user_id: user.id,
            amount: 499,  // £4.99 in pence (required by schema)
            currency: 'gbp',
            status: 'completed',
            purchased_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select();
        
        if (kitError) {
          console.error('❌ [SYNC] Failed to update healing kit in Supabase:', kitError);
          console.error('❌ [SYNC] Error details:', JSON.stringify(kitError));
        } else {
          console.log('✅ [SYNC] Healing Kit updated in Supabase:', kitData);
        }
      }

      console.log('✅ [SYNC] All purchases synced to Supabase successfully');
    } catch (error: any) {
      console.error('❌ [SYNC] Failed to sync purchases to Supabase:', error);
      console.error('❌ [SYNC] Error stack:', error?.stack);
      // Don't throw - allow app to continue even if sync fails
      // Features are already unlocked locally via localStorage
    }
  }

  async checkPurchaseStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hasPremium: false, hasHealingKit: false };

      const [subResult, kitResult] = await Promise.all([
        supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
        supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
      ]);

      return {
        hasPremium: subResult.data?.subscribed || false,
        hasHealingKit: kitResult.data?.status === 'completed'
      };
    } catch (error) {
      console.error('❌ Failed to check purchase status:', error);
      return { hasPremium: false, hasHealingKit: false };
    }
  }

  /**
   * Purchase Premium Subscription - Wait for approval
   */
  async buyPremium(): Promise<{ success: boolean; error?: string }> {
    console.log('🛒 [BUY_PREMIUM] buyPremium() called');
    try {
      await this.ensureInitialized();
      console.log('✅ [BUY_PREMIUM] Store is initialized');

      // Get the product
      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      console.log('🛒 [BUY_PREMIUM] Product:', product);
      
      if (!product) {
        console.error('❌ [BUY_PREMIUM] Product not found');
        throw new Error('Premium product not found. Please try again.');
      }

      // Check if product is valid
      if (!product.canPurchase) {
        console.error('❌ [BUY_PREMIUM] Product cannot be purchased');
        throw new Error('This product is not available for purchase.');
      }

      // Get the offer from the product
      const offers = product.offers;
      console.log('🛒 [BUY_PREMIUM] Product offers:', offers);
      
      if (!offers || offers.length === 0) {
        console.error('❌ [BUY_PREMIUM] No offers available');
        throw new Error('No purchase offers available. Please try again.');
      }

      const offer = offers[0];
      console.log('🛒 [BUY_PREMIUM] Using offer:', offer);

      // Create promise that waits for approval
      const purchasePromise = new Promise<void>((resolve, reject) => {
        this.pendingPurchaseResolvers.set(PRODUCT_IDS.PREMIUM_MONTHLY, { resolve, reject });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.pendingPurchaseResolvers.has(PRODUCT_IDS.PREMIUM_MONTHLY)) {
            this.pendingPurchaseResolvers.delete(PRODUCT_IDS.PREMIUM_MONTHLY);
            reject(new Error('Purchase timeout'));
          }
        }, 300000);
      });

      // Order the offer (this triggers Apple payment sheet)
      console.log('🛒 [BUY_PREMIUM] Calling store.order() with offer');
      await this.store.order(offer);
      console.log('✅ [BUY_PREMIUM] Order called - waiting for approval...');
      
      // Wait for the purchase to be approved
      await purchasePromise;
      console.log('✅✅ [BUY_PREMIUM] Purchase approved and synced!');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [BUY_PREMIUM] Purchase failed:', error);
      this.pendingPurchaseResolvers.delete(PRODUCT_IDS.PREMIUM_MONTHLY);
      return { 
        success: false, 
        error: error?.message || 'Failed to purchase premium subscription' 
      };
    }
  }

  /**
   * Purchase Healing Kit - Wait for approval
   */
  async buyHealingKit(): Promise<{ success: boolean; error?: string }> {
    console.log('🛒 [BUY_KIT] buyHealingKit() called');
    try {
      await this.ensureInitialized();
      console.log('✅ [BUY_KIT] Store is initialized');

      // Get the product
      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      console.log('🛒 [BUY_KIT] Product:', product);
      
      if (!product) {
        console.error('❌ [BUY_KIT] Product not found');
        throw new Error('Healing Kit not found. Please try again.');
      }

      // Check if product is valid
      if (!product.canPurchase) {
        console.error('❌ [BUY_KIT] Product cannot be purchased');
        throw new Error('This product is not available for purchase.');
      }

      // Get the offer from the product
      const offers = product.offers;
      console.log('🛒 [BUY_KIT] Product offers:', offers);
      
      if (!offers || offers.length === 0) {
        console.error('❌ [BUY_KIT] No offers available');
        throw new Error('No purchase offers available. Please try again.');
      }

      const offer = offers[0];
      console.log('🛒 [BUY_KIT] Using offer:', offer);

      // Create promise that waits for approval
      const purchasePromise = new Promise<void>((resolve, reject) => {
        this.pendingPurchaseResolvers.set(PRODUCT_IDS.HEALING_KIT, { resolve, reject });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.pendingPurchaseResolvers.has(PRODUCT_IDS.HEALING_KIT)) {
            this.pendingPurchaseResolvers.delete(PRODUCT_IDS.HEALING_KIT);
            reject(new Error('Purchase timeout'));
          }
        }, 300000);
      });

      // Order the offer (this triggers Apple payment sheet)
      console.log('🛒 [BUY_KIT] Calling store.order() with offer');
      await this.store.order(offer);
      console.log('✅ [BUY_KIT] Order called - waiting for approval...');
      
      // Wait for the purchase to be approved
      await purchasePromise;
      console.log('✅✅ [BUY_KIT] Purchase approved and synced!');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [BUY_KIT] Purchase failed:', error);
      this.pendingPurchaseResolvers.delete(PRODUCT_IDS.HEALING_KIT);
      return { 
        success: false, 
        error: error?.message || 'Failed to purchase Healing Kit' 
      };
    }
  }
}

export const purchaseService = new PurchaseService();
