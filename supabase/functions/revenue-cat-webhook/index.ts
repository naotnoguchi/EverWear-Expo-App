import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RevenueCatWebhookPayload {
  api_version: string;
  event: {
    type: string;
    id: string;
    event_timestamp_ms: number;
    app_user_id: string;
    original_app_user_id: string;
    aliases: string[];
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    environment: string;
    entitlement_id?: string;
    entitlement_ids?: string[];
    presented_offering_id?: string;
    transaction_id: string;
    original_transaction_id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify webhook authenticity (optional but recommended)
    const webhookSecret = Deno.env.get('REVENUE_CAT_WEBHOOK_SECRET')
    if (webhookSecret) {
      const signature = req.headers.get('Authorization')
      // In production, verify the signature here
      console.log('Webhook signature verification would happen here')
    }

    // Parse webhook payload
    const payload: RevenueCatWebhookPayload = await req.json()
    console.log('Received Revenue Cat webhook:', payload.event.type)

    // Extract relevant information
    const {
      type,
      app_user_id,
      product_id,
      purchased_at_ms,
      expiration_at_ms,
      environment
    } = payload.event

    // Skip sandbox events in production (optional)
    if (environment === 'SANDBOX' && Deno.env.get('ENVIRONMENT') === 'production') {
      console.log('Skipping sandbox event in production')
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Map Revenue Cat user ID to Supabase user ID
    // Assuming app_user_id is the Supabase user UUID
    const userId = app_user_id

    // Determine subscription status based on event type
    let subscriptionStatus = 'active'
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        subscriptionStatus = 'active'
        break
      case 'CANCELLATION':
        subscriptionStatus = 'cancelled'
        break
      case 'EXPIRATION':
        subscriptionStatus = 'expired'
        break
      case 'BILLING_ISSUE':
        subscriptionStatus = 'billing_retry'
        break
      default:
        console.log(`Unhandled event type: ${type}`)
        subscriptionStatus = 'active' // Default to active for unknown events
    }

    // Prepare subscription data
    const subscriptionData = {
      user_id: userId,
      revenue_cat_user_id: app_user_id,
      subscription_status: subscriptionStatus,
      product_id: product_id,
      purchase_date: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : null,
      expiration_date: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
      original_purchase_date: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : null,
      revenue_cat_entitlements: payload.event,
      updated_at: new Date().toISOString(),
    }

    // Upsert subscription data in Supabase
    const { data, error } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error updating subscription:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('Successfully updated subscription for user:', userId)

    // Send success response to Revenue Cat
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 