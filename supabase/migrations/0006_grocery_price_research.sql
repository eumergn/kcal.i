-- Cached live grocery-price research, keyed by country (not by user) - the prices
-- themselves aren't personal, so caching per-country avoids re-researching the same
-- French chicken breast price on every single signup. Populated by the
-- research-grocery-prices Edge Function, refreshed when older than 30 days.

create table public.grocery_price_research (
  country text primary key check (country in ('FR', 'DE')),
  prices jsonb not null, -- { [itemId]: { budget: number, premium: number } }, EUR per 100g
  researched_at timestamptz not null default now()
);

alter table public.grocery_price_research enable row level security;
create policy "grocery price research readable by authenticated users"
  on public.grocery_price_research for select using (auth.role() = 'authenticated');

-- Only the Edge Function (service_role, bypasses RLS) writes to this table -
-- no insert/update policy for regular users.
