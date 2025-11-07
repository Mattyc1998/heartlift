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
    if (this.initialized) return;

    try {
      // Get RevenueCat API key from env
      const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'appl_YOUR_KEY_HERE';
      
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId
      });

      this.initialized = true;
      console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }

  async purchasePremium() {
    try {
      const offerings = await this.getProducts();
      if (!offerings) throw new Error('No products available');

      const premiumPackage = offerings.availablePackages.find(
        pkg => pkg.product.identifier === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      if (!premiumPackage) throw new Error('Premium subscription not found');

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: premiumPackage });
      console.log('✅ Premium purchased successfully:', customerInfo);

      // 🚨 SYNC TO SUPABASE (NOT MongoDB)
      await this.syncToSupabase(true, false);

      return customerInfo;
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
      const offerings = await this.getProducts();
      if (!offerings) throw new Error('No products available');

      const healingKitPackage = offerings.availablePackages.find(
        pkg => pkg.product.identifier === PRODUCT_IDS.HEALING_KIT
      );

      if (!healingKitPackage) throw new Error('Healing Kit not found');

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: healingKitPackage });
      console.log('✅ Healing Kit purchased successfully:', customerInfo);

      // 🚨 SYNC TO SUPABASE (NOT MongoDB)
      await this.syncToSupabase(false, true);

      return customerInfo;
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
      const { customerInfo } = await Purchases.restorePurchases();
      console.log('✅ Purchases restored:', customerInfo);

      // Check what was restored and sync to Supabase
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      const hasHealingKit = customerInfo.nonSubscriptionTransactions.some(
        tx => tx.productIdentifier === PRODUCT_IDS.HEALING_KIT
      );

      await this.syncToSupabase(hasPremium, hasHealingKit);

      return customerInfo;
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
      if (!user) {
        console.warn('No user logged in, cannot sync');
        return;
      }

      console.log(`🔄 Syncing to Supabase: Premium=${hasPremium}, HealingKit=${hasHealingKit}`);

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

      // Update Healing Kit in Supabase
      if (hasHealingKit) {
        const { error: kitError } = await supabase
          .from('user_healing_kits')
          .upsert({
            user_id: user.id,
            purchased: true
          });
        
        if (kitError) {
          console.error('❌ Failed to update healing kit in Supabase:', kitError);
        } else {
          console.log('✅ Healing Kit updated in Supabase');
        }
      }

      console.log('✅ Successfully synced to Supabase!');
    } catch (error) {
      console.error('❌ Failed to sync to Supabase:', error);
      // Don't throw - purchase was successful, sync can be retried
    }
  }
}

export const purchaseService = new PurchaseService();
