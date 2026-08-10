// Supabase Edge Function (Deno runtime). Permanently deletes the calling user's
// account and all their data. Deleting the auth.users row cascades (via the
// `on delete cascade` foreign keys set up in 0001_init_schema.sql) through
// user_profile and everything that references it - meal_plan, food_log,
// food_log_monthly_summary, weight_log, notification_log - so one admin call
// removes the user's entire server-side footprint in a single transaction.
//
// The caller's identity is derived from their own JWT, never trusted from the
// request body - a destructive action like this must not be spoofable by passing
// someone else's user id.
//
// Already available automatically in every Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }
    const jwt = authHeader.slice('Bearer '.length);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user }, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
});
