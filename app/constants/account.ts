/**
 * Placeholder until real Supabase Auth is wired up - this will become the user's
 * actual signup timestamp. Until then, navigation can't go earlier than this date,
 * simulating "we only have data from when your account started."
 */
const DAYS_SINCE_ACCOUNT_CREATED = 5;

export const accountCreatedAt = (() => {
  const d = new Date();
  d.setDate(d.getDate() - DAYS_SINCE_ACCOUNT_CREATED);
  d.setHours(0, 0, 0, 0);
  return d;
})();
