import { InAppPurchase2 as IAP } from '@awesome-cordova-plugins/in-app-purchase-2';
import { supabase } from '@/integrations/supabase/client';

// Product IDs matching App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mattyc.heartlift.premium.monthly',
  HEALING_KIT: 'com.mattyc.heartlift.healingkit'
};

class PurchaseService {
  private initialized = false;
  private userId: string = '';

  async initialize(userId: string): Promise<void> {
    if (this.initialized) {
      console.log('Purchase service already initialized');
      return;
    }

    try {
      this.userId = userId;
      
      // Register products with Apple IAP
      IAP.register([
        {
          id: PRODUCT_IDS.PREMIUM_MONTHLY,
          type: IAP.PAID_SUBSCRIPTION
        },
        {
          id: PRODUCT_IDS.HEALING_KIT,
          type: IAP.NON_CONSUMABLE
        }
      ]);

      // Set up event handlers for Premium Subscription
      IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).approved(async (product: any) => {
        console.log('✅ Premium subscription approved');
        await this.syncToSupabase(true, false);
        product.finish();
      });

      IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).cancelled(() => {
        console.log('❌ Premium purchase cancelled by user');
      });

      IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).error((error: any) => {
        console.error('❌ Premium purchase error:', error);
      });

      IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).expired(async () => {
        console.log('⚠️ Premium subscription expired');
        await this.cancelSubscriptionInSupabase();
      });

      IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).restored(async (product: any) => {
        console.log('🔄 Premium subscription restored');
        await this.syncToSupabase(true, false);
        product.finish();
      });

      // Set up event handlers for Healing Kit
      IAP.when(PRODUCT_IDS.HEALING_KIT).approved(async (product: any) => {
        console.log('✅ Healing Kit purchase approved');
        await this.syncToSupabase(false, true);
        product.finish();
      });

      IAP.when(PRODUCT_IDS.HEALING_KIT).cancelled(() => {
        console.log('❌ Healing Kit purchase cancelled by user');
      });

      IAP.when(PRODUCT_IDS.HEALING_KIT).error((error: any) => {
        console.error('❌ Healing Kit purchase error:', error);
      });

      IAP.when(PRODUCT_IDS.HEALING_KIT).restored(async (product: any) => {
        console.log('🔄 Healing Kit restored');
        await this.syncToSupabase(false, true);
        product.finish();
      });

      // Refresh products
      IAP.refresh();
      
      console.log('✅ Apple IAP initialized for user:', userId);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Apple IAP:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      const premiumProduct = IAP.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = IAP.get(PRODUCT_IDS.HEALING_KIT);
      
      console.log('✅ Products loaded from Apple IAP');
      
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
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.PREMIUM_MONTHLY);
      
      return new Promise((resolve, reject) => {
        IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).approved(async (product: any) => {
          console.log('✅ Premium subscription approved');
          await this.syncToSupabase(true, false);
          product.finish();
          resolve({ 
            success: true, 
            platform: 'apple', 
            productId: PRODUCT_IDS.PREMIUM_MONTHLY,
            transactionId: product.transaction?.id
          });
        });

        IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).cancelled(() => {
          console.log('User cancelled purchase');
          resolve(null);
        });

        IAP.when(PRODUCT_IDS.PREMIUM_MONTHLY).error((error: any) => {
          console.error('❌ Premium purchase failed:', error);
          reject(error);
        });

        // Trigger purchase
        IAP.order(PRODUCT_IDS.PREMIUM_MONTHLY);
      });
    } catch (error: any) {
      console.error('❌ Premium purchase failed:', error);
      throw error;
    }
  }

  async purchaseHealingKit() {
    try {
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🛒 Initiating Apple IAP purchase for:', PRODUCT_IDS.HEALING_KIT);
      
      return new Promise((resolve, reject) => {
        IAP.when(PRODUCT_IDS.HEALING_KIT).approved(async (product: any) => {
          console.log('✅ Healing Kit purchased successfully');
          await this.syncToSupabase(false, true);
          product.finish();
          resolve({ 
            success: true, 
            platform: 'apple', 
            productId: PRODUCT_IDS.HEALING_KIT,
            transactionId: product.transaction?.id
          });
        });

        IAP.when(PRODUCT_IDS.HEALING_KIT).cancelled(() => {
          console.log('User cancelled purchase');
          resolve(null);
        });

        IAP.when(PRODUCT_IDS.HEALING_KIT).error((error: any) => {
          console.error('❌ Healing Kit purchase failed:', error);
          reject(error);
        });

        // Trigger purchase
        IAP.order(PRODUCT_IDS.HEALING_KIT);
      });
    } catch (error: any) {
      console.error('❌ Healing Kit purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases() {
    try {
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      console.log('🔄 Restoring purchases via Apple IAP...');
      
      // Trigger Apple's restore flow
      // This will fire the .restored() handlers we set up in initialize()
      IAP.restore();
      
      // Wait a moment for restore to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user owns the products after restore
      const premiumProduct = IAP.get(PRODUCT_IDS.PREMIUM_MONTHLY);
      const healingKitProduct = IAP.get(PRODUCT_IDS.HEALING_KIT);
      
      const hasPremium = premiumProduct.owned;
      const hasHealingKit = healingKitProduct.owned;

      console.log('✅ Purchases restored from Apple:', { hasPremium, hasHealingKit });
      
      // Sync restored purchases to Supabase
      if (hasPremium || hasHealingKit) {
        await this.syncToSupabase(hasPremium, hasHealingKit);
      }

      return { hasPremium, hasHealingKit, platform: 'revenuecat' };
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
}

export const purchaseService = new PurchaseService();
