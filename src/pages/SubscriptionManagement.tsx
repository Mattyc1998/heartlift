import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, ArrowLeft, Calendar, CreditCard, X, Key, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SubscriptionManagement = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
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
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handlePasswordChange = async () => {
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
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

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email Update Requested",
        description: "Please check both your old and new email for confirmation links.",
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
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
              <Button 
                onClick={() => navigate('/premium-purchase', { state: { from: location.pathname + location.search } })}
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
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
                  <span>💬 Text helpers & conversation analyzer</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-amber-800 mb-2">Cancellation Policy</h4>
              <p className="text-sm text-amber-700">
                You can cancel your subscription at any time. Your access will continue until the end of your current billing period. 
                No refunds are provided for partial periods.
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full md:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              {cancelling ? "Opening..." : "Manage Billing & Cancellation"}
            </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
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
              <Button 
                onClick={handlePasswordChange}
                disabled={!newPassword || !confirmPassword || isChangingPassword}
                className="w-full md:w-auto"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>

            {/* Change Email */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">Change Email Address</h4>
              <div className="space-y-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <Button 
                onClick={handleEmailChange}
                disabled={!newEmail || isChangingEmail}
                className="w-full md:w-auto"
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isChangingEmail ? "Updating..." : "Update Email"}
              </Button>
              <p className="text-sm text-muted-foreground">
                You'll receive confirmation emails at both your current and new email addresses.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};