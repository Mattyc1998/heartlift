import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, ArrowLeft, Calendar, CreditCard, X, Key, Mail, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { purchaseService } from "@/services/purchaseService";

export const SubscriptionManagement = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { isPremium, subscriptionStatus, checkSubscription, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isPremium) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  const fetchSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      // For iOS users with Apple In-App Purchases, direct them to Apple's subscription management
      // Check if running in Capacitor/iOS
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isCapacitor = window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
      
      if (isIOS || isCapacitor) {
        // Open Apple's subscription management page
        // This works on iOS devices and will open the Settings app
        window.open('https://apps.apple.com/account/subscriptions', '_blank');
        
        toast({
          title: "Apple Subscription Management",
          description: "Opening Apple's subscription settings where you can manage or cancel your subscription.",
        });
      } else {
        // For web users (Stripe subscriptions - if any)
        const { data, error } = await supabase.functions.invoke('customer-portal', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      toast({
        title: "Subscription Management",
        description: "To manage your Apple subscription, go to: Settings > [Your Name] > Subscriptions on your iPhone/iPad.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      toast({
        title: "Restoring Purchases",
        description: "Checking for previous purchases...",
      });

      const result = await purchaseService.restorePurchases();
      
      if (result.hasPremium || result.hasHealingKit) {
        // Refresh subscription status
        await checkSubscription();
        
        toast({
          title: "✅ Purchases Restored!",
          description: `Successfully restored: ${result.hasPremium ? 'Premium Subscription' : ''} ${result.hasHealingKit ? 'Healing Kit' : ''}`.trim(),
        });
        
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        toast({
          title: "No Purchases Found",
          description: "We couldn't find any previous purchases linked to your account.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: "Could not restore purchases. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        setIsChangingPassword(false);
        return;
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    console.log('[Delete Account] Button clicked');
    
    const confirmMessage = `Delete your HeartLift account?

This will permanently delete:
• All conversations and chat history
• Journal entries and mood tracking data
• Your healing plan progress
• Account profile and settings

⚠️ This action cannot be undone.
⚠️ You will NOT be able to log back in with these credentials.

Note: To cancel your Premium subscription, go to:
iPhone Settings → [Your Name] → Subscriptions → HeartLift

Are you sure you want to delete your account?`;

    if (!window.confirm(confirmMessage)) {
      console.log('[Delete Account] User cancelled');
      return;
    }
    
    console.log('[Delete Account] User confirmed, starting deletion...');
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('[Delete Account] No user found');
        toast({
          title: "Error",
          description: "No user found. Please sign in again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('🗑️ [Delete Account] Deleting all data for user:', currentUser.id);
      
      toast({
        title: "Deleting Account",
        description: "Please wait while we permanently delete everything...",
      });
      
      // CRITICAL: Delete from EVERY table that stores user data
      console.log('[Delete Account] Deleting from all tables...');
      const deletionPromises = [
        supabase.from('subscribers').delete().eq('user_id', currentUser.id),
        supabase.from('healing_kit_purchases').delete().eq('user_id', currentUser.id),
        supabase.from('conversations').delete().eq('user_id', currentUser.id),
        supabase.from('conversation_history').delete().eq('user_id', currentUser.id),
        supabase.from('daily_reflections').delete().eq('user_id', currentUser.id),
        supabase.from('mood_entries').delete().eq('user_id', currentUser.id),
        supabase.from('journal_entries').delete().eq('user_id', currentUser.id),
        supabase.from('user_healing_progress').delete().eq('user_id', currentUser.id),
        supabase.from('healing_plan_days').delete().eq('user_id', currentUser.id),
        supabase.from('user_milestone_progress').delete().eq('user_id', currentUser.id),
        supabase.from('profiles').delete().eq('id', currentUser.id)
      ];
      
      const results = await Promise.allSettled(deletionPromises);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Failed to delete from table ${index}:`, result);
        } else {
          console.log(`✅ Deleted from table ${index}`);
        }
      });
      
      console.log('✅ All user data deleted from tables');
      
      // Clear localStorage to prevent auto-restore of purchases
      console.log('[Delete Account] Clearing localStorage...');
      localStorage.clear();
      
      // CRITICAL: Delete the auth account entirely using SQL function
      // We pass the user_id as a parameter to avoid auth.uid() being NULL
      console.log('[Delete Account] Calling delete_user_by_id RPC with user ID:', currentUser.id);
      
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('delete_user_by_id', {
        user_id_to_delete: currentUser.id
      });
      
      console.log('[Delete Account] RPC full response:', { data: rpcResponse, error: rpcError });
      
      // Check for RPC call error
      if (rpcError) {
        console.error('❌ RPC call failed:', JSON.stringify(rpcError));
        toast({
          title: "Error",
          description: `Failed to delete account. Error: ${rpcError.message}. Contact support@heart-lift.com`,
          variant: "destructive",
        });
        return;
      }
      
      // Check the response from the function
      if (!rpcResponse || !rpcResponse.success) {
        console.error('❌ Function returned error:', rpcResponse);
        toast({
          title: "Error",
          description: `Failed: ${rpcResponse?.error || 'Unknown error'}. Contact support@heart-lift.com`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Auth account deleted successfully:', rpcResponse.deleted_user_id);
      
      // Sign out locally
      console.log('[Delete Account] Signing out locally...');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.log('⚠️ Sign out error (may be expected):', signOutError);
      }
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted. You cannot log back in.",
      });
      
      // Navigate to auth page
      console.log('[Delete Account] Navigating to login...');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ [Delete Account] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support@heart-lift.com",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="container mx-auto max-w-4xl pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show account management for both free and premium users
  const renderSubscriptionInfo = () => {
    if (!isPremium) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-gray-500" />
              Account Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold">Free Plan</h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Active
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Current Benefits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>10 messages per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Basic coaching support</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">Upgrade to Premium</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get unlimited conversations, advanced tools, and personalised coaching
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/premium-purchase', { state: { from: location.pathname + location.search } })}
                  className="w-full"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRestorePurchases}
                  disabled={isRestoring}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                  {isRestoring ? "Restoring..." : "Restore Purchases"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!subscriptionData) {
      return (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <p>Loading subscription data...</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-600" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Premium Plan</h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Started: {formatDate(subscriptionData.premium_start_date || subscriptionData.created_at)}</span>
                </div>
                
                {subscriptionData.subscription_end && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Next billing: {formatDate(subscriptionData.subscription_end)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span>Status: {subscriptionData.payment_status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Premium Benefits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>💬 Unlimited conversations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>🧠 Personalised coaching</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>🛠 Advanced tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>📚 Guided Programmes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>💬 Text helpers & conversation analyser</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-amber-800 mb-2">Cancellation Policy</h4>
              <p className="text-sm text-amber-700 mb-2">
                You can cancel your subscription at any time. Your access will continue until the end of your current billing period. 
                No refunds are provided for partial periods.
              </p>
              <p className="text-sm text-amber-700 font-medium">
                For iOS: Manage your subscription through Apple Settings → [Your Name] → Subscriptions
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="w-full sm:flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {cancelling ? "Opening..." : "Manage Subscription"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRestorePurchases}
                disabled={isRestoring}
                className="w-full sm:flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/?tab=coaches')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Coaches
        </Button>

        {renderSubscriptionInfo()}

        {/* Account Security Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h4 className="font-medium">Change Password</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                className="w-full md:w-auto"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>

            {/* Change Email */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">Change Email Address</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900">
                      If you would like to change your email address, please email{" "}
                      <a 
                        href="mailto:support@heart-lift.com" 
                        className="font-medium underline hover:text-blue-700"
                      >
                        support@heart-lift.com
                      </a>
                      {" "}and we will make the change for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion Section */}
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Permanent Account Deletion</h4>
              <p className="text-sm text-red-700 mb-3">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-red-700 space-y-1 mb-3">
                <li>• All conversations and chat history</li>
                <li>• Journal entries and mood tracking data</li>
                <li>• Your healing plan progress</li>
                <li>• Account profile and settings</li>
              </ul>
              <p className="text-sm text-red-700 font-medium mb-2">
                ⚠️ This action cannot be undone.
              </p>
              <p className="text-sm text-red-700">
                <strong>Note:</strong> To cancel your Premium subscription, go to: iPhone Settings → [Your Name] → Subscriptions → HeartLift
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};