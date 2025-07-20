import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-HEALING-KIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with anon key for user authentication
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user using anon key client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Supabase client with service role for database writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user already has healing kit
    const { data: existingPurchase, error: purchaseCheckError } = await supabaseClient
      .from("healing_kit_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .maybeSingle();

    if (purchaseCheckError) {
      logStep("Error checking existing purchase", { error: purchaseCheckError });
      throw new Error(`Failed to check existing purchase: ${purchaseCheckError.message}`);
    }

    if (existingPurchase) {
      logStep("User already has healing kit");
      return new Response(JSON.stringify({ 
        error: "You already own the Healing Kit! Check your premium features." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Changed to 200 instead of 400
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create Stripe checkout session
    logStep("Creating Stripe checkout session");
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Healing Kit - 30-Day Breakup Recovery Package",
                description: "Complete break-up recovery package with healing plan, affirmations, meditations, and more."
              },
              unit_amount: 399, // £3.99 in pence
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/healing-kit-success`,
        cancel_url: `${req.headers.get("origin")}/`,
        metadata: {
          user_id: user.id,
          product: "healing_kit"
        }
      });
      logStep("Stripe session created successfully", { sessionId: session.id, url: session.url });
    } catch (stripeError) {
      logStep("Stripe session creation failed", { error: stripeError });
      throw new Error(`Stripe checkout session creation failed: ${stripeError.message}`);
    }

    if (!session || !session.url) {
      logStep("Session created but no URL", { session });
      throw new Error("Stripe session created but no checkout URL was returned");
    }

    // Record the purchase in our database
    logStep("Recording purchase in database");
    const { error: insertError } = await supabaseClient
      .from("healing_kit_purchases")
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: 399,
        currency: "gbp",
        status: "pending"
      });

    if (insertError) {
      logStep("Error inserting purchase record", { error: insertError });
      throw new Error(`Failed to record purchase: ${insertError.message}`);
    }

    logStep("Purchase recorded successfully, returning URL", { url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in purchase-healing-kit", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});