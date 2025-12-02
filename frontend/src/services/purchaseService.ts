import { supabase } from '@/integrations/supabase/client';

// Use the native cordova-plugin-purchase v13 API
declare const CdvPurchase: any;

// Product IDs matching App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mattyc.heartlift.premium.monthly',
  HEALING_KIT: 'com.mattyc.heartlift.healingkit'
};

class PurchaseService {
  private initialized = false;
  private userId: string = '';
  private store: any = null;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) {
      console.log('Purchase service already initialized');
      return;
    }

    console.log('🔧 Initializing purchase service for user:', userId);
    this.userId = userId;

    try {
      // Check if IAP is available (only on native iOS/Android)
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        console.warn('⚠️ IAP not available on web platform - mocking initialization');
        this.initialized = true;
        return;
      }

      // Check if CdvPurchase is available
      if (typeof CdvPurchase === 'undefined') {
        console.error('❌ CdvPurchase is not defined - plugin not loaded');
        throw new Error('cordova-plugin-purchase not loaded');
      }

      console.log('📱 Running on native platform, setting up IAP with v13 API...');

      // Get the store instance from cordova-plugin-purchase v13
      this.store = CdvPurchase.store;

      if (!this.store) {
        throw new Error('CdvPurchase.store is not available');
      }

      console.log('✅ Store instance obtained:', this.store);

      // Register products using v13 API
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

      console.log('✅ Products registered');

      // Set up event listeners using v13 API
      this.store.when()
        .approved(async (transaction: any) => {
          console.log('✅ Transaction approved:', transaction);
          
          // Check which product was purchased
          const isPremium = transaction.products.some((p: any) => p.id === PRODUCT_IDS.PREMIUM_MONTHLY);
          const isHealingKit = transaction.products.some((p: any) => p.id === PRODUCT_IDS.HEALING_KIT);
          
          if (isPremium) {
            console.log('✅ Premium subscription approved');
            await this.syncToSupabase(true, false);
          }
          
          if (isHealingKit) {
            console.log('✅ Healing Kit purchase approved');
            await this.syncToSupabase(false, true);
          }
          
          // Finish the transaction
          await transaction.finish();
        })
        .verified((receipt: any) => {
          console.log('✅ Receipt verified:', receipt);
        })
        .unverified((receipt: any) => {
          console.error('❌ Receipt unverified:', receipt);
        })
        .cancelled((transaction: any) => {
          console.log('❌ Transaction cancelled:', transaction);
        })
        .error((error: any) => {
          console.error('❌ Transaction error:', error);
        });

      // Handle expired subscriptions
      this.store.when()
        .expired(async (product: any) => {
          console.log('⚠️ Product expired:', product);
          if (product.id === PRODUCT_IDS.PREMIUM_MONTHLY) {
            console.log('⚠️ Premium subscription expired - revoking access');
            await this.cancelSubscriptionInSupabase();
          }
        });

      // Initialize the store
      await this.store.initialize();
      
      console.log('✅ Apple IAP initialized successfully with v13 API');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Apple IAP:', error);
      console.error('Error details:', error);
      throw error; // Don't mark as initialized if it fails
    }
  }

  async getProducts() {
    try {
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

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
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.PREMIUM_MONTHLY);
      
      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (!product) {
        throw new Error('Premium product not found');
      }

      // Order the product using v13 API
      const offer = product.getOffer();
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
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.HEALING_KIT);
      
      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      if (!product) {
        throw new Error('Healing Kit product not found');
      }

      // Order the product using v13 API
      const offer = product.getOffer();
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
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

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
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

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
    try {
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating premium purchase...');
      
      const product = this.store.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      
      if (!product) {
        throw new Error('Premium subscription product not found');
      }

      // Request order using v13 API
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available for premium subscription');
      }

      await this.store.order(offer);
      
      console.log('✅ Premium purchase initiated');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Premium purchase failed:', error);
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
    try {
      if (!this.initialized || !this.store) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating healing kit purchase...');
      
      const product = this.store.get(PRODUCT_IDS.HEALING_KIT);
      
      if (!product) {
        throw new Error('Healing Kit product not found');
      }

      // Request order using v13 API
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available for Healing Kit');
      }

      await this.store.order(offer);
      
      console.log('✅ Healing Kit purchase initiated');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Healing Kit purchase failed:', error);
      return { 
        success: false, 
        error: error?.message || 'Failed to purchase Healing Kit' 
      };
    }
  }
}

export const purchaseService = new PurchaseService();
