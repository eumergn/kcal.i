# Gym Nutrition & Budget App

## Stack
- Database + Auth: Supabase (Postgres)
- Backend logic: Supabase Edge Functions (meal-generation/budget-optimization engine)
- Mobile app: React Native (Expo)

## Setup
1. Create a free project at supabase.com
2. Link this repo: `npx supabase link --project-ref <your-project-ref>`
3. Apply migrations: `npx supabase db push`

## Migrations
- `0001_init_schema.sql` - core tables (user_profile, food, meal_plan, food_log, weight_log, notification_log) with Row Level Security so each user only sees their own data
- `0002_retention_jobs.sql` - pg_cron jobs for data retention:
  - `food_log` rolled up into monthly summaries + pruned after 90 days
  - unused `meal_plan` rows purged after 30 days
  - `notification_log` purged after 60 days
  - `weight_log` is never pruned (core progress-chart data, negligible size)
- `0003_store_pricing.sql` - multi-store pricing (`store`, `food_price`): one price row per (food, store) instead of a single price per food, so the engine can pick the cheapest chain per item

## Country & pricing scope
Launch countries: **France** and **Germany** (`user_profile.country`, values `FR`/`DE`).

Seeded stores:
- FR: Leclerc, Carrefour, Intermarché, Lidl, Auchan
- DE: Edeka, Rewe, Lidl, Aldi, Kaufland

**Pricing strategy - no live retailer scraping.** Neither France nor Germany's major chains expose a public pricing API. France has Open Food Facts' crowdsourced "Open Prices" dataset (data.gouv.fr) as a supplementary source, but coverage is patchy. Live-scraping retailer sites is a ToS/legal risk and a maintenance burden disproportionate to an unvalidated MVP.

For MVP: manually curate prices for a staple list of ~150-200 foods per store (the items that actually drive meal plans - chicken, eggs, rice, oats, milk, etc.), stored in `food_price` with `source = 'manual'`, refreshed periodically (e.g. monthly). The meal-generation engine picks the cheapest available store per food and totals the plan cost, e.g. "cheapest at Lidl: €X". Prices are always presented as estimates, per the spec's own safety requirements (§27).

V2 candidate: integrate Open Food Facts' Open Prices API as a supplementary `source = 'open_prices_api'` feed, or evaluate a paid grocery-data provider if pricing accuracy becomes a differentiator worth paying for.

## Meal-generation / budget-optimization engine
`engine/` - standalone TypeScript, no DB/UI dependency yet, built first and validated with
real sample data before touching the app (highest-risk piece of the product).

- `nutrition.ts` - BMR (Mifflin-St Jeor) → TDEE → goal calories (moderate, non-extreme
  adjustments per goal) → protein/carb/fat/fiber targets, with a hard calorie floor safety clamp
- `planner.ts` - greedy heuristic: picks protein/carb/produce items ranked by macro density
  (not macro-per-cost - cost-per-gram-of-protein alone favours legumes over lean protein and
  produces absurd portions), solves both items' grams simultaneously to avoid double-counting
  overlapping macros, rotates selection by least-used-so-far for meal variety, then runs a
  greedy budget-repair pass (swap to cheaper same-category alternatives) if over budget
- `sampleData.ts` - ~20 illustrative FR foods with placeholder multi-store prices (not curated
  real data - stands in for the `food_price` table until that's seeded)

Run it: `cd engine && npm install`
- `npm run example` - full day, omnivore/cut/€10 budget, prints the plan
- `npm run example:constraints` - vegan + gluten-free + tight €3 budget, asserts zero
  allergen/diet violations and shows the budget-repair loop's behavior when the true cheapest
  plan still can't fit an unrealistic budget

Known limitation: fat isn't independently solved (only protein+carbs are), so calories can
drift ~15-25% from target depending on the fat content of the foods chosen. Acceptable for
MVP (spec explicitly treats nutrition values as estimates) - revisit only if this proves to
matter in practice, e.g. with a 3-variable solve, before reaching for a real LP solver.

## Mobile app
`app/` - Expo + expo-router, TypeScript. Dark, ring-based "instrument" visual identity
(see `DESIGN.md`). Tabs: **Home** (real ring UI - calories/protein/carbs/fat, tap a meal's
time to view/add/remove/modify its ingredients, tap TODAY to cycle day/week/month),
**Track**, **[camera scan button]**, **Grocery** (monthly budget + editable per-food prices
+ purchase tracking), **Profile** (sign-out). Plan tab was removed - its role moved into
the Home header's date navigator.

**Auth**: real Supabase email/password auth is wired (`app/(auth)/sign-in|sign-up|forgot-password.tsx`,
`context/AuthContext.tsx`, `lib/supabase.ts`) and gates the whole app - no session, no
access to the tabs. **Needs your actual Supabase project's URL + anon key** in `app/.env`
(copy `.env.example`) before it does anything; auth screens show a clear banner and disable
their buttons until that's set.

**Barcode scanning**: the camera tab button opens a barcode scanner (`expo-camera`) that
looks up scanned products via OpenFoodFacts' free API (no key needed, strong French product
coverage) and adds them to a shared, in-memory food catalog so they show up as "Add food"
options in any meal. Not yet persisted to a backend - resets on app reload, same as the rest
of the plan data.

Run it: `cd app && npx expo start` - scan the QR code with Expo Go on your phone (no App
Store/Play Store account needed for this). Verified here via `npx tsc --noEmit` (clean) and
`npx expo export --platform web` (all routes bundle successfully) since no simulator/device
is available in this environment - you should still open it in Expo Go yourself before
trusting the visual layout, and the camera specifically can only be tested on a real device.

## Next steps
- Get real Supabase URL/anon key into `app/.env` so auth actually connects
- Port the engine into a Supabase Edge Function, backed by the real `food`/`food_price` tables
- Manually seed `food` + `food_price` for FR and DE staples
- Persist plan/catalog state (currently in-memory `PlanContext`, lost on reload) to Supabase
- Build out the Track and Profile tabs (still placeholders beyond sign-out)
