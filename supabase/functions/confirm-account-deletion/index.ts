// Supabase Edge Function (Deno runtime). Reached by clicking the link in the
// deletion-confirmation email (see request-account-deletion). Validates the token,
// then deletes the auth.users row - which cascades through user_profile and
// everything tied to it (meal_plan, food_log, weight_log, notification_log,
// account_deletion_requests itself) via the `on delete cascade` foreign keys set up
// in 0001_init_schema.sql and 0007_account_deletion_requests.sql.
//
// Plain GET with no auth required beyond the token itself - this is what makes it
// clickable straight from an email client on any device, without needing the app
// installed or a live session.
//
// Already available automatically in every Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

function page(title: string, message: string, tone: 'success' | 'error'): Response {
  const accent = tone === 'success' ? '#16A34A' : '#DC2626';
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>kcal.i</title></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:420px;width:100%;padding:40px 28px;text-align:center;">
    <p style="margin:0 0 24px 0;font-size:20px;font-weight:800;letter-spacing:0.5px;color:#FFFFFF;">kcal.i</p>
    <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${accent};">${title}</p>
    <p style="margin:0;font-size:15px;line-height:23px;color:#A1A1AA;">${message}</p>
  </div>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return page('Invalid link', 'This deletion link is missing its token. Request account deletion again from the app.', 'error');
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: request, error: fetchError } = await admin
    .from('account_deletion_requests')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (fetchError || !request) {
    return page('Link already used or invalid', 'This deletion link has already been used, or never existed. Request account deletion again from the app if you still want to delete your account.', 'error');
  }

  if (new Date(request.expires_at).getTime() < Date.now()) {
    await admin.from('account_deletion_requests').delete().eq('token', token);
    return page('Link expired', 'This deletion link expired after 1 hour. Request account deletion again from the app.', 'error');
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(request.user_id);
  if (deleteError) {
    return page('Something went wrong', `We could not delete your account: ${deleteError.message}. Please try again or contact support.`, 'error');
  }

  return page('Account deleted', 'Your kcal.i account and all associated data have been permanently deleted. We are sorry to see you go.', 'success');
});
