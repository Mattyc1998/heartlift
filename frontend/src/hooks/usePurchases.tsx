import { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function usePurchases() {
  const [isPremium, setIsPremium] = useState(false);
  const [hasHealingKit, setHasHealingKit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();
  const { checkSubscription } = useAuth(); // Get checkSubscription from AuthContext

  // Initialize and check subscription status
  useEffect(() => {
    initializeAndCheckStatus();
  }, []);

  const initializeAndCheckStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Initialize RevenueCat
      await purchaseService.initialize(user.id);

      // Check subscription status
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to load subscription status. Please restart the app.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const [premium, healingKit] = await Promise.all([
        purchaseService.hasPremium(),
        purchaseService.hasHealingKit()
      ]);

      setIsPremium(premium);
      setHasHealingKit(healingKit);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const purchasePremium = async () => {
    setPurchasing(true);
    try {
      const result = await purchaseService.purchasePremium();
      
      if (result) {
        await checkSubscriptionStatus();
        toast({
          title: "🎉 Welcome to Premium!",
          description: "You now have unlimited access to all features. Enjoy your journey!",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  const purchaseHealingKit = async () => {
    setPurchasing(true);
    try {
      const result = await purchaseService.purchaseHealingKit();
      
      if (result) {
        await checkSubscriptionStatus();
        toast({
          title: "💝 Healing Kit Unlocked!",
          description: "Your complete break-up recovery package is now available.",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    setPurchasing(true);
    try {
      await purchaseService.restorePurchases();
      await checkSubscriptionStatus();
      
      toast({
        title: "✅ Purchases Restored",
        description: "Your previous purchases have been restored successfully.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Restore Failed",
        description: error.message || "Unable to restore purchases. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  return {
    isPremium,
    hasHealingKit,
    loading,
    purchasing,
    purchasePremium,
    purchaseHealingKit,
    restorePurchases,
    refreshStatus: checkSubscriptionStatus
  };
}
