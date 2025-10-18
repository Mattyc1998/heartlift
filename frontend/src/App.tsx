import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
