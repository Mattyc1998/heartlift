import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'https://c286f1f4-22ee-4ea1-97f0-ce26599be25f.lovableproject.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

const log = (step: string, details?: any) => {
  console.log(`[CREATE-SUBSCRIPTION-INTENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  const origin = getAllowedOrigin(req.headers.get('origin'));
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    log("Function started");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      log("Created new customer", { customerId });
    } else {
      log("Found existing customer", { customerId });
    }

    // Ensure price exists (retrieve by lookup_key or create)
    let priceId: string | undefined;
    const prices = await stripe.prices.list({ lookup_keys: ["premium_monthly_gbp"], active: true, limit: 1 } as any);
    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
      log("Found existing price", { priceId });
    } else {
      const price = await stripe.prices.create({
        currency: "gbp",
        unit_amount: 1199,
        recurring: { interval: "month" },
        lookup_key: "premium_monthly_gbp",
        product_data: { name: "Premium Subscription" },
      } as any);
      priceId = price.id;
      log("Created new price", { priceId });
    }

    // Create subscription in incomplete state and return PI client secret
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [ { price: priceId! } ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { user_id: user.id, product: "premium_subscription" },
    });

    const invoice: any = subscription.latest_invoice;
    const paymentIntent = invoice?.payment_intent;
    if (!paymentIntent?.client_secret) throw new Error("No client secret from subscription");

    log("Subscription created", { subscriptionId: subscription.id });

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret, subscription_id: subscription.id, customer_id: customerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    log("ERROR", { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
