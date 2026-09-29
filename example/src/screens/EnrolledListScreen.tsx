import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  deletePerson,
  loadPeople,
  type EnrolledPerson,
} from '../FaceDatabase';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EnrolledList'>;

export default function EnrolledListScreen({ navigation }: Props) {
  const [people, setPeople] = useState<EnrolledPerson[]>([]);

  const refresh = useCallback(async () => {
    setPeople(await loadPeople());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Enrolled list</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={people}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No enrolled faces yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.thumbB64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${item.thumbB64}` }}
                style={styles.thumb}
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await deletePerson(item.id);
                refresh();
              }}
            >
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke,
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: colors.surfaceAlt },
  name: { flex: 1, marginHorizontal: 12, color: colors.text, fontSize: 16 },
  delete: { color: colors.muted, fontSize: 18, padding: 8 },
});
