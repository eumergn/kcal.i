// Two real palettes now - a manual in-app toggle switches between them (see
// context/ThemeContext.tsx), not the OS setting. Ring colors deepen a bit in light
// mode so they still read clearly against a white card instead of looking washed out.
export default {
  dark: {
    text: '#F2F4F8',
    secondaryText: '#8B93A7',
    background: '#0A0B0F',
    card: '#15171F',
    cardDivider: '#232633',
    tint: '#3DDCFF',
    ringCalories: '#3DDCFF',
    ringProtein: '#FF5C7A',
    ringCarbs: '#FFB020',
    ringFat: '#5E9EFF',
    ringBudget: '#2DD4BF',
    ringTrack: '#232633',
    success: '#30D158',
    tabIconDefault: '#565B6E',
    tabIconSelected: '#3DDCFF',
  },
  light: {
    text: '#14161B',
    secondaryText: '#6B7280',
    background: '#F7F8FA',
    card: '#FFFFFF',
    cardDivider: '#E7E9EE',
    tint: '#0EA5B7',
    ringCalories: '#0EA5B7',
    ringProtein: '#E11D48',
    ringCarbs: '#D97706',
    ringFat: '#2563EB',
    ringBudget: '#0D9488',
    ringTrack: '#E7E9EE',
    success: '#16A34A',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0EA5B7',
  },
};
