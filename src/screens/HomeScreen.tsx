import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Empty,
  IconButton,
  ScreenHeader,
} from '../components/ui';
import { resumeRepository } from '../repositories/resumeRepository';
import { AdBanner } from '../components/AdBanner';
import { Resume, RootStackParamList } from '../types';
import { colors, useAppColors } from '../theme';
type P = NativeStackScreenProps<RootStackParamList, 'Home'>;
export function HomeScreen({ navigation }: P) {
  const c = useAppColors();
  const [items, setItems] = useState<Resume[]>([]),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setItems(await resumeRepository.list());
    setLoading(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.primarySoft }]}>
      <ScreenHeader
        title="Resume Studio"
        subtitle="Private, offline resume builder"
        backgroundColor={c.primarySoft}
        brandImage={require('../../assets/logo.png')}
        right={
          <IconButton
            icon="⚙︎"
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate('Settings')}
          />
        }
      />
      <View style={[s.hero, { backgroundColor: c.primarySoft }]}>
        <View>
          <Text style={[s.eyebrow, { color: c.primary }]}>
            RESUME STUDIO / OFFLINE
          </Text>
          <Text style={[s.title, { color: c.ink }]}>Make your next move.</Text>
          <Text style={[s.subtitle, { color: c.muted }]}>
            Create a polished resume that tells your story. Your work stays on
            this device.
          </Text>
        </View>
        <Button
          label="＋ Create a resume"
          onPress={() => navigation.navigate('Templates')}
        />
      </View>
      {!loading && !items.length ? (
        <View style={[s.emptyArea, { backgroundColor: c.canvas }]}>
          <Empty
            title="Your story starts here"
            body="Pick a style, add your experience and share a PDF when you are ready."
            action="Explore templates"
            onPress={() => navigation.navigate('Templates')}
          />
        </View>
      ) : (
        <FlatList
          style={{ backgroundColor: c.canvas }}
          data={items}
          keyExtractor={x => x.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <View style={s.listHead}>
              <Text style={[s.listTitle, { color: c.ink }]}>Your resumes</Text>
              <Text style={[s.count, { color: c.muted }]}>
                {items.length} saved
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Editor', { resumeId: item.id })
              }
            >
              <Card>
                <View style={s.row}>
                  <View
                    style={[
                      s.preview,
                      {
                        borderTopColor:
                          item.templateId === 'ats' ? colors.ink : item.accent,
                      },
                    ]}
                  >
                    <Text style={[s.mini, { color: c.ink }]}>
                      {item.personal.fullName || 'Your name'}
                    </Text>
                    <View style={s.line} />
                    <View style={s.line} />
                    <View style={[s.line, { width: '60%' }]} />
                  </View>
                  <View style={s.grow}>
                    <Text
                      style={[s.cardTitle, { color: c.ink }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={[s.meta, { color: c.muted }]}>
                      {item.templateId} · Updated{' '}
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                    <View style={s.actions}>
                      <IconButton
                        icon="↗"
                        accessibilityLabel={`Preview ${item.title}`}
                        onPress={event => {
                          event.stopPropagation();
                          navigation.navigate('Preview', { resumeId: item.id });
                        }}
                      />
                      <IconButton
                        icon="⧉"
                        accessibilityLabel={`Duplicate ${item.title}`}
                        onPress={async event => {
                          event.stopPropagation();
                          await resumeRepository.duplicate(item.id);
                          load();
                        }}
                      />
                      <IconButton
                        icon="⌫"
                        kind="danger"
                        accessibilityLabel={`Delete ${item.title}`}
                        onPress={event => {
                          event.stopPropagation();
                          Alert.alert(
                            'Delete resume?',
                            'This cannot be undone.',
                            [
                              { text: 'Cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  await resumeRepository.remove(item.id);
                                  load();
                                },
                              },
                            ],
                          );
                        }}
                      />
                    </View>
                  </View>
                  <Text style={[s.chevron, { color: c.muted }]}>›</Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
      <AdBanner />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  emptyArea: { flex: 1 },
  hero: {
    padding: 20,
    paddingTop: 26,
    paddingBottom: 24,
    gap: 18,
    backgroundColor: '#E3F2EE',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: colors.primary,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 6,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
    maxWidth: 310,
  },
  list: { padding: 14, paddingBottom: 32, gap: 10 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingBottom: 4,
  },
  listTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  count: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  preview: {
    width: 62,
    height: 80,
    backgroundColor: '#FAFBFA',
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 5,
    padding: 8,
  },
  mini: { fontSize: 6, fontWeight: '800', marginBottom: 9 },
  line: { height: 3, backgroundColor: '#D9DCE3', marginBottom: 6 },
  grow: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted, fontSize: 11, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  chevron: { fontSize: 28, color: colors.muted },
  settings: { padding: 20, alignItems: 'center' },
  settingsIcon: { fontSize: 23, fontWeight: '800' },
});
