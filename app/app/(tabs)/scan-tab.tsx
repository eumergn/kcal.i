import { View } from '@/components/Themed';

// This tab slot is never actually shown - the tab bar's custom button for it
// (ScanTabButton) intercepts the press and pushes the /scan modal instead of
// navigating here. The file exists only because Expo Router's file-based tabs
// require a route to back a Tabs.Screen entry. Named scan-tab (not scan) so this
// route's path doesn't collide with the real root-level /scan modal - (tabs) is a
// route group and doesn't affect the URL, so a same-named file here previously
// matched the same "/scan" path and silently won the navigation instead of the
// real camera screen.
export default function ScanTabStub() {
  return <View />;
}
