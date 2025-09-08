import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[COMPLETE-HEALING-KIT-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) throw new Error("payment_intent_id is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    log("Retrieved intent", { status: intent.status });

    if (intent.status !== 'succeeded') {
      return new Response(JSON.stringify({ success: false, status: intent.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update purchase status to completed automatically
    await supabaseAdmin
      .from('healing_kit_purchases')
      .update({ status: 'completed', purchased_at: new Date().toISOString() })
      .eq('stripe_payment_intent_id', payment_intent_id);

    // Initialize healing progress if not exists
    const userId = (intent.metadata as any)?.user_id;
    if (userId) {
      const { data: existing } = await supabaseAdmin
        .from('user_healing_progress')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) {
        await supabaseAdmin.from('user_healing_progress').insert({ user_id: userId, current_day: 1 });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log("ERROR", { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
