import { useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Switch, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useProfile, BudgetPeriod } from '@/context/ProfileContext';
import { useTabSlide } from '@/components/useTabSlide';
import { AuthTextInput } from '@/components/AuthTextInput';
import { ChipSelect } from '@/components/ChipSelect';

const WATER_GOAL_OPTIONS = [1.5, 2, 2.5, 3, 3.5];
const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session, signOut } = useAuth();
  const { toggle: toggleTheme } = useAppTheme();
  const { units, waterGoalLiters, notificationsEnabled, setUnits, setWaterGoalLiters, setNotificationsEnabled } = useSettings();
  const { profile, updateProfile } = useProfile();
  const slideStyle = useTabSlide('profile');

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetAmountText, setBudgetAmountText] = useState('');
  const [budgetPeriod, setBudgetPeriodDraft] = useState<BudgetPeriod>('monthly');
  const [savingBudget, setSavingBudget] = useState(false);

  const cycleWaterGoal = () => {
    const currentIndex = WATER_GOAL_OPTIONS.indexOf(waterGoalLiters);
    const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % WATER_GOAL_OPTIONS.length;
    setWaterGoalLiters(WATER_GOAL_OPTIONS[nextIndex]);
  };

  const openBudgetModal = () => {
    setBudgetAmountText(profile ? String(profile.budget_amount) : '');
    setBudgetPeriodDraft(profile?.budget_period ?? 'monthly');
    setBudgetModalVisible(true);
  };

  const saveBudget = async () => {
    const parsed = parseFloat(budgetAmountText.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setSavingBudget(true);
    await updateProfile({ budget_amount: parsed, budget_period: budgetPeriod });
    setSavingBudget(false);
    setBudgetModalVisible(false);
  };

  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>Profile</Text>
        {session?.user?.email && (
          <Text style={[styles.email, { color: c.secondaryText }]}>Signed in as {session.user.email}</Text>
        )}
        <Text style={[styles.subtitle, { color: c.secondaryText }]}>
          Goal, diet and allergy settings, coming soon.
        </Text>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Pressable
            onPress={toggleTheme}
            style={styles.settingsRow}
            accessibilityRole="button"
            accessibilityLabel={scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name={scheme === 'dark' ? 'moon-o' : 'sun-o'} size={16} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Theme</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{scheme === 'dark' ? 'Dark' : 'Light'}</Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <Pressable
            onPress={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
            style={styles.settingsRow}
            accessibilityRole="button"
            accessibilityLabel="Change measurement units"
          >
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="balance-scale" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Units</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{units === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}</Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <Pressable onPress={cycleWaterGoal} style={styles.settingsRow} accessibilityRole="button" accessibilityLabel="Change daily water goal">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="tint" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Water goal</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{waterGoalLiters.toFixed(1)} L / day</Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <Pressable onPress={openBudgetModal} style={styles.settingsRow} accessibilityRole="button" accessibilityLabel="Change grocery budget">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="money" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Grocery budget</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>
              {profile ? `${profile.budget_amount.toFixed(0)} EUR / ${profile.budget_period}` : '...'}
            </Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <View style={styles.settingsRow} lightColor="transparent" darkColor="transparent">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="bell-o" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Meal reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: c.cardDivider, true: c.ringCalories }}
              thumbColor={c.card}
            />
          </View>
        </View>

        <Pressable onPress={signOut} style={[styles.signOutButton, { backgroundColor: c.cardDivider }]}>
          <Text style={[styles.signOutText, { color: c.ringProtein }]}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={budgetModalVisible} transparent animationType="fade" onRequestClose={() => setBudgetModalVisible(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={() => setBudgetModalVisible(false)} />
        <View style={styles.modalWrap} lightColor="transparent" darkColor="transparent">
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Grocery budget</Text>
            <Text style={[styles.modalSubtitle, { color: c.secondaryText }]}>
              How much do you want to spend on groceries, and how often?
            </Text>
            <AuthTextInput
              placeholder="e.g. 150"
              keyboardType="decimal-pad"
              value={budgetAmountText}
              onChangeText={setBudgetAmountText}
            />
            <View style={{ marginTop: 14 }} lightColor="transparent" darkColor="transparent">
              <ChipSelect options={PERIOD_OPTIONS} selected={[budgetPeriod]} onToggle={(v) => setBudgetPeriodDraft(v as BudgetPeriod)} />
            </View>
            <View style={styles.modalButtonRow} lightColor="transparent" darkColor="transparent">
              <Pressable onPress={() => setBudgetModalVisible(false)} style={[styles.modalCancelButton, { backgroundColor: c.cardDivider }]}>
                <Text style={[styles.modalCancelText, { color: c.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveBudget}
                disabled={savingBudget}
                style={[styles.modalSaveButton, { backgroundColor: c.text, opacity: savingBudget ? 0.5 : 1 }]}
              >
                <Text style={[styles.modalSaveText, { color: c.background }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 32, marginBottom: 16 },
  settingsCard: { borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  settingsDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  settingsIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  settingsValue: { fontSize: 14, fontWeight: '600' },

  signOutButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 32, alignItems: 'center' },
  signOutText: { fontSize: 14, fontWeight: '700' },

  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontWeight: '600', marginBottom: 16, lineHeight: 18 },
  modalButtonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelButton: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700' },
  modalSaveButton: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '700' },
});
