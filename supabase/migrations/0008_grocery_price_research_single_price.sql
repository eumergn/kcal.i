-- No schema change (prices is jsonb, shape-flexible) - documents the value shape
-- change from { [itemId]: { budget, premium } } to { [itemId]: number }, now covering
-- the full foods.ts roster instead of a fixed 9-item subset. No cached rows existed
-- yet at the time of this change, so there is no old-shape data to migrate.

comment on column public.grocery_price_research.prices is
  '{ [itemId]: number } - EUR per 100g, one real researched price per food (see constants/foods.ts for the full id list), used as a live override on top of the static priceFR/priceDE estimates.';
