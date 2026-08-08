# Design

<!-- impeccable:design-schema 1 -->

## Direction contract

**THESIS**: This should feel like a futuristic personal instrument - a HUD readout, not a spreadsheet or a nutrition-tracker dashboard. Refuses both the flat light "utility app" default and a rainbow-of-accent-colors default.

**OWN-WORLD**: Near-black surfaces (fixed identity, no light-mode variant). One disciplined signature accent (cyan, `#3DDCFF`) drives every ring - not a hue per metric. Monospace numerals (SpaceMono, already bundled) for ring values, giving an instrument-panel feel. A frosted-glass (`expo-blur`) goal chip. Green reserved exclusively for the meal-eaten checkmark - the one "meaningful moment" per the 60/30/10 color discipline; nothing else gets a strong color.

**STORY**: The visitor opens the app, sees the calorie ring (largest device, center) with a soft accent glow behind it, two smaller rings for protein/budget beneath, then a dark meal list - marking a meal eaten triggers a spring-pop checkmark plus a brief accent-glow pulse behind the hero ring (the "peak moment" of the screen).

**FIRST VIEWPORT**: Header (TODAY / frosted-glass goal chip) → large calorie ring → two secondary rings side by side → meal list card.

**FORM**: Dark + ring-based - the user's explicit final call after directly comparing this against a light/linear-bar direction pulled from a real Cal AI screenshot. Product preference overrides the literal reference once both were seen side by side.

## Platform

adaptive (iOS + Android via Expo/React Native)

## Color strategy

60/30/10, strictly: 60% near-black background, 30% card surface + light text, 10% (or less) signature cyan accent used for every ring/interactive indicator. Green is a deliberate, singular exception reserved for the eaten-checkmark moment only - never used elsewhere, per "save strong colors for meaningful moments."

- `background` / `card` - near-black surface + one-step-lighter elevated card
- `text` / `secondaryText` - near-white / muted gray-blue
- `accent` / `accentGlow` - signature cyan, used identically across all three rings, plus a translucent glow variant for the peak-moment pulse
- `success` - green, reserved for the meal-eaten checkmark exclusively

## Typography

System sans for all UI text (labels, meal names, body). **SpaceMono** (already bundled, previously unused) exclusively for ring numerals - an intentional second face, justified by the "monospace for large numbers/stats" convention, not a reflexive choice. Scale held to ~4 sizes (36/17/15/12) and 2 weights (700/600) throughout - no stray 400/500/800 values.

## Components

- `ProgressRing`: `react-native-svg` circle with animated `strokeDashoffset` (JS-driven `Animated.timing`, not native-driver-eligible). One shared accent color across all three ring instances - differentiated by size/position, not hue.
- Goal chip: `expo-blur` `BlurView` (`intensity=40`, `tint="dark"`) - the one deliberate glassmorphism touch on this screen, matching the installed `glassmorphism` skill's guidance to reserve it for small overlay/chip elements, not overuse it.
- Hero glow: a soft translucent circle behind the calorie ring, opacity-pulsed via `Animated` on every totals change (not on mount) - the screen's one authored "peak moment," per Peak-End emotional design guidance.
- Checkmark control: unchanged pop-in spring behavior; fill is the reserved `success` green, check icon near-black for contrast on the bright fill.

## What this replaces

Three visual systems preceded this one: (1) the original light "native Operate-mode" look, (2) a light/warm card-and-bar system built directly off a real Cal AI screenshot, and (3) an unpolished first pass at dark+rings that used three different ring colors (one per metric) and no monospace/glow/glass treatment - this version corrects that pass using the 60/30/10 rule and Peak-End guidance instead of ad hoc color choices.
