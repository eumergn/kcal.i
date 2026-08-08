-- Multi-store pricing: replaces the single price/currency on `food` with per-store prices,
-- so the meal-generation engine can pick the cheapest chain for each food item.
-- MVP scope: FR and DE only. Prices are manually-curated estimates, refreshed periodically
-- (not live-scraped) - see README for why.

create table public.store (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null check (country in ('FR', 'DE')),
  unique (name, country)
);

insert into public.store (name, country) values
  ('Leclerc', 'FR'),
  ('Carrefour', 'FR'),
  ('Intermarché', 'FR'),
  ('Lidl', 'FR'),
  ('Auchan', 'FR'),
  ('Edeka', 'DE'),
  ('Rewe', 'DE'),
  ('Lidl', 'DE'),
  ('Aldi', 'DE'),
  ('Kaufland', 'DE');

create table public.food_price (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.food(id) on delete cascade,
  store_id uuid not null references public.store(id) on delete cascade,
  price numeric not null,
  currency text not null default 'EUR',
  source text not null default 'manual' check (source in ('manual', 'open_prices_api')),
  updated_at timestamptz not null default now(),
  unique (food_id, store_id)
);
create index food_price_food_idx on public.food_price (food_id);

alter table public.food_price enable row level security;
create policy "food price readable by authenticated users" on public.food_price for select using (auth.role() = 'authenticated');

-- pricing now lives per-store; drop the single-price columns from `food`
alter table public.food drop column if exists price;
alter table public.food drop column if exists currency;
