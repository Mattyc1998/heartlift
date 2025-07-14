import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-HEALING-KIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    logStep("Verifying session", { session_id });

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
    logStep("Retrieved Stripe session", { status: session.payment_status });

    if (session.payment_status === "paid") {
      // Update the purchase status in our database
      const { error: updateError } = await supabaseClient
        .from("healing_kit_purchases")
        .update({ 
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
          purchased_at: new Date().toISOString()
        })
        .eq("stripe_session_id", session_id);

      if (updateError) {
        logStep("Error updating purchase", { error: updateError });
        throw new Error(`Failed to update purchase: ${updateError.message}`);
      }

      // Initialize user progress
      const userId = session.metadata?.user_id;
      if (userId) {
        const { error: progressError } = await supabaseClient
          .from("user_healing_progress")
          .upsert({
            user_id: userId,
            current_day: 1,
            no_contact_start_date: new Date().toISOString().split('T')[0],
            no_contact_streak_days: 0
          }, { onConflict: 'user_id' });

        if (progressError) {
          logStep("Error initializing progress", { error: progressError });
        } else {
          logStep("User progress initialized");
        }
      }

      logStep("Purchase verified and unlocked");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Healing Kit unlocked successfully!" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Payment not completed", { status: session.payment_status });
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
    logStep("ERROR in verify-healing-kit-purchase", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});