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
      console.log('🔧 [INIT] Starting _doInitialize()');
      
      // Check if IAP is available (only on native iOS/Android)
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        console.warn('⚠️ [INIT] IAP not available on web platform - mocking initialization');
        this.initialized = true;
        return;
      }

      console.log('📱 [INIT] Running on native platform, isNativePlatform:', window.Capacitor.isNativePlatform());

      // CRITICAL: Wait for deviceready before accessing Cordova plugins
      console.log('⏳ [INIT] Waiting for deviceready...');
      await this.waitForDeviceReady();
      console.log('✅ [INIT] Device ready event fired');

      // Check if CdvPurchase is available
      console.log('🔍 [INIT] Checking if CdvPurchase is defined...');
      console.log('🔍 [INIT] typeof CdvPurchase:', typeof CdvPurchase);
      
      if (typeof CdvPurchase === 'undefined') {
        console.error('❌ [INIT] CdvPurchase is not defined - plugin not loaded');
        throw new Error('cordova-plugin-purchase not loaded');
      }

      console.log('✅ [INIT] CdvPurchase is defined');
      console.log('🔍 [INIT] CdvPurchase object:', CdvPurchase);
      console.log('🔍 [INIT] CdvPurchase.store:', CdvPurchase.store);

      // Get the store instance from cordova-plugin-purchase v13
      this.store = CdvPurchase.store;

      if (!this.store) {
        console.error('❌ [INIT] CdvPurchase.store is null or undefined');
        throw new Error('CdvPurchase.store is not available');
      }

      console.log('✅ [INIT] Store instance obtained:', this.store);
      console.log('🔍 [INIT] Store methods:', Object.keys(this.store));

      // Check if store has required methods
      if (typeof this.store.register !== 'function') {
        console.error('❌ [INIT] store.register is not a function');
        throw new Error('store.register method not available');
      }

      if (typeof this.store.initialize !== 'function') {
        console.error('❌ [INIT] store.initialize is not a function');
        throw new Error('store.initialize method not available');
      }

      console.log('✅ [INIT] Store has required methods');

      // Log product types and platform
      console.log('🔍 [INIT] CdvPurchase.ProductType:', CdvPurchase.ProductType);
      console.log('🔍 [INIT] CdvPurchase.Platform:', CdvPurchase.Platform);

      // Register products using v13 API - MUST be before initialize()
      console.log('📝 [INIT] Registering products...');
      console.log('📝 [INIT] Product 1:', PRODUCT_IDS.PREMIUM_MONTHLY);
      console.log('📝 [INIT] Product 2:', PRODUCT_IDS.HEALING_KIT);
      
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
      console.log('🔍 [INIT] Store products after registration:', this.store.products);

      // Set up event listeners BEFORE initialize() - CRITICAL ORDER
      // NOTE: v13 uses product and receipt update events, not transaction events
      console.log('🎧 [INIT] Setting up event listeners...');
      
      // Listen for product updates (this is the main event in v13)
      this.store.when().productUpdated(async (product: any) => {
        console.log('📦 [EVENT] Product updated:', product.id, 'state:', product.state);
        
        // Check if product is owned (successfully purchased)
        if (product.owned) {
          console.log('✅ [EVENT] Product owned:', product.id);
          
          if (product.id === PRODUCT_IDS.PREMIUM_MONTHLY) {
            console.log('✅ [EVENT] Premium subscription owned');
            await this.syncToSupabase(true, false);
          }
          
          if (product.id === PRODUCT_IDS.HEALING_KIT) {
            console.log('✅ [EVENT] Healing Kit owned');
            await this.syncToSupabase(false, true);
          }
        }
        
        // Check if product expired
        if (product.state === 'expired') {
          console.log('⚠️ [EVENT] Product expired:', product.id);
          if (product.id === PRODUCT_IDS.PREMIUM_MONTHLY) {
            console.log('⚠️ [EVENT] Premium subscription expired - revoking access');
            await this.cancelSubscriptionInSupabase();
          }
        }
      });

      // Listen for receipt updates
      this.store.when().receiptUpdated((receipt: any) => {
        console.log('🧾 [EVENT] Receipt updated:', receipt);
      });

      // Listen for transaction updates (handles approved, finished, etc.)
      this.store.when().transactionUpdated((transaction: any) => {
        console.log('💳 [EVENT] Transaction updated:', transaction.state, 'for product:', transaction.products);
        
        // Auto-finish approved transactions
        if (transaction.state === CdvPurchase.TransactionState.APPROVED) {
          console.log('✅ [EVENT] Transaction approved, finishing...');
          transaction.finish();
        }
        
        if (transaction.state === CdvPurchase.TransactionState.FINISHED) {
          console.log('✅ [EVENT] Transaction finished');
        }
      });

      console.log('✅ [INIT] Event listeners set up');

      // Check StoreKit plugin status BEFORE initialize
      try {
        console.log('🔍 [INIT] Checking StoreKit plugin...');
        const plugin = this.store.getPlugin();
        console.log('🔍 [INIT] Plugin:', plugin);
        if (plugin && plugin.ready) {
          console.log('🔍 [INIT] Plugin ready status:', plugin.ready());
        }
      } catch (pluginError) {
        console.warn('⚠️ [INIT] Could not check plugin status:', pluginError);
      }

      // Initialize the store and wait for it to complete
      // THIS MUST BE CALLED ONLY ONCE AND AFTER REGISTRATION
      console.log('🚀 [INIT] Calling store.initialize() - THIS SHOULD ONLY HAPPEN ONCE');
      console.log('🚀 [INIT] Store state before initialize:', {
        products: this.store.products,
        ready: this.store.ready
      });

      await this.store.initialize();
      
      console.log('✅ [INIT] store.initialize() completed');
      console.log('🔍 [INIT] Store state after initialize:', {
        products: this.store.products,
        ready: this.store.ready
      });
      
      // Log all registered products after initialization
      console.log('📦 [INIT] Checking registered products...');
      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
      console.log('📦 [INIT] Premium product:', premiumProduct);
      console.log('📦 [INIT] Healing Kit product:', healingKitProduct);

      this.initialized = true;
      console.log('✅✅✅ [INIT] Store initialized successfully with v13 API - initialized flag set to TRUE');
    } catch (error) {
      console.error('❌❌❌ [INIT] Failed to initialize Apple IAP:', error);
      console.error('❌ [INIT] Error name:', error?.name);
      console.error('❌ [INIT] Error message:', error?.message);
      console.error('❌ [INIT] Error stack:', error?.stack);
      console.error('❌ [INIT] Full error object:', JSON.stringify(error, null, 2));
      this.initialized = false;
      throw error;
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
    try {
      await this.ensureInitialized();

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.PREMIUM_MONTHLY);
      
      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (!product) {
        throw new Error('Premium product not found');
      }

      // Order the product using v13 API
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available for premium subscription');
      }

      await this.store.order(offer);
      
      console.log('✅ Premium purchase initiated');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Premium purchase failed:', error);
      throw error;
    }
  }

  async purchaseHealingKit() {
    try {
      await this.ensureInitialized();

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.HEALING_KIT);
      
      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      if (!product) {
        throw new Error('Healing Kit product not found');
      }

      // Order the product using v13 API
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available for Healing Kit');
      }

      await this.store.order(offer);
      
      console.log('✅ Healing Kit purchase initiated');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Healing Kit purchase failed:', error);
      throw error;
    }
  }

  /**
   * Check current subscription status from Apple and sync to Supabase
   * Call this on app launch to detect cancelled subscriptions
   */
  async checkSubscriptionStatus() {
    try {
      await this.ensureInitialized();

      console.log('🔍 Checking subscription status from Apple...');
      
      const premiumProduct = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      const hasPremium = premiumProduct?.owned || false;
      const hasHealingKit = healingKitProduct?.owned || false;

      console.log('📊 Current Apple IAP status:', { hasPremium, hasHealingKit });
      
      // Sync current status to Supabase
      await this.syncToSupabase(hasPremium, hasHealingKit);

      return { hasPremium, hasHealingKit };
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return { hasPremium: false, hasHealingKit: false };
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
   * 🚨 CRITICAL: Sync purchase status to SUPABASE
   * This is where subscription data is stored and checked
   */
  private async syncToSupabase(hasPremium: boolean, hasHealingKit: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      console.log('🔄 Syncing purchase status to Supabase...');

      // Update Premium subscription in Supabase
      if (hasPremium) {
        const { error: subError } = await supabase
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
          });
        
        if (subError) {
          console.error('❌ Failed to update premium in Supabase:', subError);
        } else {
          console.log('✅ Premium updated in Supabase');
        }
      }

      // Update Healing Kit in Supabase (healing_kit_purchases table)
      if (hasHealingKit) {
        const { error: kitError } = await supabase
          .from('healing_kit_purchases')
          .upsert({
            user_id: user.id,
            status: 'completed',
            purchased_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (kitError) {
          console.error('❌ Failed to update healing kit in Supabase:', kitError);
        } else {
          console.log('✅ Healing Kit updated in Supabase');
        }
      }

      console.log('✅ All purchases synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync purchases to Supabase:', error);
      throw error;
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
   * Purchase Premium Subscription
   */
  async buyPremium(): Promise<{ success: boolean; error?: string }> {
    console.log('🛒 [BUY_PREMIUM] buyPremium() called');
    try {
      console.log('🛒 [BUY_PREMIUM] Ensuring initialized...');
      await this.ensureInitialized();
      console.log('✅ [BUY_PREMIUM] Store is initialized');

      console.log('🛒 [BUY_PREMIUM] Getting product:', PRODUCT_IDS.PREMIUM_MONTHLY);
      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      console.log('🔍 [BUY_PREMIUM] Product:', product);
      
      if (!product) {
        console.error('❌ [BUY_PREMIUM] Premium subscription product not found');
        throw new Error('Premium subscription product not found');
      }

      console.log('✅ [BUY_PREMIUM] Product found, getting offer...');
      // Request order using v13 API
      const offer = product.getOffer();
      console.log('🔍 [BUY_PREMIUM] Offer:', offer);
      
      if (!offer) {
        console.error('❌ [BUY_PREMIUM] No offer available for premium subscription');
        throw new Error('No offer available for premium subscription');
      }

      console.log('✅ [BUY_PREMIUM] Offer found, placing order...');
      await this.store.order(offer);
      
      console.log('✅✅ [BUY_PREMIUM] Premium purchase initiated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌❌ [BUY_PREMIUM] Premium purchase failed:', error);
      console.error('❌ [BUY_PREMIUM] Error message:', error?.message);
      console.error('❌ [BUY_PREMIUM] Error stack:', error?.stack);
      return { 
        success: false, 
        error: error?.message || 'Failed to purchase premium subscription' 
      };
    }
  }

  /**
   * Purchase Healing Kit
   */
  async buyHealingKit(): Promise<{ success: boolean; error?: string }> {
    console.log('🛒 [BUY_KIT] buyHealingKit() called');
    try {
      console.log('🛒 [BUY_KIT] Ensuring initialized...');
      await this.ensureInitialized();
      console.log('✅ [BUY_KIT] Store is initialized');

      console.log('🛒 [BUY_KIT] Getting product:', PRODUCT_IDS.HEALING_KIT);
      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      console.log('🔍 [BUY_KIT] Product:', product);
      
      if (!product) {
        console.error('❌ [BUY_KIT] Healing Kit product not found');
        throw new Error('Healing Kit product not found');
      }

      console.log('✅ [BUY_KIT] Product found, getting offer...');
      // Request order using v13 API
      const offer = product.getOffer();
      console.log('🔍 [BUY_KIT] Offer:', offer);
      
      if (!offer) {
        console.error('❌ [BUY_KIT] No offer available for Healing Kit');
        throw new Error('No offer available for Healing Kit');
      }

      console.log('✅ [BUY_KIT] Offer found, placing order...');
      await this.store.order(offer);
      
      console.log('✅✅ [BUY_KIT] Healing Kit purchase initiated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌❌ [BUY_KIT] Healing Kit purchase failed:', error);
      console.error('❌ [BUY_KIT] Error message:', error?.message);
      console.error('❌ [BUY_KIT] Error stack:', error?.stack);
      return { 
        success: false, 
        error: error?.message || 'Failed to purchase Healing Kit' 
      };
    }
  }
}

export const purchaseService = new PurchaseService();
