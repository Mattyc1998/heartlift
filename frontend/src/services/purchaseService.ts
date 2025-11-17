import { Purchases } from '@revenuecat/purchases-capacitor';
import { supabase } from '@/integrations/supabase/client';

// Product IDs matching App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mattyc.heartlift.premium.monthly',
  HEALING_KIT: 'com.mattyc.heartlift.healingkit'
};

class PurchaseService {
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) {
      console.log('Purchase service already initialized');
      return;
    }

    try {
      // Get RevenueCat API key from environment
      const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'appl_sibzKJJEoGylRMhTqXeehSmVWoZ';
      
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });
      
      console.log('✅ RevenueCat initialized for user:', userId);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        const products = offerings.current.availablePackages;
        console.log('✅ Products loaded from RevenueCat:', products.length);
        
        return {
          premium: products.find(p => p.storeProduct.identifier === PRODUCT_IDS.PREMIUM_MONTHLY),
          healingKit: products.find(p => p.storeProduct.identifier === PRODUCT_IDS.HEALING_KIT)
        };
      }

      // Fallback to mock data if no offerings
      console.log('⚠️ No RevenueCat offerings - returning mock products');
      return {
        premium: { id: PRODUCT_IDS.PREMIUM_MONTHLY, price: '$9.99' },
        healingKit: { id: PRODUCT_IDS.HEALING_KIT, price: '$19.99' }
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

      const offerings = await Purchases.getOfferings();
      const premiumPackage = offerings.current?.availablePackages.find(
        p => p.storeProduct.identifier === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      if (!premiumPackage) {
        throw new Error('Premium package not found');
      }

      console.log('🛒 Initiating RevenueCat purchase for:', PRODUCT_IDS.PREMIUM_MONTHLY);
      const purchaseResult = await Purchases.purchasePackage({ aPackage: premiumPackage });

      if (purchaseResult.customerInfo.entitlements.active['premium']) {
        console.log('✅ Premium purchased successfully via RevenueCat');
        await this.syncToSupabase(true, false);
        return { 
          success: true, 
          platform: 'revenuecat', 
          productId: PRODUCT_IDS.PREMIUM_MONTHLY,
          transactionId: purchaseResult.storeTransaction?.transactionIdentifier
        };
      }

      throw new Error('Purchase completed but entitlement not active');
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return null;
      }
      console.error('❌ Purchase failed:', error);
      throw error;
    }
  }

  async purchaseHealingKit() {
    try {
      if (!this.initialized) {
        throw new Error('Purchase service not initialized');
      }

      const offerings = await Purchases.getOfferings();
      const healingKitPackage = offerings.current?.availablePackages.find(
        p => p.storeProduct.identifier === PRODUCT_IDS.HEALING_KIT
      );

      if (!healingKitPackage) {
        throw new Error('Healing Kit package not found');
      }

      console.log('🛒 Initiating RevenueCat purchase for:', PRODUCT_IDS.HEALING_KIT);
      const purchaseResult = await Purchases.purchasePackage({ aPackage: healingKitPackage });

      if (purchaseResult.customerInfo.entitlements.active['healing_kit']) {
        console.log('✅ Healing Kit purchased successfully via RevenueCat');
        await this.syncToSupabase(false, true);
        return { 
          success: true, 
          platform: 'revenuecat', 
          productId: PRODUCT_IDS.HEALING_KIT,
          transactionId: purchaseResult.storeTransaction?.transactionIdentifier
        };
      }

      throw new Error('Purchase completed but entitlement not active');
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return null;
      }
      console.error('❌ Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases() {
    try {
      if (!this.isNativePlatform) {
        console.log('⚠️ Not on native platform - checking Supabase for existing purchases');
        
        // Check Supabase for existing purchases
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const [subResult, kitResult] = await Promise.all([
          supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
          supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
        ]);

        const hasPremium = subResult.data?.subscribed || false;
        const hasHealingKit = kitResult.data?.status === 'completed';

        console.log('✅ Purchases restored from Supabase:', { hasPremium, hasHealingKit });
        return { hasPremium, hasHealingKit, platform: 'web' };
      }

      // On native platform, would use Apple StoreKit to restore
      console.log('📱 Would restore purchases via Apple StoreKit');
      
      // For now, check Supabase as fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const [subResult, kitResult] = await Promise.all([
        supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
        supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
      ]);

      const hasPremium = subResult.data?.subscribed || false;
      const hasHealingKit = kitResult.data?.status === 'completed';

      console.log('✅ Purchases restored (simulated):', { hasPremium, hasHealingKit });
      return { hasPremium, hasHealingKit, platform: 'native' };
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
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
