import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSdk } from '../SdkContext';
import { FACE_MODES, type FaceModeId, type FaceModeMeta } from '../FaceMode';
import TileIcon, { type TileIconName } from '../components/TileIcons';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

function ModeCell({
  title,
  icon,
  disabled,
  onPress,
  accent,
}: {
  title: string;
  icon: TileIconName;
  disabled?: boolean;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.modeCell,
        accent && styles.modeCellAccent,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <TileIcon
        name={icon}
        size={28}
        color={accent ? colors.onPrimary : colors.accent}
      />
      <Text
        style={[styles.modeCellLabel, accent && styles.modeCellLabelAccent]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function ModeTile({
  title,
  icon,
  disabled,
  onPress,
  accent,
}: {
  title: string;
  icon: TileIconName;
  disabled?: boolean;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.modeTile,
        accent && styles.modeTileAccent,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <TileIcon
        name={icon}
        size={36}
        color={accent ? colors.onPrimary : colors.accent}
      />
      <Text
        style={[styles.modeTileLabel, accent && styles.modeTileLabelAccent]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const ATTR_ROW1: { id: FaceModeId; icon: TileIconName }[] = [
  { id: 'FACE_DETECT', icon: 'detect' },
  { id: 'FACE_ATTRIBUTE', icon: 'attribute' },
  { id: 'IMAGE_QUALITY', icon: 'quality' },
];

const ATTR_ROW2: { id: FaceModeId; icon: TileIconName }[] = [
  { id: 'LANDMARKS', icon: 'landmarks' },
  { id: 'MATCH', icon: 'match' },
  { id: 'LIVENESS', icon: 'liveness' },
];

export default function HomeScreen({ navigation }: Props) {
  const {
    ready,
    loading,
    status,
    license,
    licenseLabel,
    missingDatabases,
  } = useSdk();

  const ensureReady = (mode: FaceModeMeta): boolean => {
    if (!ready) {
      toast(loading ? 'Starting SDK…' : 'SDK is not ready');
      return false;
    }
    if (mode.needsRecognition && !license.recognition) {
      toast('This license does not include recognition');
      return false;
    }
    if (mode.needsLiveness && !license.liveness) {
      toast('This license does not include liveness');
      return false;
    }
    return true;
  };

  const openMode = (id: FaceModeId) => {
    const mode = FACE_MODES[id];
    if (!ensureReady(mode)) return;
    if (id === 'IDENTITY') {
      navigation.navigate('ModeCamera', { mode: 'IDENTITY' });
      return;
    }
    if (id === 'ENROLL') {
      navigation.navigate('ModeCamera', { mode: 'ENROLL' });
      return;
    }
    if (id === 'ENROLLED_LIST') {
      navigation.navigate('EnrolledList');
      return;
    }
    navigation.navigate('ModeCamera', { mode: id });
  };

  const warning =
    missingDatabases.length > 0
      ? `Missing databases (features skipped): ${missingDatabases}`
      : !ready && status
        ? status
        : '';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chipRow}>
        <Text style={[styles.chip, styles.chipFlex]} numberOfLines={2}>
          License · {licenseLabel}
        </Text>
        <Text
          style={[
            styles.chip,
            styles.statusChip,
            { color: ready ? colors.statusOk : colors.muted },
          ]}
        >
          {ready ? 'Ready' : loading ? 'Loading…' : 'No license'}
        </Text>
      </View>

      <Text style={styles.section}>Attribute & Liveness</Text>
      <View style={styles.attrPanel}>
        <View style={styles.attrRow}>
          {ATTR_ROW1.map((item, i) => (
            <View key={item.id} style={[styles.cellWrap, i > 0 && styles.cellGap]}>
              <ModeCell
                title={FACE_MODES[item.id].title}
                icon={item.icon}
                disabled={!ready}
                onPress={() => openMode(item.id)}
              />
            </View>
          ))}
        </View>
        <View style={[styles.attrRow, styles.attrRowTop]}>
          {ATTR_ROW2.map((item, i) => (
            <View key={item.id} style={[styles.cellWrap, i > 0 && styles.cellGap]}>
              <ModeCell
                title={FACE_MODES[item.id].title}
                icon={item.icon}
                disabled={!ready}
                onPress={() => openMode(item.id)}
              />
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.section}>Identity</Text>
      <View style={styles.identityRow}>
        <ModeTile
          title="Enroll"
          icon="enroll"
          disabled={!ready}
          onPress={() => openMode('ENROLL')}
        />
        <View style={styles.tileGap} />
        <ModeTile
          title="Identity"
          icon="identify"
          accent
          disabled={!ready}
          onPress={() => openMode('IDENTITY')}
        />
        <View style={styles.tileGap} />
        <ModeTile
          title="Enrolled list"
          icon="people"
          disabled={!ready}
          onPress={() => openMode('ENROLLED_LIST')}
        />
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.footerTile}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.75}
        >
          <TileIcon name="settings" size={36} color={colors.accent} />
          <Text style={styles.footerLabel}>Settings</Text>
        </TouchableOpacity>
        <View style={styles.tileGap} />
        <TouchableOpacity
          style={styles.footerTile}
          onPress={() => navigation.navigate('About')}
          activeOpacity={0.75}
        >
          <TileIcon name="about" size={36} color={colors.accent} />
          <Text style={styles.footerLabel}>About</Text>
        </TouchableOpacity>
      </View>

      {warning ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  chipFlex: { flex: 1 },
  statusChip: {
    marginLeft: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 18,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  attrPanel: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  attrRow: { flexDirection: 'row', height: 96 },
  attrRowTop: { marginTop: 8 },
  cellWrap: { flex: 1 },
  cellGap: { marginLeft: 8 },
  modeCell: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  modeCellAccent: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeCellLabel: {
    marginTop: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeCellLabelAccent: { color: colors.onPrimary },
  identityRow: {
    flexDirection: 'row',
    marginTop: 8,
    height: 124,
  },
  modeTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  modeTileAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modeTileLabel: {
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  modeTileLabelAccent: { color: colors.onPrimary },
  tileGap: { width: 8 },
  footerRow: {
    flexDirection: 'row',
    marginTop: 18,
    height: 124,
  },
  footerTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  footerLabel: {
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: { opacity: 0.45 },
  warningBanner: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  warningText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 13,
  },
});
