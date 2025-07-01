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

// 処理済みイベントを追跡するための簡易キャッシュ（メモリ内）
const processedEvents = new Set<string>();

// バリデーション関数
function validatePayload(payload: any): payload is RevenueCatWebhookPayload {
  return (
    payload &&
    payload.event &&
    typeof payload.event.id === 'string' &&
    typeof payload.event.type === 'string' &&
    typeof payload.event.app_user_id === 'string' &&
    typeof payload.event.product_id === 'string' &&
    typeof payload.event.environment === 'string'
  );
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    console.warn(`Invalid HTTP method: ${req.method}`);
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // 署名検証
    const webhookSecret = Deno.env.get('REVENUE_CAT_WEBHOOK_SECRET');
    const authHeader = req.headers.get('Authorization');

    // Normalize tokens by removing `Bearer ` prefix (case-insensitive) and trimming spaces
    const normalize = (v?: string | null) => v?.replace(/^Bearer\s+/i, '').trim();

    // --- Debug logging helper --------------------------------------------------
    const calcHash = async (value?: string | null) => {
      if (!value) return null;
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      // 先頭 6byte だけ 16進で可視化（漏えい防止）
      return Array.from(new Uint8Array(buf).slice(0, 6))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const normalizedHeader = normalize(authHeader);
    const normalizedSecret = normalize(webhookSecret);

    // 長さとハッシュをログ出力
    try {
      const [headerHash, secretHash] = await Promise.all([
        calcHash(normalizedHeader),
        calcHash(normalizedSecret),
      ]);
      console.log(
        'authLen', normalizedHeader?.length,
        'secretLen', normalizedSecret?.length,
        'authHash', headerHash,
        'secretHash', secretHash,
      );
    } catch (_hashErr) {
      // ignore hashing errors (should not happen)
    }

    if (webhookSecret) {
      // Authorization ヘッダーが無い場合
      if (!authHeader) {
        console.error('Authorization header missing');
        return new Response('Authorization header required', {
          status: 401,
          headers: corsHeaders,
        });
      }

      // トークン不一致の場合
      if (normalizedHeader?.toLowerCase() !== normalizedSecret?.toLowerCase()) {
        console.error('Webhook signature verification failed');
        return new Response('Unauthorized', {
          status: 401,
          headers: corsHeaders,
        });
      }
    }

    // Parse webhook payload
    let payload: any;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError);
      return new Response('Invalid JSON', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ペイロードのバリデーション
    if (!validatePayload(payload)) {
      console.error('Invalid payload structure:', payload);
      return new Response('Invalid payload structure', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const typedPayload = payload as RevenueCatWebhookPayload;
    const { event } = typedPayload;

    console.log(`Received RevenueCat webhook: ${event.type} (ID: ${event.id})`);

    // 重複イベントチェック
    if (processedEvents.has(event.id)) {
      console.log(`Duplicate event detected, skipping: ${event.id}`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // イベントを処理済みとしてマーク
    processedEvents.add(event.id);

    // 古いイベントIDを削除（メモリ使用量を制限）
    if (processedEvents.size > 1000) {
      const oldestIds = Array.from(processedEvents).slice(0, 100);
      oldestIds.forEach(id => processedEvents.delete(id));
    }

    // Extract relevant information
    const {
      type,
      app_user_id,
      product_id,
      purchased_at_ms,
      expiration_at_ms,
      environment
    } = event;

    // Skip sandbox events in production (optional)
    if (environment === 'SANDBOX' && Deno.env.get('ENVIRONMENT') === 'production') {
      console.log('Skipping sandbox event in production');
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Map Revenue Cat user ID to Supabase user ID
    const userId = app_user_id;

    // Determine subscription status based on event type
    let subscriptionStatus = 'active';
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        subscriptionStatus = 'active';
        break;
      case 'CANCELLATION':
        subscriptionStatus = 'cancelled';
        break;
      case 'EXPIRATION':
        subscriptionStatus = 'expired';
        break;
      case 'BILLING_ISSUE':
        subscriptionStatus = 'billing_retry';
        break;
      default:
        console.warn(`Unhandled event type: ${type}, defaulting to active`);
        subscriptionStatus = 'active';
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
      revenue_cat_entitlements: event,
      updated_at: new Date().toISOString(),
    };

    // Upsert subscription data in Supabase
    const { data, error } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Database error for user ${userId}:`, error);
      return new Response(JSON.stringify({ 
        error: 'Database operation failed',
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`Successfully processed ${type} for user ${userId} in ${processingTime}ms`);

    // Send success response to Revenue Cat
    return new Response(JSON.stringify({ 
      received: true,
      processed_at: new Date().toISOString(),
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Webhook processing error after ${processingTime}ms:`, error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}) 