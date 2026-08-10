// Supabase Edge Function (Deno runtime). Starts the account-deletion flow: generates
// a one-time token, stores it with a 1-hour expiry, and emails the user a branded
// confirmation link (via SendGrid). The account is NOT deleted here - only
// confirm-account-deletion, triggered by clicking that link, actually deletes
// anything. This two-step flow means a stolen/leaked session token alone can't
// destroy the account instantly; the attacker would also need access to the user's
// inbox.
//
// Required secrets (set via `supabase secrets set NAME=value`, never commit these):
//   SENDGRID_API_KEY   - from sendgrid.com, server-side only, never in app code
// Already available automatically in every Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { deletionConfirmationEmail } from '../_shared/emailTemplate.ts';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const SENDGRID_FROM = { email: 'kcal.i@outlook.com', name: 'kcal.i' };

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }
    const jwt = authHeader.slice('Bearer '.length);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user }, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const { error: insertError } = await admin
      .from('account_deletion_requests')
      .insert({ user_id: user.id, token, expires_at: expiresAt });
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/confirm-account-deletion?token=${token}`;

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridKey) throw new Error('SENDGRID_API_KEY is not set');

    const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sendgridKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: user.email }] }],
        from: SENDGRID_FROM,
        subject: 'Confirm deletion of your kcal.i account',
        content: [{ type: 'text/html', value: deletionConfirmationEmail(confirmUrl) }],
      }),
    });
    if (!emailRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to send email: ${await emailRes.text()}` }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
});
