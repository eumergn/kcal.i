// Two real palettes - a manual in-app toggle switches between them (see
// context/ThemeContext.tsx), not the OS setting. Pushed to true black/white for
// maximum contrast: background and card share the same value in each theme, with
// only a hairline border (cardDivider) defining card edges, rather than a tinted
// "elevated surface" fill. Ring colors deepen a bit in light mode so they still
// read clearly against white instead of looking washed out.
export default {
  dark: {
    text: '#FFFFFF',
    secondaryText: '#A1A1AA',
    background: '#000000',
    card: '#000000',
    cardDivider: '#2A2A2E',
    tint: '#3DDCFF',
    ringCalories: '#3DDCFF',
    ringProtein: '#FF5C7A',
    ringCarbs: '#FFB020',
    ringFat: '#5E9EFF',
    ringBudget: '#2DD4BF',
    ringTrack: '#2A2A2E',
    success: '#30D158',
    tabIconDefault: '#5A5A5F',
    tabIconSelected: '#3DDCFF',
  },
  light: {
    text: '#000000',
    secondaryText: '#52525B',
    background: '#FFFFFF',
    card: '#FFFFFF',
    cardDivider: '#D4D4D8',
    tint: '#0EA5B7',
    ringCalories: '#0EA5B7',
    ringProtein: '#E11D48',
    ringCarbs: '#D97706',
    ringFat: '#2563EB',
    ringBudget: '#0D9488',
    ringTrack: '#D4D4D8',
    success: '#16A34A',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0EA5B7',
  },
};
