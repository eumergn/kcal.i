# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

A single person (personal use, not a multi-tenant product) doing gym-focused nutrition tracking: hitting a fitness goal (currently: cut) while staying within a small daily food budget, shopping at real supermarket chains in France or Germany.

## Product Purpose

Answers "what should I eat today to hit my fitness goal without blowing my food budget" - generates a daily meal plan from calorie/macro targets plus a real per-store grocery budget, and tracks which meals were actually eaten against that plan.

## Positioning

Budget- and location-aware meal planning: unlike generic calorie trackers, plans are priced against real store options (Leclerc, Carrefour, Intermarché, Lidl, Auchan for FR; Edeka, Rewe, Lidl, Aldi, Kaufland for DE) and pick the cheapest viable option per food, not just the nutritionally optimal one.

## Operating Context

Used once or twice a day (morning check-in, marking meals eaten through the day) on a personal phone via Expo Go during development. Backend: Supabase (Postgres + Auth, RLS-secured). Meal-generation/budget-optimization engine already built and validated standalone (engine/).

## Capabilities and Constraints

- react-native-reanimated/react-native-worklets must NOT be used - Reanimated 4 requires the New Architecture + custom dev client and crashes in stock Expo Go, which is how this app is tested. Animation must use React Native's built-in `Animated` API and `LayoutAnimation` only.
- No AI camera/photo food-scanning feature - explicitly out of scope (considered and declined in favor of a pure visual restyle).
- Real login (Supabase email/password) is the intended auth approach, not yet wired into the app.
- Currently only the Home tab has real content; Plan/Track/Grocery/Profile are placeholder screens.

## Brand Commitments

Visual direction: a premium black/dark aesthetic, explicitly referencing the real-world app **Cal AI** (calai.app) - sleek, modern, bold big numbers, circular progress rings, dark cards. This replaces the initial light/restrained "native Operate-mode" system already built for the Home screen.

## Evidence on Hand

Existing Home screen implementation at `app/(tabs)/index.tsx` (light theme, linear progress bars, checkmark meal list) - being replaced, treated as anti-reference for the new dark direction, not preserved.

## Product Principles

1. Budget realism over generic nutrition optimization - a plan that's nutritionally perfect but unaffordable is a failure.
2. Prices and nutrition values are estimates, never claimed as perfectly accurate (safety/trust requirement).
3. Personal-use tool, not a multi-tenant SaaS - favor simplicity over configurability where they'd conflict.
4. Motion and visuals serve the check-in task (Operate-adjacent even with a premium look) - a bold aesthetic, not gratuitous animation.
