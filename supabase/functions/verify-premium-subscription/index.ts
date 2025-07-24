import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PREMIUM] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    logStep("Verifying premium subscription session", { session_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved Stripe session", { 
      status: session.payment_status,
      mode: session.mode,
      subscription: session.subscription 
    });

    if (session.payment_status === "paid" && session.mode === "subscription") {
      const userId = session.metadata?.user_id;
      if (!userId) {
        throw new Error("No user ID in session metadata");
      }

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(session.customer as string);
      const customerEmail = (customer as any).email;

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Update the subscription in our database
      const { error: upsertError } = await supabaseClient.from("subscribers").upsert({
        email: customerEmail,
        user_id: userId,
        stripe_customer_id: session.customer as string,
        subscribed: true,
        plan_type: 'premium',
        payment_status: 'active',
        subscription_end: subscriptionEnd,
        premium_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (upsertError) {
        logStep("Error updating subscription", { error: upsertError });
        throw new Error(`Failed to update subscription: ${upsertError.message}`);
      }

      logStep("Premium subscription activated successfully");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Premium subscription activated!" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Payment not completed or not a subscription", { 
        status: session.payment_status,
        mode: session.mode 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-premium-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});