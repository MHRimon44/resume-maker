import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScreenHeader } from '../components/ui';
import { resumeRepository } from '../repositories/resumeRepository';
import { exportPdf } from '../services/exportService';
import { ResumeBundle, RootStackParamList } from '../types';
import { sectionLabels } from '../constants/content';
import { colors, space, useAppColors } from '../theme';
export function PreviewScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Preview'>) {
  const c = useAppColors();
  const [b, setB] = useState<ResumeBundle>(),
    [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      resumeRepository.bundle(route.params.resumeId).then(setB);
    }, [route.params.resumeId]),
  );
  if (!b) return <ActivityIndicator />;
  const r = b.resume,
    p = r.personal;
  const accent =
    r.templateId === 'ats'
      ? colors.ink
      : r.templateId === 'europass'
      ? '#174A74'
      : r.accent;
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Resume preview"
        subtitle={
          r.paperSize +
          ' · ' +
          (r.templateId === 'ats'
            ? 'ATS Simple'
            : r.templateId === 'europass'
            ? 'European CV'
            : r.templateId)
        }
        onBack={navigation.goBack}
        right={
          <Button
            label={busy ? 'Exporting…' : '↓ PDF'}
            disabled={busy}
            onPress={async () => {
              try {
                setBusy(true);
                await exportPdf(b);
              } catch (e) {
                Alert.alert(
                  'Export failed',
                  e instanceof Error ? e.message : 'Please try again',
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        }
      />
      <ScrollView
        style={{ backgroundColor: c.overlay }}
        contentContainerStyle={s.canvas}
      >
        <View
          style={[
            s.paper,
            {
              borderTopColor: accent,
              borderTopWidth:
                r.templateId === 'ats' || r.templateId === 'europass' ? 0 : 8,
            },
          ]}
        >
          {r.templateId === 'europass' && (
            <Text style={[s.eyebrow, { color: accent }]}>CURRICULUM VITAE</Text>
          )}
          <Text style={[s.name, { color: accent }]}>
            {p.fullName || 'Your Name'}
          </Text>
          <Text style={s.headline}>{p.headline}</Text>
          <Text style={s.contact}>
            {[p.email, p.phone, p.location, p.website]
              .filter(Boolean)
              .join('  •  ')}
          </Text>
          {b.sections
            .filter(x => x.visible)
            .sort((a, z) => a.sortOrder - z.sortOrder)
            .map(sec => {
              const entries = b.entries.filter(x => x.type === sec.type);
              if (sec.type === 'summary' && !r.summary) return null;
              if (sec.type !== 'summary' && !entries.length) return null;
              return (
                <View key={sec.id} style={s.section}>
                  <Text
                    style={[
                      s.sectionTitle,
                      { color: accent, borderBottomColor: accent },
                    ]}
                  >
                    {sectionLabels[sec.type].toUpperCase()}
                  </Text>
                  {sec.type === 'summary' ? (
                    <Text style={s.body}>{r.summary}</Text>
                  ) : (
                    entries.map(e => (
                      <View key={e.id} style={s.item}>
                        <View style={s.between}>
                          <Text style={s.itemTitle}>{e.title}</Text>
                          <Text style={s.date}>
                            {e.startDate}
                            {e.startDate || e.endDate ? ' — ' : ''}
                            {e.endDate}
                          </Text>
                        </View>
                        <Text style={s.itemSub}>{e.subtitle}</Text>
                        <Text style={s.body}>{e.details}</Text>
                        {!!e.meta && <Text style={s.meta}>{e.meta}</Text>}
                      </View>
                    ))
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#E5EAE7' },
  toolbar: {
    backgroundColor: 'white',
    padding: space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, textTransform: 'capitalize' },
  canvas: { padding: 14, paddingBottom: 36, alignItems: 'center' },
  paper: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 540,
    minHeight: 620,
    padding: 24,
    borderTopWidth: 8,
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  name: { fontSize: 26, fontWeight: '900' },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 13,
  },
  headline: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
    color: colors.ink,
  },
  contact: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 7,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  body: { fontSize: 12, lineHeight: 18, color: colors.ink, marginTop: 5 },
  item: { marginTop: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontWeight: '800', fontSize: 13, color: colors.ink, flex: 1 },
  date: { fontSize: 9, color: colors.muted },
  itemSub: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  meta: { fontSize: 10, color: colors.muted, marginTop: 4 },
});
