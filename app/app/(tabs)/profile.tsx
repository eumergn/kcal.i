import { useRef, useState } from 'react';
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

type PopoverKind = 'water' | 'budget' | null;

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session, signOut } = useAuth();
  const { scheme: appScheme, toggle: toggleTheme } = useAppTheme();
  const { units, waterGoalLiters, notificationsEnabled, setUnits, setWaterGoalLiters, setNotificationsEnabled } = useSettings();
  const { profile, updateProfile } = useProfile();
  const slideStyle = useTabSlide('profile');

  const waterRowRef = useRef<RNView>(null);
  const budgetRowRef = useRef<RNView>(null);
  const [openPopover, setOpenPopover] = useState<PopoverKind>(null);
  const [anchorTop, setAnchorTop] = useState(0);

  const [waterDraft, setWaterDraft] = useState(waterGoalLiters);
  const [budgetAmountText, setBudgetAmountText] = useState('');
  const [budgetPeriod, setBudgetPeriodDraft] = useState<BudgetPeriod>('monthly');
  const [savingBudget, setSavingBudget] = useState(false);

  const openWaterPopover = () => {
    setWaterDraft(waterGoalLiters);
    waterRowRef.current?.measureInWindow((_x, y, _w, h) => {
      setAnchorTop(y + h + 8);
      setOpenPopover('water');
    });
  };

  const openBudgetPopover = () => {
    setBudgetAmountText(profile ? String(profile.budget_amount) : '');
    setBudgetPeriodDraft(profile?.budget_period ?? 'monthly');
    budgetRowRef.current?.measureInWindow((_x, y, _w, h) => {
      setAnchorTop(y + h + 8);
      setOpenPopover('budget');
    });
  };

  const applyWaterGoal = () => {
    setWaterGoalLiters(waterDraft);
    setOpenPopover(null);
  };

  const applyBudget = async () => {
    const parsed = parseFloat(budgetAmountText.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setSavingBudget(true);
    await updateProfile({ budget_amount: parsed, budget_period: budgetPeriod });
    setSavingBudget(false);
    setOpenPopover(null);
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
          {/* Instant, no-confirmation changes get a switch, not a chevron - a chevron
              implies "opens something to review", which a switch doesn't need. */}
          <View style={styles.settingsRow} lightColor="transparent" darkColor="transparent">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name={appScheme === 'dark' ? 'moon-o' : 'sun-o'} size={16} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Theme</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{appScheme === 'dark' ? 'Dark' : 'Light'}</Text>
            <Switch
              value={appScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: c.cardDivider, true: c.text }}
              thumbColor={c.card}
            />
          </View>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <View style={styles.settingsRow} lightColor="transparent" darkColor="transparent">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="balance-scale" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Units</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{units === 'metric' ? 'kg, cm' : 'lb, in'}</Text>
            <Switch
              value={units === 'imperial'}
              onValueChange={(v) => setUnits(v ? 'imperial' : 'metric')}
              trackColor={{ false: c.cardDivider, true: c.text }}
              thumbColor={c.card}
            />
          </View>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          {/* These two open something to review before committing, so a chevron is
              accurate here - it now genuinely means "opens a small panel". */}
          <Pressable ref={waterRowRef} onPress={openWaterPopover} style={styles.settingsRow} accessibilityRole="button" accessibilityLabel="Change daily water goal">
            <RNView style={[styles.settingsIconWrap, { backgroundColor: c.cardDivider }]}>
              <FontAwesome name="tint" size={15} color={c.text} />
            </RNView>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Water goal</Text>
            <Text style={[styles.settingsValue, { color: c.secondaryText }]}>{waterGoalLiters.toFixed(1)} L / day</Text>
            <FontAwesome name="chevron-right" size={13} color={c.secondaryText} />
          </Pressable>

          <View style={[styles.settingsDivider, { backgroundColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent" />

          <Pressable ref={budgetRowRef} onPress={openBudgetPopover} style={styles.settingsRow} accessibilityRole="button" accessibilityLabel="Change grocery budget">
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

      <Modal visible={openPopover !== null} transparent animationType="fade" onRequestClose={() => setOpenPopover(null)}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpenPopover(null)} />
        <View style={[styles.popover, { top: anchorTop, backgroundColor: c.card, borderColor: c.cardDivider }]} lightColor="transparent" darkColor="transparent">
          {openPopover === 'water' && (
            <>
              <Text style={[styles.popoverTitle, { color: c.text }]}>Daily water goal</Text>
              <RNView style={styles.chipRow}>
                {WATER_GOAL_OPTIONS.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setWaterDraft(v)}
                    style={[
                      styles.waterChip,
                      { borderColor: v === waterDraft ? c.text : c.cardDivider, backgroundColor: v === waterDraft ? c.text : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.waterChipText, { color: v === waterDraft ? c.background : c.text }]}>{v.toFixed(1)}L</Text>
                  </Pressable>
                ))}
              </RNView>
              <Pressable onPress={applyWaterGoal} style={[styles.applyButton, { backgroundColor: c.text }]}>
                <Text style={[styles.applyButtonText, { color: c.background }]}>Apply</Text>
              </Pressable>
            </>
          )}

          {openPopover === 'budget' && (
            <>
              <Text style={[styles.popoverTitle, { color: c.text }]}>Grocery budget</Text>
              <AuthTextInput
                placeholder="e.g. 150"
                keyboardType="decimal-pad"
                value={budgetAmountText}
                onChangeText={setBudgetAmountText}
              />
              <RNView style={{ marginTop: 12 }}>
                <ChipSelect options={PERIOD_OPTIONS} selected={[budgetPeriod]} onToggle={(v) => setBudgetPeriodDraft(v as BudgetPeriod)} />
              </RNView>
              <Pressable
                onPress={applyBudget}
                disabled={savingBudget}
                style={[styles.applyButton, { backgroundColor: c.text, opacity: savingBudget ? 0.5 : 1 }]}
              >
                <Text style={[styles.applyButtonText, { color: c.background }]}>Apply</Text>
              </Pressable>
            </>
          )}
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

  popover: {
    position: 'absolute', left: 20, right: 20, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  popoverTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  waterChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  waterChipText: { fontSize: 13, fontWeight: '700' },
  applyButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  applyButtonText: { fontSize: 14, fontWeight: '700' },
});
