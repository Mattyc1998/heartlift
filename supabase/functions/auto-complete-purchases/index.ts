import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auto-complete any pending purchases older than 5 minutes
    // This ensures purchases don't get stuck in pending state
    const { data: updatedPurchases, error: purchaseError } = await supabaseAdmin
      .from('healing_kit_purchases')
      .update({ 
        status: 'completed', 
        purchased_at: new Date().toISOString() 
      })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes ago
      .select();

    if (purchaseError) throw purchaseError;

    console.log(`Auto-completed ${updatedPurchases?.length || 0} healing kit purchases`);

    // Auto-complete any premium subscriptions that might be stuck
    await supabaseAdmin
      .from('subscribers')
      .update({ 
        subscribed: true,
        payment_status: 'active',
        plan_type: 'premium'
      })
      .eq('payment_status', 'pending')
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    return new Response(JSON.stringify({ 
      success: true, 
      completed_purchases: updatedPurchases?.length || 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Auto-complete error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});