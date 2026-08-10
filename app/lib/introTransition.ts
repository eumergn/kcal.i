/**
 * Sign-in's logo sits inside a vertically-centered ScrollView, so its exact screen
 * position depends on the total height of everything stacked below it (title,
 * subtitle, form, footer) - not something intro.tsx can compute without actually
 * seeing sign-in's real layout. Sign-in reports its logo's measured center-Y here via
 * onLayout the moment it renders; intro reads it back to know exactly where to glide
 * its own logo to, so the handoff between the two screens lines up instead of being
 * a guess. Only holds for the life of the JS bundle - fine, since sign-in mounts
 * (and re-reports) every single time a signed-out user reaches it, and a completely
 * fresh install's very first play falls back to an estimate in intro.tsx.
 */
let cachedLogoCenterY: number | null = null;

export function setSignInLogoCenterY(y: number) {
  cachedLogoCenterY = y;
}

export function getSignInLogoCenterY(): number | null {
  return cachedLogoCenterY;
}
