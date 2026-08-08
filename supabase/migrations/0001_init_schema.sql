-- Core schema for gym nutrition/budget app
-- Entities per product spec section 26, adapted to Supabase (auth.users is managed by Supabase Auth)

create table public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  age int,
  sex text check (sex in ('male', 'female', 'other')),
  height_cm numeric,
  weight_kg numeric,
  country text not null,
  city_region text,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  currency text not null default 'EUR',
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  goal text check (goal in ('bulk', 'cut', 'maintain', 'recomposition', 'performance')),
  target_weight_kg numeric,
  budget_amount numeric,
  budget_period text check (budget_period in ('daily', 'weekly', 'monthly')),
  diet_type text check (diet_type in ('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'other')),
  allergies text[] default '{}',
  dislikes text[] default '{}',
  meals_per_day int default 3,
  cooking_minutes_per_day int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.food (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  country text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fiber_g numeric,
  serving_size numeric not null,
  serving_unit text not null,
  price numeric not null,
  currency text not null,
  updated_at timestamptz not null default now()
);
create index food_country_category_idx on public.food (country, category);

create table public.meal_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profile(id) on delete cascade,
  plan_date date not null,
  daily_calories numeric,
  daily_protein_g numeric,
  daily_carbs_g numeric,
  daily_fat_g numeric,
  daily_cost numeric,
  meals jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date)
);
create index meal_plan_user_date_idx on public.meal_plan (user_id, plan_date);

create table public.food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profile(id) on delete cascade,
  log_date date not null,
  meal_slot text,
  food_id uuid references public.food(id),
  quantity numeric,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  cost numeric,
  created_at timestamptz not null default now()
);
create index food_log_user_date_idx on public.food_log (user_id, log_date);

-- Rollup target for food_log older than 90 days (see 0002_retention_jobs.sql)
create table public.food_log_monthly_summary (
  user_id uuid not null references public.user_profile(id) on delete cascade,
  month date not null,
  avg_calories numeric,
  avg_protein_g numeric,
  avg_carbs_g numeric,
  avg_fat_g numeric,
  total_cost numeric,
  primary key (user_id, month)
);

-- Kept indefinitely: core progress-chart data, tiny volume (~1 row/week/user)
create table public.weight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profile(id) on delete cascade,
  weight_kg numeric not null,
  log_date date not null,
  created_at timestamptz not null default now()
);
create index weight_log_user_date_idx on public.weight_log (user_id, log_date);

-- History of sent push notifications, purged periodically (see 0002_retention_jobs.sql)
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profile(id) on delete cascade,
  type text not null,
  sent_at timestamptz not null default now()
);
create index notification_log_user_idx on public.notification_log (user_id, sent_at);

-- Row Level Security: every user-owned table must only be readable/writable by its owner
alter table public.user_profile enable row level security;
alter table public.meal_plan enable row level security;
alter table public.food_log enable row level security;
alter table public.food_log_monthly_summary enable row level security;
alter table public.weight_log enable row level security;
alter table public.notification_log enable row level security;

create policy "own profile" on public.user_profile for all using (auth.uid() = id);
create policy "own meal plans" on public.meal_plan for all using (auth.uid() = user_id);
create policy "own food log" on public.food_log for all using (auth.uid() = user_id);
create policy "own food log summary" on public.food_log_monthly_summary for all using (auth.uid() = user_id);
create policy "own weight log" on public.weight_log for all using (auth.uid() = user_id);
create policy "own notification log" on public.notification_log for all using (auth.uid() = user_id);

-- food table is shared reference data: readable by any authenticated user, not user-owned
alter table public.food enable row level security;
create policy "food readable by authenticated users" on public.food for select using (auth.role() = 'authenticated');
