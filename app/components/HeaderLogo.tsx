import { Image, StyleSheet } from 'react-native';

export function HeaderLogo() {
  return <Image source={require('@/assets/images/icon.png')} style={styles.logo} accessibilityLabel="App icon" />;
}

const styles = StyleSheet.create({
  logo: { width: 28, height: 28, borderRadius: 8 },
});
