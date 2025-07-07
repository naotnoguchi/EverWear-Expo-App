import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // 1) 認証ユーザーの取得 --------------------------------------------------
  const supabaseUrl  = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey      = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const authHeader   = req.headers.get('Authorization') || '';
  if (!authHeader) {
    return new Response('Authorization header missing', { status: 401, headers: corsHeaders });
  }

  // ユーザーコンテキスト用クライアント (JWT 付き)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    console.error('Failed to get user:', userErr?.message);
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  const userId = userData.user.id;

  // 2) サービスロールクライアント -----------------------------------------
  const adminClient = createClient(supabaseUrl, serviceKey);

  // (a) public.* データ & 画像パス削除
  const { data: deleteRes, error: deleteErr } = await adminClient
    .rpc('delete_user_account', { user_id_param: userId });

  if (deleteErr) {
    console.error('delete_user_account RPC error:', deleteErr.message);
    return new Response('Failed to delete user data', { status: 500, headers: corsHeaders });
  }

  // (b) auth.users 本体削除 (identities も cascade)
  const { error: adminErr } = await adminClient.auth.admin.deleteUser(userId);
  if (adminErr) {
    console.error('admin.deleteUser error:', adminErr.message);
    return new Response('Failed to delete auth user', { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, detail: deleteRes }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}); 