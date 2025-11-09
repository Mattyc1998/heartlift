import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Product IDs
const PREMIUM_PRODUCT_ID = 'com.mattyc.heartlift.premium.monthly';
const HEALING_KIT_PRODUCT_ID = 'com.mattyc.heartlift.healingkit';

class PurchaseService {
  private initialized = false;
  private isNativePlatform = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) {
      console.log('Purchase service already initialized');
      return;
    }

    try {
      this.isNativePlatform = Capacitor.isNativePlatform();
      
      if (!this.isNativePlatform) {
        console.log('⚠️ Not on native platform - IAP disabled');
        this.initialized = true;
        return;
      }

      console.log('✅ Purchase service initialized for user:', userId);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize purchase service:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      if (!this.isNativePlatform) {
        console.log('⚠️ Not on native platform - returning mock products');
        return {
          premium: { id: PREMIUM_PRODUCT_ID, price: '$9.99' },
          healingKit: { id: HEALING_KIT_PRODUCT_ID, price: '$19.99' }
        };
      }

      // On native platform, we would use Apple StoreKit
      // For now, return mock data until native implementation
      console.log('📱 Native platform detected - would use StoreKit');
      return {
        premium: { id: PREMIUM_PRODUCT_ID, price: '$9.99' },
        healingKit: { id: HEALING_KIT_PRODUCT_ID, price: '$19.99' }
      };
    } catch (error) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }

  async purchasePremium() {
    try {
      if (!this.isNativePlatform) {
        console.log('⚠️ Not on native platform - simulating premium purchase');
        // Simulate successful purchase for web/development
        await this.syncToSupabase(true, false);
        return { success: true, platform: 'web' };
      }

      // On native platform, would use Apple StoreKit
      console.log('📱 Would initiate Apple StoreKit purchase for:', PREMIUM_PRODUCT_ID);
      
      // For now, simulate successful purchase
      console.log('✅ Premium purchased successfully (simulated)');
      await this.syncToSupabase(true, false);

      return { success: true, platform: 'native', productId: PREMIUM_PRODUCT_ID };
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
      if (!this.isNativePlatform) {
        console.log('⚠️ Not on native platform - simulating healing kit purchase');
        // Simulate successful purchase for web/development
        await this.syncToSupabase(false, true);
        return { success: true, platform: 'web' };
      }

      // On native platform, would use Apple StoreKit
      console.log('📱 Would initiate Apple StoreKit purchase for:', HEALING_KIT_PRODUCT_ID);
      
      // For now, simulate successful purchase
      console.log('✅ Healing Kit purchased successfully (simulated)');
      await this.syncToSupabase(false, true);

      return { success: true, platform: 'native', productId: HEALING_KIT_PRODUCT_ID };
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
