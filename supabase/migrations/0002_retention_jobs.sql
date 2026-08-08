-- Scheduled data retention: pg_cron runs these on a schedule inside Postgres itself.
-- weight_log is intentionally NEVER pruned here - it's tiny (~1 row/week/user) and is the
-- core long-term progress signal (spec section 18). Do not add a job for it.

create extension if not exists pg_cron;

-- 1) food_log: roll granular rows older than 90 days into a monthly summary, then delete them.
--    Keeps the last 90 days at full daily detail; older history still supports the
--    "calories/protein/spending over time" charts via food_log_monthly_summary, just at
--    monthly granularity instead of per-meal.
create or replace function public.rollup_old_food_logs() returns void as $$
begin
  insert into public.food_log_monthly_summary (user_id, month, avg_calories, avg_protein_g, avg_carbs_g, avg_fat_g, total_cost)
  select
    user_id,
    date_trunc('month', log_date)::date,
    avg(calories),
    avg(protein_g),
    avg(carbs_g),
    avg(fat_g),
    sum(cost)
  from public.food_log
  where log_date < (now() - interval '90 days')::date
  group by user_id, date_trunc('month', log_date)
  on conflict (user_id, month) do update set
    avg_calories = excluded.avg_calories,
    avg_protein_g = excluded.avg_protein_g,
    avg_carbs_g = excluded.avg_carbs_g,
    avg_fat_g = excluded.avg_fat_g,
    total_cost = excluded.total_cost;

  delete from public.food_log where log_date < (now() - interval '90 days')::date;
end;
$$ language plpgsql security definer;

select cron.schedule(
  'rollup-old-food-logs',
  '0 4 1 * *',  -- 04:00 on the 1st of every month
  $$ select public.rollup_old_food_logs() $$
);

-- 2) meal_plan: a generated daily plan the user never acted on has no value after ~30 days
--    (nobody needs "what could I have eaten on March 3rd"). Straight delete, no rollup.
select cron.schedule(
  'purge-old-meal-plans',
  '0 3 * * *',  -- daily at 03:00
  $$ delete from public.meal_plan where plan_date < (now() - interval '30 days')::date $$
);

-- 3) notification_log: sent-notification history has no product value past ~60 days.
select cron.schedule(
  'purge-old-notification-logs',
  '0 3 * * *',  -- daily at 03:00
  $$ delete from public.notification_log where sent_at < now() - interval '60 days' $$
);
