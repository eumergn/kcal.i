-- RLS was enabled on food_price (its sibling table, same migration) but store itself
-- was missed - Supabase's security advisor flags this as critical since a table with
-- RLS off has no row-level gate on the public API at all. store only holds seeded
-- reference data (supermarket chain names/countries, no user data), so this closes an
-- unrestricted write surface rather than a data-leak risk.

alter table public.store enable row level security;
create policy "store readable by authenticated users" on public.store for select using (auth.role() = 'authenticated');
