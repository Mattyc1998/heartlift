import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DebugConsole } from "@/components/DebugConsole";
import { purchaseService } from "@/services/purchaseService";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { PremiumSuccess } from "./pages/PremiumSuccess";
import { PremiumPurchase } from "./pages/PremiumPurchase";
import { HealingKitPurchase } from "./pages/HealingKitPurchase";
import { SubscriptionManagement } from "./pages/SubscriptionManagement";
import HealingKit from "./pages/HealingKit";
import AdvancedTools from "./pages/AdvancedTools";
import PasswordReset from "./pages/PasswordReset";
import PasswordResetForm from "./pages/PasswordResetForm";
import EmailVerification from "./pages/EmailVerification";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Inner component that has access to AuthContext
const AppContent = () => {
  const { checkSupabaseSubscriptionStatus } = useAuth();

  useEffect(() => {
    // CRITICAL: Check Supabase on app launch
    const initializeApp = async () => {
      console.log('[App] 🚀 App launched - checking Supabase subscription status');
      try {
        await checkSupabaseSubscriptionStatus();
      } catch (error) {
        console.error('[App] ❌ Error checking subscription on launch:', error);
      }
    };

    initializeApp();
  }, [checkSupabaseSubscriptionStatus]);

  useEffect(() => {
    // CRITICAL: Check Supabase on app resume (catches expirations & cancellations)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[App] 👁️ App resumed - checking Supabase for subscription changes');
        try {
          // Check Supabase to catch expired/cancelled subscriptions
          await checkSupabaseSubscriptionStatus();
          
          // Also check IAP store status
          await purchaseService.checkSubscriptionStatus();
        } catch (error) {
          console.error('[App] ❌ Error checking subscription on resume:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSupabaseSubscriptionStatus]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/premium-success" element={<PremiumSuccess />} />
        <Route path="/premium-purchase" element={<PremiumPurchase />} />
        <Route path="/healing-kit-purchase" element={<HealingKitPurchase />} />
        <Route path="/subscription-management" element={<SubscriptionManagement />} />
        <Route path="/healing-kit" element={<HealingKit />} />
        <Route path="/advanced-tools" element={<AdvancedTools />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/reset-password" element={<PasswordResetForm />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
