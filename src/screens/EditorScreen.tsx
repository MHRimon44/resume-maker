import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Chip,
  Field,
  IconButton,
  ScreenHeader,
} from '../components/ui';
import {
  bulletExamples,
  sectionLabels,
  summaryExamples,
} from '../constants/content';
import { resumeRepository } from '../repositories/resumeRepository';
import { Entry, ResumeBundle, RootStackParamList, SectionType } from '../types';
import { parseErrors, resumeSchema } from '../utils/validation';
import { colors, space, useAppColors } from '../theme';
export function EditorScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Editor'>) {
  const c = useAppColors();
  const [data, setData] = useState<ResumeBundle>(),
    [tab, setTab] = useState<SectionType | 'basics' | 'sections'>('basics'),
    [entry, setEntry] = useState<Entry>(),
    [errors, setErrors] = useState<Record<string, string>>({});
  const load = useCallback(
    async () => setData(await resumeRepository.bundle(route.params.resumeId)),
    [route.params.resumeId],
  );
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  if (!data) return <View />;
  const r = data.resume;
  const patch = (x: Partial<typeof r>) =>
    setData({ ...data, resume: { ...r, ...x } });
  const reorder = (index: number, delta: number) => {
    const ordered = [...data.sections].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
      next = index + delta;
    if (next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next]!, ordered[index]!];
    setData({
      ...data,
      sections: ordered.map((x, i) => ({ ...x, sortOrder: i })),
    });
  };
  const save = async () => {
    try {
      await resumeSchema.validate(
        { title: r.title, ...r.personal, summary: r.summary },
        { abortEarly: false },
      );
      setErrors({});
      await resumeRepository.save(r);
      await resumeRepository.setSections(data.sections);
      Alert.alert('Saved', 'Your changes are stored on this device.');
    } catch (e) {
      setErrors(parseErrors(e));
      setTab('basics');
    }
  };
  const section =
    tab === 'basics' || tab === 'sections'
      ? undefined
      : data.sections.find(x => x.type === tab);
  const sectionEntries =
    tab === 'basics' || tab === 'sections'
      ? []
      : data.entries.filter(x => x.type === tab);
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Edit resume"
        subtitle={r.title}
        onBack={navigation.goBack}
        right={
          <View style={s.topActions}>
            <IconButton
              icon="↗"
              accessibilityLabel="Preview resume"
              onPress={async () => {
                await resumeRepository.save(r);
                await resumeRepository.setSections(data.sections);
                navigation.navigate('Preview', { resumeId: r.id });
              }}
            />
            <Button label="✓ Save" onPress={save} />
          </View>
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabs}
      >
        {(
          ['basics', 'sections', ...Object.keys(sectionLabels)] as (
            | SectionType
            | 'basics'
            | 'sections'
          )[]
        ).map(x => (
          <Chip
            key={x}
            label={
              x === 'basics'
                ? 'Basics'
                : x === 'sections'
                ? 'Layout'
                : sectionLabels[x]
            }
            selected={tab === x}
            onPress={() => setTab(x)}
          />
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'basics' ? (
          <>
            <Text style={[s.heading, { color: c.ink }]}>
              Start with the essentials.
            </Text>
            <Text style={[s.help, { color: c.muted }]}>
              These details make the first impression on your CV.
            </Text>
            <Card>
              <View style={s.form}>
                <Field
                  label="Resume title"
                  value={r.title}
                  error={errors.title}
                  onChangeText={title => patch({ title })}
                />
                <Field
                  label="Full name"
                  value={r.personal.fullName}
                  error={errors.fullName}
                  onChangeText={fullName =>
                    patch({ personal: { ...r.personal, fullName } })
                  }
                />
                <Field
                  label="Professional headline"
                  value={r.personal.headline}
                  onChangeText={headline =>
                    patch({ personal: { ...r.personal, headline } })
                  }
                />
                <Field
                  label="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={r.personal.email}
                  error={errors.email}
                  onChangeText={email =>
                    patch({ personal: { ...r.personal, email } })
                  }
                />
                <Field
                  label="Phone"
                  keyboardType="phone-pad"
                  value={r.personal.phone}
                  onChangeText={phone =>
                    patch({ personal: { ...r.personal, phone } })
                  }
                />
                <Field
                  label="Location"
                  value={r.personal.location}
                  onChangeText={location =>
                    patch({ personal: { ...r.personal, location } })
                  }
                />
                <Field
                  label="Website / LinkedIn"
                  autoCapitalize="none"
                  value={r.personal.website}
                  onChangeText={website =>
                    patch({ personal: { ...r.personal, website } })
                  }
                />
              </View>
            </Card>
          </>
        ) : tab === 'sections' ? (
          <>
            <Text style={[s.heading, { color: c.ink }]}>Make it yours.</Text>
            <Text style={[s.help, { color: c.muted }]}>
              Set the page, then arrange what appears in your document.
            </Text>
            <Card>
              <Text style={[s.smallTitle, { color: c.ink }]}>Paper size</Text>
              <View style={s.choiceRow}>
                {(['A4', 'Letter'] as const).map(x => (
                  <Chip
                    key={x}
                    label={x}
                    selected={r.paperSize === x}
                    onPress={() => patch({ paperSize: x })}
                  />
                ))}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>Typography</Text>
              <View style={s.choiceRow}>
                {[0.9, 1, 1.1].map(x => (
                  <Chip
                    key={x}
                    label={x === 1 ? 'Standard' : x < 1 ? 'Compact' : 'Large'}
                    selected={r.fontScale === x}
                    onPress={() => patch({ fontScale: x })}
                  />
                ))}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>Accent</Text>
              <View style={s.choiceRow}>
                {['#5B5CE2', '#173B57', '#23856D', '#D16B47'].map(x => (
                  <Pressable
                    accessibilityLabel={`Accent ${x}`}
                    key={x}
                    onPress={() => patch({ accent: x })}
                    style={[
                      s.swatch,
                      { backgroundColor: x },
                      r.accent === x && s.swatchOn,
                    ]}
                  />
                ))}
              </View>
            </Card>
            <View style={s.gap}>
              {[...data.sections]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((x, i) => (
                  <Card key={x.id}>
                    <View style={s.orderRow}>
                      <Switch
                        value={x.visible}
                        onValueChange={visible =>
                          setData({
                            ...data,
                            sections: data.sections.map(z =>
                              z.id === x.id ? { ...z, visible } : z,
                            ),
                          })
                        }
                      />
                      <Text style={[s.orderTitle, { color: c.ink }]}>
                        {sectionLabels[x.type]}
                      </Text>
                      <Pressable onPress={() => reorder(i, -1)}>
                        <Text style={s.orderButton}>↑</Text>
                      </Pressable>
                      <Pressable onPress={() => reorder(i, 1)}>
                        <Text style={s.orderButton}>↓</Text>
                      </Pressable>
                    </View>
                  </Card>
                ))}
            </View>
          </>
        ) : tab === 'summary' ? (
          <>
            <View style={s.sectionHead}>
              <View>
                <Text style={[s.heading, { color: c.ink }]}>
                  Professional summary
                </Text>
                <Text style={[s.help, { color: c.muted }]}>
                  Keep it focused: two to four sentences.
                </Text>
              </View>
              <Switch
                value={section?.visible}
                onValueChange={v =>
                  setData({
                    ...data,
                    sections: data.sections.map(x =>
                      x.type === tab ? { ...x, visible: v } : x,
                    ),
                  })
                }
              />
            </View>
            <Card>
              <Field
                label="Summary"
                multiline
                value={r.summary}
                error={errors.summary}
                onChangeText={summary => patch({ summary })}
              />
              <Text style={[s.smallTitle, { color: c.ink }]}>
                Offline starter phrases
              </Text>
              {summaryExamples.map(x => (
                <Pressable
                  key={x}
                  style={s.example}
                  onPress={() => patch({ summary: x })}
                >
                  <Text style={[s.exampleText, { color: c.muted }]}>{x}</Text>
                </Pressable>
              ))}
            </Card>
          </>
        ) : (
          <>
            <View style={s.sectionHead}>
              <View>
                <Text style={[s.heading, { color: c.ink }]}>
                  {sectionLabels[tab]}
                </Text>
                <Text style={[s.help, { color: c.muted }]}>
                  Add, edit and organize structured details.
                </Text>
              </View>
              <Switch
                value={section?.visible}
                onValueChange={v =>
                  setData({
                    ...data,
                    sections: data.sections.map(x =>
                      x.type === tab ? { ...x, visible: v } : x,
                    ),
                  })
                }
              />
            </View>
            <View style={s.gap}>
              {sectionEntries.map(e => (
                <Pressable key={e.id} onPress={() => setEntry(e)}>
                  <Card>
                    <Text style={[s.entryTitle, { color: c.ink }]}>
                      {e.title || `Untitled ${sectionLabels[tab]}`}
                    </Text>
                    <Text style={[s.entrySub, { color: c.muted }]}>
                      {e.subtitle || 'Tap to add details'}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              <Button
                label={`＋ Add ${sectionLabels[tab]}`}
                onPress={async () =>
                  setEntry(await resumeRepository.addEntry(r.id, tab))
                }
              />
            </View>
          </>
        )}
      </ScrollView>
      <EntryModal
        value={entry}
        onClose={() => {
          setEntry(undefined);
          load();
        }}
      />
      <View
        style={[s.bottom, { backgroundColor: c.header, borderColor: c.line }]}
      >
        <Button
          label="Change template"
          kind="ghost"
          onPress={() => navigation.navigate('Templates', { resumeId: r.id })}
        />
        <Button label="✓ Save changes" onPress={save} />
      </View>
    </SafeAreaView>
  );
}
function EntryModal({
  value,
  onClose,
}: {
  value?: Entry;
  onClose: () => void;
}) {
  const c = useAppColors();
  const [draft, setDraft] = useState(value);
  React.useEffect(() => setDraft(value), [value]);
  if (!draft) return null;
  const p = (x: Partial<Entry>) => setDraft({ ...draft, ...x });
  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.modal}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={[s.heading, { color: c.ink }]}>
            Edit {sectionLabels[draft.type]}
          </Text>
          <View style={s.form}>
            <Field
              label="Title / name"
              value={draft.title}
              onChangeText={title => p({ title })}
            />
            <Field
              label="Organization / role / level"
              value={draft.subtitle}
              onChangeText={subtitle => p({ subtitle })}
            />
            <View style={s.dateRow}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Start"
                  placeholder="2023-01"
                  value={draft.startDate}
                  onChangeText={startDate => p({ startDate })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="End"
                  placeholder="Present"
                  value={draft.endDate}
                  onChangeText={endDate => p({ endDate })}
                />
              </View>
            </View>
            <Field
              label="Details / achievements"
              multiline
              value={draft.details}
              onChangeText={details => p({ details })}
            />
            <Text style={[s.smallTitle, { color: c.ink }]}>
              Add a starter bullet
            </Text>
            {bulletExamples.map(x => (
              <Pressable
                key={x}
                style={s.example}
                onPress={() =>
                  p({
                    details: [draft.details, x].filter(Boolean).join('\n• '),
                  })
                }
              >
                <Text style={[s.exampleText, { color: c.muted }]}>＋ {x}</Text>
              </Pressable>
            ))}
            <Field
              label="Extra (URL, language level, credential)"
              value={draft.meta}
              onChangeText={meta => p({ meta })}
            />
            <Button
              label="✓ Save entry"
              onPress={async () => {
                await resumeRepository.saveEntry(draft);
                onClose();
              }}
            />
            <Button
              label="⌫ Delete entry"
              kind="danger"
              onPress={async () => {
                await resumeRepository.deleteEntry(draft.id);
                onClose();
              }}
            />
            <Button label="× Cancel" kind="ghost" onPress={onClose} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  top: {
    padding: 16,
    paddingHorizontal: space.md,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { fontWeight: '800', color: colors.primary },
  tabs: { padding: 9, gap: 7, maxHeight: 52, marginBottom: 4 },
  content: { padding: 14, paddingBottom: 110, gap: 12 },
  heading: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: colors.ink,
  },
  help: { color: colors.muted, marginTop: 4, lineHeight: 18, fontSize: 13 },
  form: { gap: 13 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gap: { gap: 10 },
  entryTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  entrySub: { color: colors.muted, marginTop: 5 },
  smallTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 6,
  },
  example: {
    padding: 9,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    marginTop: 8,
  },
  exampleText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  swatch: { width: 31, height: 31, borderRadius: 16 },
  swatchOn: { borderWidth: 4, borderColor: '#C7C9D2' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderTitle: { flex: 1, fontWeight: '800', color: colors.ink },
  orderButton: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.primary,
    paddingHorizontal: 8,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 9,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  modal: { flex: 1, backgroundColor: colors.canvas },
  dateRow: { flexDirection: 'row', gap: 10 },
});
