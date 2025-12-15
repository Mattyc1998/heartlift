import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    
    // Create a Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user from the auth token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found or unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('Deleting user:', user.id)

    // Delete all user data from tables (using service role for permissions)
    const deletePromises = [
      supabaseAdmin.from('subscribers').delete().eq('user_id', user.id),
      supabaseAdmin.from('healing_kit_purchases').delete().eq('user_id', user.id),
      supabaseAdmin.from('conversation_history').delete().eq('user_id', user.id),
      supabaseAdmin.from('daily_reflections').delete().eq('user_id', user.id),
      supabaseAdmin.from('mood_entries').delete().eq('user_id', user.id),
      supabaseAdmin.from('journal_entries').delete().eq('user_id', user.id),
      supabaseAdmin.from('user_healing_progress').delete().eq('user_id', user.id),
      supabaseAdmin.from('healing_plan_days').delete().eq('user_id', user.id),
      supabaseAdmin.from('user_milestone_progress').delete().eq('user_id', user.id),
      supabaseAdmin.from('profiles').delete().eq('id', user.id),
    ]

    const deleteResults = await Promise.allSettled(deletePromises)
    console.log('Data deletion results:', deleteResults)

    // Delete the user from auth (CRITICAL - this prevents them from logging back in)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth account', details: deleteAuthError }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('User successfully deleted:', user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all data permanently deleted',
        deletedUserId: user.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
