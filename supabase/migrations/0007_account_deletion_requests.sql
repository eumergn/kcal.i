-- Account deletion now requires clicking a confirmation link emailed to the user,
-- instead of deleting immediately on request - see supabase/functions/
-- request-account-deletion and confirm-account-deletion.

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index account_deletion_requests_token_idx on public.account_deletion_requests (token);

alter table public.account_deletion_requests enable row level security;
create policy "own deletion requests" on public.account_deletion_requests for select using (auth.uid() = user_id);
-- No insert/update/delete policy for regular users - only the service-role-backed
-- Edge Functions create or resolve these rows.
