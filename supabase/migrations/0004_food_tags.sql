-- Diet-compatibility and allergen tags on food, required for hard-constraint filtering
-- in the meal-generation engine (allergies must never be violated - spec section 7/27).

alter table public.food add column diet_compatible text[] not null default '{omnivore}';
alter table public.food add column allergens text[] not null default '{}';

comment on column public.food.diet_compatible is
  'Diet types this food is valid for, e.g. {omnivore,vegetarian,vegan,pescatarian,halal,kosher}';
comment on column public.food.allergens is
  'Allergens present in this food, e.g. {gluten,dairy,egg,peanuts,nuts,shellfish,fish,soy}';
