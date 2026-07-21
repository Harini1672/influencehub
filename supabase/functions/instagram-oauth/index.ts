// Supabase Edge Function: instagram-oauth
// ----------------------------------------
// Receives the Instagram authorization code from the frontend,
// exchanges it for a long-lived access token, fetches the
// Instagram username, and stores the result in the influencers table.
//
// Required Edge Function secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   INSTAGRAM_CLIENT_ID      — Meta App ID  (same as VITE_INSTAGRAM_CLIENT_ID)
//   INSTAGRAM_CLIENT_SECRET  — Meta App Secret  (NEVER in frontend env)
//   SUPABASE_URL             — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // ── 1. Authenticate the calling user via their Supabase JWT ──────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the JWT and get the calling user
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !user) {
    return json({ error: 'Invalid or expired session' }, 401)
  }

  // ── 2. Parse the request body ────────────────────────────────────────────
  let body: { code?: string; redirect_uri?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { code, redirect_uri } = body
  if (!code || !redirect_uri) {
    return json({ error: '`code` and `redirect_uri` are required' }, 400)
  }

  const clientId     = Deno.env.get('INSTAGRAM_CLIENT_ID')
  const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    console.error('Missing INSTAGRAM_CLIENT_ID or INSTAGRAM_CLIENT_SECRET secrets')
    return json({ error: 'Server misconfiguration' }, 500)
  }

  // ── 3. Exchange authorization code → short-lived token ──────────────────
  // Instagram Basic Display API / Business Login token endpoint
  const tokenForm = new URLSearchParams({
    client_id:     clientId,
    client_secret: clientSecret,
    grant_type:    'authorization_code',
    redirect_uri,
    code,
  })

  const shortTokenRes = await fetch(
    'https://api.instagram.com/oauth/access_token',
    { method: 'POST', body: tokenForm }
  )
  const shortTokenData = await shortTokenRes.json()

  if (!shortTokenRes.ok || shortTokenData.error_type) {
    console.error('Short-lived token error:', shortTokenData)
    return json({
      error: shortTokenData.error_message ?? 'Failed to exchange authorization code',
    }, 400)
  }

  const shortToken: string = shortTokenData.access_token
  const igUserId: string   = String(shortTokenData.user_id)

  // ── 4. Exchange short-lived token → long-lived token (60 days) ───────────
  const longTokenUrl = new URL('https://graph.instagram.com/access_token')
  longTokenUrl.searchParams.set('grant_type',       'ig_exchange_token')
  longTokenUrl.searchParams.set('client_secret',    clientSecret)
  longTokenUrl.searchParams.set('access_token',     shortToken)

  const longTokenRes  = await fetch(longTokenUrl.toString())
  const longTokenData = await longTokenRes.json()

  if (!longTokenRes.ok || longTokenData.error) {
    console.error('Long-lived token error:', longTokenData)
    return json({
      error: longTokenData.error?.message ?? 'Failed to obtain long-lived token',
    }, 400)
  }

  const longToken: string  = longTokenData.access_token
  const expiresInSec: number = longTokenData.expires_in ?? 5183944 // ~60 days
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString()

  // ── 5. Fetch Instagram username ───────────────────────────────────────────
  const profileUrl = new URL(`https://graph.instagram.com/${igUserId}`)
  profileUrl.searchParams.set('fields',       'id,username')
  profileUrl.searchParams.set('access_token', longToken)

  const profileRes  = await fetch(profileUrl.toString())
  const profileData = await profileRes.json()

  if (!profileRes.ok || profileData.error) {
    console.error('Profile fetch error:', profileData)
    return json({
      error: profileData.error?.message ?? 'Failed to fetch Instagram profile',
    }, 400)
  }

  const igUsername: string = profileData.username

  // ── 6. Persist to influencers table (service role bypasses RLS) ───────────
  const { error: updateError } = await supabase
    .from('influencers')
    .update({
      instagram_connected:        true,
      instagram_business_id:      igUserId,
      instagram_username:         igUsername,
      instagram_access_token:     longToken,       // only ever written/read server-side
      instagram_token_expires_at: expiresAt,
      // Keep instagram_url in sync so existing display logic still works
      instagram_url: `https://instagram.com/${igUsername}`,
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('DB update error:', updateError)
    return json({ error: 'Failed to save Instagram connection' }, 500)
  }

  // ── 7. Return safe fields to the client (no token) ────────────────────────
  return json({
    ok:                 true,
    instagram_username: igUsername,
    instagram_business_id: igUserId,
    expires_at:         expiresAt,
  })
})

// ── Helper ────────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
