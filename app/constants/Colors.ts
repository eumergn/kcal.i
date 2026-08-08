// Two real palettes - a manual in-app toggle switches between them (see
// context/ThemeContext.tsx), not the OS setting. True black/white for maximum
// contrast: background and card share the same value in each theme, separated only
// by a hairline border (cardDivider), not a tinted "elevated surface" fill.
// Ring colors: calories=red (fire), protein=green (drumstick), carbs/fat swapped
// from the original assignment per product decision. Ring colors deepen a bit in
// light mode so they still read clearly against white instead of looking washed out.
export default {
  dark: {
    text: '#FFFFFF',
    secondaryText: '#A1A1AA',
    background: '#000000',
    card: '#000000',
    cardDivider: '#2A2A2E',
    tint: '#3DDCFF',
    ringCalories: '#FF453A',
    ringProtein: '#32D74B',
    ringCarbs: '#5E9EFF',
    ringFat: '#FFB020',
    ringBudget: '#2DD4BF',
    ringTrack: '#2A2A2E',
    success: '#30D158',
    tabIconDefault: '#5A5A5F',
    tabIconSelected: '#FFFFFF',
    tabActiveBackground: '#242426',
  },
  light: {
    text: '#000000',
    secondaryText: '#52525B',
    background: '#FFFFFF',
    card: '#FFFFFF',
    cardDivider: '#D4D4D8',
    tint: '#0EA5B7',
    ringCalories: '#DC2626',
    ringProtein: '#16A34A',
    ringCarbs: '#2563EB',
    ringFat: '#D97706',
    ringBudget: '#0D9488',
    ringTrack: '#D4D4D8',
    success: '#16A34A',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#000000',
    tabActiveBackground: '#E4E4E7',
  },
};
