import { Purchases, LOG_LEVEL, PRODUCT_CATEGORY } from '@revenuecat/purchases-capacitor';
import { supabase } from '@/integrations/supabase/client';

// Product IDs matching App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mattyc.heartlift.premium.monthly',
  HEALING_KIT: 'com.mattyc.heartlift.healingkit'
};

class PurchaseService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this when app starts, after user is authenticated
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure RevenueCat
      // NOTE: You'll need to get your RevenueCat API key from https://app.revenuecat.com
      // For now, we'll use a placeholder - replace with your actual key
      const REVENUECAT_API_KEY = 'appl_YOUR_KEY_HERE'; // TODO: Add to .env
      
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId
      });

      // Enable debug logs in development
      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }

      this.initialized = true;
      console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get available products from App Store
   */
  async getProducts() {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        console.warn('No current offering available');
        return null;
      }

      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Purchase Premium Monthly Subscription
   */
  async purchasePremium() {
    try {
      const offerings = await this.getProducts();
      
      if (!offerings) {
        throw new Error('No products available');
      }

      // Find the premium package
      const premiumPackage = offerings.availablePackages.find(
        pkg => pkg.product.identifier === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      if (!premiumPackage) {
        throw new Error('Premium subscription not found');
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage({
        aPackage: premiumPackage
      });

      console.log('✅ Premium purchased successfully:', customerInfo);

      // Update backend
      await this.syncSubscriptionStatus(customerInfo);

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

  /**
   * Purchase Healing Kit (One-time purchase)
   */
  async purchaseHealingKit() {
    try {
      const offerings = await this.getProducts();
      
      if (!offerings) {
        throw new Error('No products available');
      }

      // Find the healing kit
      const healingKitPackage = offerings.availablePackages.find(
        pkg => pkg.product.identifier === PRODUCT_IDS.HEALING_KIT
      );

      if (!healingKitPackage) {
        throw new Error('Healing Kit not found');
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage({
        aPackage: healingKitPackage
      });

      console.log('✅ Healing Kit purchased successfully:', customerInfo);

      // Update backend
      await this.syncSubscriptionStatus(customerInfo);

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

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      console.log('✅ Purchases restored:', customerInfo);

      // Update backend
      await this.syncSubscriptionStatus(customerInfo);

      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  async getCustomerInfo() {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async hasPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check if user has an active entitlement for premium
      const hasPremiumEntitlement = customerInfo.entitlements.active['premium'] !== undefined;
      
      return hasPremiumEntitlement;
    } catch (error) {
      console.error('❌ Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Check if user has purchased healing kit
   */
  async hasHealingKit(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check if user has purchased the healing kit
      const hasHealingKitPurchase = customerInfo.nonSubscriptionTransactions.some(
        tx => tx.productIdentifier === PRODUCT_IDS.HEALING_KIT
      );
      
      return hasHealingKitPurchase;
    } catch (error) {
      console.error('❌ Failed to check healing kit status:', error);
      return false;
    }
  }

  /**
   * Sync subscription status with backend
   */
  private async syncSubscriptionStatus(customerInfo: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user logged in, cannot sync subscription');
        return;
      }

      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || '';
      
      const response = await fetch(`${backendUrl}/api/subscriptions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          customer_info: customerInfo,
          has_premium: customerInfo.entitlements.active['premium'] !== undefined,
          has_healing_kit: customerInfo.nonSubscriptionTransactions.some(
            (tx: any) => tx.productIdentifier === PRODUCT_IDS.HEALING_KIT
          )
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription with backend');
      }

      console.log('✅ Subscription synced with backend');
    } catch (error) {
      console.error('❌ Failed to sync subscription:', error);
      // Don't throw - purchase was successful, sync can be retried
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();
