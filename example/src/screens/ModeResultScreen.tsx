import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadSettings } from '../FaceDatabase';
import LandmarkImage from '../components/LandmarkImage';
import TileIcon from '../components/TileIcons';
import {
  buildFriendlyView,
  extractLandmarksXy,
  prettyJson,
  type FriendlyField,
  type FriendlyView,
} from '../modeResultFriendly';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeResult'>;

function landmarksToPoints(xy: number[] | null): { x: number; y: number }[] {
  if (!xy || xy.length < 2) return [];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < xy.length; i += 2) {
    pts.push({ x: xy[i]!, y: xy[i + 1]! });
  }
  return pts;
}

export default function ModeResultScreen({ navigation, route }: Props) {
  const { mode, title, json, thumbUri, thumb2Uri } = route.params;
  const [view, setView] = useState<FriendlyView | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const landmarksXy = useMemo(() => extractLandmarksXy(json), [json]);
  const landmarkPoints = useMemo(
    () => landmarksToPoints(landmarksXy),
    [landmarksXy]
  );
  const rawPretty = useMemo(() => prettyJson(json), [json]);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setView(
        buildFriendlyView(
          mode,
          json,
          settings.identify_threshold,
          settings.liveness_threshold
        )
      );
    })();
  }, [mode, json]);

  const ok = view?.ok ?? false;
  const fields: FriendlyField[] = view?.fields ?? [];

  const media = (() => {
    if (mode === 'LANDMARKS' && thumbUri && landmarkPoints.length) {
      return (
        <View style={styles.mediaBlock}>
          <LandmarkImage
            uri={thumbUri}
            landmarks={landmarkPoints}
            width={200}
            height={200}
            style={styles.landmarkWrap}
          />
        </View>
      );
    }
    if (mode === 'LANDMARKS' && thumbUri) {
      return (
        <View style={styles.mediaBlock}>
          <Image source={{ uri: thumbUri }} style={styles.thumb} />
          <Text style={styles.caption}>Captured</Text>
        </View>
      );
    }
    if (mode === 'MATCH' && thumbUri && thumb2Uri) {
      return (
        <View style={styles.matchRow}>
          <View style={styles.matchCol}>
            <Image source={{ uri: thumbUri }} style={styles.thumb} />
            <Text style={styles.caption}>Face 1</Text>
          </View>
          <Text style={[styles.matchSymbol, ok ? styles.ok : styles.bad]}>
            {ok ? '=' : '≠'}
          </Text>
          <View style={styles.matchCol}>
            <Image source={{ uri: thumb2Uri }} style={styles.thumb} />
            <Text style={styles.caption}>Face 2</Text>
          </View>
        </View>
      );
    }
    if (mode === 'IDENTITY' && thumbUri) {
      return (
        <View style={styles.matchRow}>
          <View style={styles.matchCol}>
            <Image source={{ uri: thumbUri }} style={styles.thumb} />
            <Text style={styles.caption}>Identified</Text>
          </View>
          <Text style={[styles.matchSymbol, ok ? styles.ok : styles.bad]}>
            {ok ? '=' : '≠'}
          </Text>
          <View style={styles.matchCol}>
            {thumb2Uri ? (
              <Image source={{ uri: thumb2Uri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.peoplePlaceholder]}>
                <TileIcon name="people" size={56} color={colors.muted} />
              </View>
            )}
            <Text style={styles.caption}>Enrolled</Text>
          </View>
        </View>
      );
    }
    if (thumbUri) {
      return (
        <View style={styles.mediaBlock}>
          <Image source={{ uri: thumbUri }} style={styles.thumb} />
          <Text style={styles.caption}>
            {mode === 'ENROLL' ? 'Enrolled' : 'Captured face'}
          </Text>
        </View>
      );
    }
    return null;
  })();

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.popToTop()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Text style={[styles.statusText, ok ? styles.ok : styles.bad]}>
            {view?.status || title}
          </Text>
        </View>

        {view?.summary ? (
          <Text style={styles.summary}>{view.summary}</Text>
        ) : null}

        {view?.scoreLabel ? (
          <Text style={styles.score}>{view.scoreLabel}</Text>
        ) : null}

        {media}

        {fields.length === 0 ? (
          <Text style={styles.empty}>No extra details for this result.</Text>
        ) : (
          fields.map((row, i) =>
            row.kind === 'section' ? (
              <Text key={`s-${i}`} style={styles.section}>
                {row.title}
              </Text>
            ) : (
              <View key={`f-${i}`} style={styles.fieldBlock}>
                <Text style={styles.fieldTitle}>{row.title}</Text>
                <Text style={styles.fieldValue} selectable>
                  {row.value}
                </Text>
              </View>
            )
          )
        )}

        <TouchableOpacity
          style={styles.rawToggle}
          onPress={() => setShowRaw((v) => !v)}
        >
          <Text style={styles.rawToggleText}>
            {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON'}
          </Text>
        </TouchableOpacity>
        {showRaw ? (
          <Text style={styles.raw} selectable>
            {rawPretty}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: { color: colors.accent, fontSize: 22, width: 28 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: { padding: 20, paddingBottom: 40 },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
    marginBottom: 12,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  summary: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  score: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  ok: { color: colors.accent },
  bad: { color: colors.danger },
  mediaBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  matchCol: { alignItems: 'center' },
  matchSymbol: {
    fontSize: 28,
    fontWeight: '800',
    marginHorizontal: 4,
  },
  thumb: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  peoplePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  landmarkWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  caption: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  fieldTitle: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  fieldValue: { color: colors.text, fontSize: 15 },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  rawToggle: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  rawToggleText: {
    textAlign: 'center',
    color: colors.accent,
    fontWeight: '700',
  },
  raw: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
});
