// Supabase Edge Function: instagram-disconnect
// Clears all Instagram OAuth fields for the authenticated user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !user) {
    return json({ error: 'Invalid or expired session' }, 401)
  }

  const { error } = await supabase
    .from('influencers')
    .update({
      instagram_connected:        false,
      instagram_business_id:      null,
      instagram_username:         null,
      instagram_access_token:     null,
      instagram_token_expires_at: null,
    })
    .eq('user_id', user.id)

  if (error) {
    return json({ error: 'Failed to disconnect Instagram' }, 500)
  }

  return json({ ok: true })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
