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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    console.log("Activating test healing kit for user:", user.email);

    // Add test healing kit purchase
    const { error: purchaseError } = await supabaseClient.from("healing_kit_purchases").upsert({
      user_id: user.id,
      stripe_session_id: "test_healing_kit_session",
      amount: 499,
      currency: "gbp",
      status: "completed",
      stripe_payment_intent_id: "test_payment_intent",
      purchased_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (purchaseError) {
      console.error('Purchase error:', purchaseError);
      throw new Error(`Failed to add healing kit purchase: ${purchaseError.message}`);
    }

    // Initialize user progress
    const { error: progressError } = await supabaseClient.from("user_healing_progress").upsert({
      user_id: user.id,
      current_day: 1,
      completed_days: [],
      completed_milestones: [],
      no_contact_streak_days: 0,
      journal_entries: []
    }, { onConflict: 'user_id' });

    if (progressError) {
      console.error('Progress error:', progressError);
      throw new Error(`Failed to initialize healing progress: ${progressError.message}`);
    }

    console.log("Test healing kit activated successfully");

    return new Response(JSON.stringify({ success: true, message: "Test healing kit activated!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error activating test healing kit:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});