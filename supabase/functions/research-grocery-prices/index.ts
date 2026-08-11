// Supabase Edge Function (Deno runtime). Researches current typical grocery prices for
// a country via Gemini with Google Search grounding, caches the result in
// public.grocery_price_research. Called from the app right after onboarding submits
// (see context/ProfileContext.tsx's createProfile), and only re-researches if the
// cached row for that country is missing or older than 30 days - the prices aren't
// personal, so every signup from the same country reuses the same cached research
// instead of paying for it again.
//
// One real per-100g price per food (not a budget/premium tier pair) - covers the full
// lib/mealPlanner.ts food roster (constants/foods.ts), not just a fixed subset. The
// app uses this as a live override on top of foods.ts's static priceFR/priceDE
// estimates when available; the static prices remain the fallback (see grocery.tsx).
//
// Required secrets (set via `supabase secrets set NAME=value`, never commit these):
//   GEMINI_API_KEY   - free-tier Google AI Studio key, server-side only, never in app code
// Already available automatically in every Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ITEMS: Record<string, string> = {
  'chicken-breast': 'raw chicken breast',
  eggs: 'eggs (chicken, medium)',
  'greek-yogurt': 'plain greek yogurt',
  'tuna-canned': 'canned tuna in water',
  'ground-beef': 'ground beef (5-15% fat)',
  'cottage-cheese': 'cottage cheese',
  tofu: 'firm tofu',
  lentils: 'dry or canned lentils',
  chickpeas: 'dry or canned chickpeas',
  rice: 'white rice, dry',
  oats: 'rolled oats',
  potatoes: 'potatoes',
  pasta: 'whole wheat pasta, dry',
  bread: 'whole grain bread',
  banana: 'bananas',
  apple: 'apples',
  'frozen-veg': 'frozen mixed vegetables',
  carrots: 'fresh carrots',
  spinach: 'fresh spinach',
  milk: 'semi-skimmed milk',
  'olive-oil': 'olive oil',
};

const STALE_AFTER_DAYS = 30;
const GEMINI_MODEL = 'gemini-flash-latest'; // Google-maintained alias for the current flash model - avoids hardcoding a dated snapshot that later gets deprecated (a pinned "gemini-2.5-flash" already 404'd for new API keys once)

type PriceTable = Record<string, number>;

function buildPrompt(country: 'FR' | 'DE'): string {
  const countryName = country === 'FR' ? 'France' : 'Germany';
  const itemList = Object.entries(ITEMS).map(([id, label]) => `- ${id}: ${label}`).join('\n');
  return `Search the web for current typical mainstream supermarket prices in ${countryName} for these grocery items:
${itemList}

For each item, find a single typical price in EUR per 100g at a mainstream supermarket (not a discount-only or luxury-only price - a representative everyday price).

Respond with ONLY a JSON object, no other text, no markdown code fences, in exactly this shape:
{"chicken-breast":0.00,"eggs":0.00, ...one entry per item id above, value is EUR per 100g...}`;
}

async function researchCountry(country: 'FR' | 'DE'): Promise<PriceTable> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(country) }] }],
        tools: [{ google_search: {} }],
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text: string = parts.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new Error('No text in Gemini response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in model response');

  const parsed = JSON.parse(jsonMatch[0]) as PriceTable;
  for (const id of Object.keys(ITEMS)) {
    if (typeof parsed[id] !== 'number') {
      throw new Error(`Missing or malformed price for "${id}" in model response`);
    }
  }
  return parsed;
}

Deno.serve(async (req) => {
  try {
    const { country } = await req.json();
    if (country !== 'FR' && country !== 'DE') {
      return new Response(JSON.stringify({ error: 'country must be FR or DE' }), { status: 400 });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: cached } = await supabase
      .from('grocery_price_research')
      .select('prices, researched_at')
      .eq('country', country)
      .maybeSingle();

    const isStale = !cached || Date.now() - new Date(cached.researched_at).getTime() > STALE_AFTER_DAYS * 86400000;
    if (cached && !isStale) {
      return new Response(JSON.stringify({ prices: cached.prices, cached: true }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    const prices = await researchCountry(country);
    await supabase.from('grocery_price_research').upsert({ country, prices, researched_at: new Date().toISOString() });

    return new Response(JSON.stringify({ prices, cached: false }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
});
