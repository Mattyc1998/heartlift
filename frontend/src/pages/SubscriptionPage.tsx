import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Heart, Sparkles } from 'lucide-react';
import { usePurchases } from '@/hooks/usePurchases';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionPage() {
  const { isPremium, hasHealingKit, purchasing, purchasePremium, purchaseHealingKit, restorePurchases } = usePurchases();
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<'premium' | 'healingkit' | 'restore' | null>(null);

  const handlePurchasePremium = async () => {
    setActiveAction('premium');
    await purchasePremium();
    setActiveAction(null);
  };

  const handlePurchaseHealingKit = async () => {
    setActiveAction('healingkit');
    await purchaseHealingKit();
    setActiveAction(null);
  };

  const handleRestorePurchases = async () => {
    setActiveAction('restore');
    await restorePurchases();
    setActiveAction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Healing Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every relationship journey is unique. Find the support level that feels right for you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* Free Tier */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started on your healing journey</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">£0</span>
                <span className="text-gray-600">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Basic AI relationship advice</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>10 messages per day</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Daily mood check-ins</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Daily reflections</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Access to all coaches</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card className="border-4 border-pink-500 relative shadow-xl">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500">
              Most Popular
            </Badge>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-8 h-8 text-pink-500" />
                {isPremium && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Unlimited support for your relationship growth</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">£11.99</span>
                <span className="text-gray-600">/per month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Everything in free</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Unlimited AI coach conversations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Regenerate AI responses</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Guided Programmes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Personalised insights & reports</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Daily attachment style quiz with AI analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Conversation analyser with AI insights</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Text suggestion helper for all scenarios</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Create personalised AI-generated visuals</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600"
                onClick={handlePurchasePremium}
                disabled={isPremium || purchasing}
              >
                {purchasing && activeAction === 'premium' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isPremium ? (
                  'Active'
                ) : (
                  'Go Premium'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Healing Kit */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-8 h-8 text-pink-400" />
                {hasHealingKit && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Owned
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">Healing Kit</CardTitle>
              <CardDescription>Complete break-up recovery package</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">£4.99</span>
                <span className="text-gray-600">/one-time</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>30-day healing plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Daily affirmations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Visualisation practices</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>No-contact tracker</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Journal prompts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button 
                className="w-full"
                variant="outline"
                onClick={handlePurchaseHealingKit}
                disabled={hasHealingKit || purchasing}
              >
                {purchasing && activeAction === 'healingkit' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : hasHealingKit ? (
                  'Purchased'
                ) : (
                  'Get Healing Kit'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Restore Purchases */}
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={handleRestorePurchases}
            disabled={purchasing}
            className="text-gray-600"
          >
            {purchasing && activeAction === 'restore' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              'Restore Purchases'
            )}
          </Button>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! You can cancel your Premium subscription anytime from your device settings. 
                  You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's included in the Healing Kit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The Healing Kit is a comprehensive 30-day program designed specifically for break-up recovery. 
                  It includes daily activities, affirmations, guided practices, and tracking tools to support your healing journey.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I restore my purchases?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Click the "Restore Purchases" button above. This will retrieve any purchases made with your Apple ID.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
