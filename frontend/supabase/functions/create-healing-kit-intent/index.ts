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
  console.log(`[CREATE-HEALING-KIT-INTENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
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

    // Check if user already has completed purchase
    const { data: existing } = await supabaseAdmin
      .from('healing_kit_purchases')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ already_owned: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Ensure customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      log("Created new customer", { customerId });
    } else {
      log("Found existing customer", { customerId });
    }

    // Create PaymentIntent
    const amount = 499; // £4.99 in pence
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      customer: customerId,
      receipt_email: user.email,
      metadata: { user_id: user.id, product: 'healing_kit' },
      automatic_payment_methods: { enabled: true },
    });

    // Record pending purchase
    await supabaseAdmin.from('healing_kit_purchases').insert({
      user_id: user.id,
      amount,
      currency: 'gbp',
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    });

    log("PaymentIntent created", { intentId: paymentIntent.id });

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret, payment_intent_id: paymentIntent.id }),
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
