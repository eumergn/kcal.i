import { View } from '@/components/Themed';

// This tab slot is never actually shown - the tab bar's custom button for it
// (ScanTabButton) intercepts the press and pushes the /scan modal instead of
// navigating here. The file exists only because Expo Router's file-based tabs
// require a route to back a Tabs.Screen entry.
export default function ScanTabStub() {
  return <View />;
}
