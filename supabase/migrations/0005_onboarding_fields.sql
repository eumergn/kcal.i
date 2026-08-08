-- Onboarding needs one field not already in user_profile (0001) - everything else
-- (name, sex, age, height, weight, goal, country, budget, diet_type, allergies) exists.
alter table public.user_profile add column gym_days_per_week int check (gym_days_per_week between 0 and 7);
