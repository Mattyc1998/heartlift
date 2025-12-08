import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { purchaseService } from "@/services/purchaseService";
import { supabase } from "@/integrations/supabase/client";
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
  const { isAppReady, initializeApp } = useAuth();

  useEffect(() => {
    // CRITICAL: Reinitialize app on app resume
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[App] 👁️ App resumed - reinitializing...');
        try {
          await initializeApp();
        } catch (error) {
          console.error('[App] ❌ Error reinitializing on resume:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initializeApp]);

  // Show loading screen while app initializes
  if (!isAppReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-semibold text-foreground">Loading HeartLift...</p>
        </div>
      </div>
    );
  }

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
