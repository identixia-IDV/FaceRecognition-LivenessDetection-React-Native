import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setLandmarkMode } from 'face-recognition-sdk';
import {
  DEFAULT_SETTINGS,
  clearAllPeople,
  loadSettings,
  restoreDefaultSettings,
  saveSettings,
  type AppSettings,
  type LandmarkMode,
} from '../FaceDatabase';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

function inRange(v: number, min: number, max: number) {
  return Number.isFinite(v) && v >= min && v <= max;
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        keyboardType="decimal-pad"
        onChangeText={onChange}
      />
    </View>
  );
}

const LANDMARK_OPTIONS: LandmarkMode[] = [14, 68];

export default function SettingsScreen({}: Props) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const syncDraft = (s: AppSettings) => {
    setDraft({
      liveness_threshold: String(s.liveness_threshold),
      identify_threshold: String(s.identify_threshold),
      identity_hold_duration: String(s.identity_hold_duration),
    });
  };

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      syncDraft(s);
    });
  }, []);

  const commit = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch, liveness_level: 0 as const };
    setSettings(next);
    await saveSettings(next);
    if (patch.landmark_mode != null) {
      void setLandmarkMode(patch.landmark_mode).catch(() => {});
    }
  };

  const commitNum = async (
    key: keyof AppSettings,
    raw: string,
    min: number,
    max: number
  ) => {
    setDraft((d) => ({ ...d, [key]: raw }));
    const v = parseFloat(raw);
    if (!inRange(v, min, max)) return;
    await commit({ [key]: v } as Partial<AppSettings>);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Camera</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Camera lens</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => commit({ camera_lens: 'front' })}
          >
            <View
              style={[
                styles.radioDot,
                settings.camera_lens === 'front' && styles.radioDotOn,
              ]}
            />
            <Text style={styles.radioLabel}>Front</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => commit({ camera_lens: 'back' })}
          >
            <View
              style={[
                styles.radioDot,
                settings.camera_lens === 'back' && styles.radioDotOn,
              ]}
            />
            <Text style={styles.radioLabel}>Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardLabel, styles.spaced]}>Landmark mode</Text>
        <View style={styles.radioRow}>
          {LANDMARK_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={styles.radioItem}
              onPress={() => commit({ landmark_mode: m })}
            >
              <View
                style={[
                  styles.radioDot,
                  settings.landmark_mode === m && styles.radioDotOn,
                ]}
              />
              <Text style={styles.radioLabel}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Identity capture requirements</Text>
      <View style={styles.card}>
        <NumField
          label="Hold duration (sec)"
          value={draft.identity_hold_duration ?? ''}
          onChange={(v) => commitNum('identity_hold_duration', v, 0.1, 5)}
        />
      </View>

      <Text style={styles.sectionTitle}>Thresholds</Text>
      <View style={styles.card}>
        <NumField
          label="Liveness"
          value={draft.liveness_threshold ?? ''}
          onChange={(v) => commitNum('liveness_threshold', v, 0, 1)}
        />
        <NumField
          label="Identify"
          value={draft.identify_threshold ?? ''}
          onChange={(v) => commitNum('identify_threshold', v, 0, 1)}
        />
      </View>

      <Text style={styles.sectionTitle}>Reset</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={async () => {
            const s = await restoreDefaultSettings();
            setSettings(s);
            syncDraft(s);
            void setLandmarkMode(s.landmark_mode).catch(() => {});
            toast('Restored default settings');
          }}
        >
          <Text style={styles.actionText}>Restore default settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={async () => {
            await clearAllPeople();
            toast('Cleared all person');
          }}
        >
          <Text style={styles.actionText}>Clear all person</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  cardLabel: { color: colors.text, fontSize: 15, marginBottom: 8 },
  spaced: { marginTop: 8 },
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  radioDotOn: { backgroundColor: colors.accent },
  radioLabel: { color: colors.text, fontSize: 15 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stroke,
  },
  fieldLabel: { color: colors.text, fontSize: 15, flex: 1 },
  input: {
    color: colors.text,
    fontSize: 15,
    minWidth: 72,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.bg,
    borderRadius: 6,
  },
  actionRow: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stroke,
  },
  actionText: { color: colors.text, fontSize: 15 },
});
