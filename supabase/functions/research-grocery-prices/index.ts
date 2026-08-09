// Supabase Edge Function (Deno runtime). Researches current budget/premium grocery
// prices for a country via Gemini with Google Search grounding, caches the result in
// public.grocery_price_research. Called from the app right after onboarding submits
// (see context/ProfileContext.tsx's createProfile), and only re-researches if the
// cached row for that country is missing or older than 30 days - the prices aren't
// personal, so every signup from the same country reuses the same cached research
// instead of paying for it again.
//
// Required secrets (set via `supabase secrets set NAME=value`, never commit these):
//   GEMINI_API_KEY   - free-tier Google AI Studio key, server-side only, never in app code
// Already available automatically in every Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ITEMS: Record<string, string> = {
  'chicken-breast': 'raw chicken breast',
  oats: 'rolled oats',
  carrots: 'fresh carrots',
  'tuna-canned': 'canned tuna in water',
  bread: 'whole grain bread',
  'ground-beef': 'ground beef (5-15% fat)',
  rice: 'white rice, dry',
  eggs: 'eggs (chicken, medium)',
  pasta: 'whole wheat pasta, dry',
};

const STALE_AFTER_DAYS = 30;
const GEMINI_MODEL = 'gemini-flash-latest'; // Google-maintained alias for the current flash model - avoids hardcoding a dated snapshot that later gets deprecated (a pinned "gemini-2.5-flash" already 404'd for new API keys once)

type Tier = 'budget' | 'premium';
type PriceTable = Record<string, Record<Tier, number>>;

function buildPrompt(country: 'FR' | 'DE'): string {
  const countryName = country === 'FR' ? 'France' : 'Germany';
  const itemList = Object.entries(ITEMS).map(([id, label]) => `- ${id}: ${label}`).join('\n');
  return `Search the web for current typical supermarket prices in ${countryName} for these grocery items:
${itemList}

For each item, find:
- "budget": a typical price at a discount/budget supermarket (e.g. Lidl, Aldi, Action) in EUR per 100g
- "premium": a typical price for a quality/organic option at a mainstream or premium supermarket in EUR per 100g

Respond with ONLY a JSON object, no other text, no markdown code fences, in exactly this shape:
{"chicken-breast":{"budget":0.00,"premium":0.00},"oats":{"budget":0.00,"premium":0.00}, ...one entry per item id above...}`;
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
    if (!parsed[id] || typeof parsed[id].budget !== 'number' || typeof parsed[id].premium !== 'number') {
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
