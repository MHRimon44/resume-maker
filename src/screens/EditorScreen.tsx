import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
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
  ScreenHeader,
} from '../components/ui';
import {
  bulletExamples,
  sectionLabels,
  summaryExamples,
  templates,
} from '../constants/content';
import { resumeRepository } from '../repositories/resumeRepository';
import { Entry, ResumeBundle, RootStackParamList, SectionType } from '../types';
import { parseErrors, resumeSchema } from '../utils/validation';
import { colors, space, useAppColors } from '../theme';
import { useSettingsStore } from '../store/settingsStore';
import { makeId } from '../utils/id';
import { chooseResumePhoto } from '../services/photoService';
import { takeTemplateForEditor } from '../store/templateSelection';
import { ColorPicker } from '../components/ColorPicker';
import {
  entryFields,
  parseEntryExtras,
  serializeEntryExtras,
} from '../utils/entryFields';
export function EditorScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Editor'>) {
  const c = useAppColors();
  const [data, setData] = useState<ResumeBundle>(),
    [tab, setTab] = useState<SectionType | 'basics' | 'sections'>('basics'),
    [entry, setEntry] = useState<Entry>(),
    [saving, setSaving] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({});
  const load = useCallback(
    async () => setData(await resumeRepository.bundle(route.params.resumeId)),
    [route.params.resumeId],
  );
  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(useCallback(() => {
    const templateId = takeTemplateForEditor(route.params.resumeId);
    if (templateId) {
      setData(current => current && ({
        ...current,
        resume: {
          ...current.resume,
          templateId,
          accent: current.resume.accent,
        },
      }));
    }
  }, [route.params.resumeId]));
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
    if (saving) return;
    try {
      await resumeSchema.validate(
        { title: r.title, ...r.personal, summary: r.summary },
        { abortEarly: false },
      );
      setErrors({});
      setSaving(true);
      await resumeRepository.saveBundle(data);
      Alert.alert('Saved', 'Your changes are stored on this device.');
    } catch (e) {
      const validationErrors = parseErrors(e);
      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        setTab('basics');
      } else {
        Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      }
    } finally {
      setSaving(false);
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
          <Button
            label="Preview ↗"
            kind="ghost"
            onPress={() => navigation.navigate('Preview', { resumeId: r.id, draft: data })}
          />
        }
      />
      <ScrollView
        horizontal
        style={s.tabBar}
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
        key={tab}
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
                  label="LinkedIn / website"
                  autoCapitalize="none"
                  value={r.personal.website}
                  onChangeText={website =>
                    patch({ personal: { ...r.personal, website } })
                  }
                />
                <Field
                  label="GitHub (optional)"
                  autoCapitalize="none"
                  value={r.personal.github ?? ''}
                  onChangeText={github =>
                    patch({ personal: { ...r.personal, github } })
                  }
                />
                <Field
                  label="Portfolio (optional)"
                  autoCapitalize="none"
                  value={r.personal.portfolio ?? ''}
                  onChangeText={portfolio =>
                    patch({ personal: { ...r.personal, portfolio } })
                  }
                />
                <Text style={[s.smallTitle, { color: c.ink }]}>Profile photo (optional)</Text>
                {!!r.personal.photoUri && (
                  <Image source={{ uri: r.personal.photoUri }} style={s.photoPreview} />
                )}
                <Button
                  label={r.personal.photoUri ? 'Change photo' : 'Upload photo'}
                  kind="ghost"
                  onPress={async () => {
                    try {
                      const photoUri = await chooseResumePhoto();
                      if (photoUri) patch({ personal: { ...r.personal, photoUri } });
                    } catch (error) {
                      Alert.alert(
                        'Could not upload photo',
                        error instanceof Error ? error.message : 'Please try again.',
                      );
                    }
                  }}
                />
                {!!r.personal.photoUri && (
                  <Button
                    label="Remove photo"
                    kind="ghost"
                    onPress={() => patch({
                      personal: { ...r.personal, photoUri: undefined },
                    })}
                  />
                )}
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
              <Text style={[s.smallTitle, { color: c.ink }]}>Template</Text>
              <View style={s.choiceRow}>
                {templates.map(item => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    selected={r.templateId === item.id}
                    onPress={() => patch({
                      templateId: item.id,
                      accent: r.accent,
                    })}
                  />
                ))}
              </View>
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
              <ColorPicker value={r.accent} onChange={accent => patch({ accent })} />
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
                  style={[s.example, { backgroundColor: c.primarySoft }]}
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
                onPress={() => setEntry({
                  id: makeId(),
                  resumeId: r.id,
                  type: tab,
                  title: '', subtitle: '', startDate: '', endDate: '',
                  details: '', meta: '', sortOrder: Date.now(),
                })}
              />
            </View>
          </>
        )}
      </ScrollView>
      <EntryModal
        value={entry}
        onClose={() => setEntry(undefined)}
        onDone={saved => {
          setData(current => current && ({
            ...current,
            entries: current.entries.some(item => item.id === saved.id)
              ? current.entries.map(item => item.id === saved.id ? saved : item)
              : [...current.entries, saved],
          }));
          setEntry(undefined);
        }}
        onDelete={id => {
          setData(current => current && ({
            ...current,
            entries: current.entries.filter(item => item.id !== id),
          }));
          setEntry(undefined);
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
        <Button label={saving ? 'Saving…' : '✓ Save'} disabled={saving} onPress={save} />
      </View>
    </SafeAreaView>
  );
}
function EntryModal({
  value,
  onClose,
  onDone,
  onDelete,
}: {
  value?: Entry;
  onClose: () => void;
  onDone: (entry: Entry) => void;
  onDelete: (id: string) => void;
}) {
  const c = useAppColors();
  const darkMode = useSettingsStore(state => state.darkMode);
  const [draft, setDraft] = useState(value);
  React.useEffect(() => setDraft(value), [value]);
  if (!draft) return null;
  const p = (x: Partial<Entry>) => setDraft({ ...draft, ...x });
  const fields = draft.type === 'summary' ? undefined : entryFields[draft.type];
  const extras = parseEntryExtras(draft.meta);
  const patchExtra = (key: keyof typeof extras, value: string) =>
    p({ meta: serializeEntryExtras({ ...extras, [key]: value }) });
  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[s.modal, { backgroundColor: c.canvas }]}>
        <StatusBar
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={c.canvas}
        />
        <ScrollView
          style={{ backgroundColor: c.canvas }}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.heading, { color: c.ink }]}>
            Edit {sectionLabels[draft.type]}
          </Text>
          <View style={s.form}>
            <Field
              label={fields?.title ?? 'Title'}
              value={draft.title}
              onChangeText={title => p({ title })}
            />
            {!!fields?.subtitle && (
              <Field
                label={fields.subtitle}
                value={draft.subtitle}
                onChangeText={subtitle => p({ subtitle })}
              />
            )}
            {fields?.extras?.map(field => (
              <Field
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={extras[field.key] ?? ''}
                autoCapitalize={
                  field.key === 'email' || field.key === 'url'
                    ? 'none'
                    : 'sentences'
                }
                keyboardType={
                  field.key === 'email'
                    ? 'email-address'
                    : field.key === 'phone'
                      ? 'phone-pad'
                      : 'default'
                }
                onChangeText={value => patchExtra(field.key, value)}
              />
            ))}
            {!!fields?.startDate && (
              <View style={s.dateRow}>
                <View style={s.dateField}>
                  <Field
                    label={fields.startDate}
                    placeholder="2023-01"
                    value={draft.startDate}
                    onChangeText={startDate => p({ startDate })}
                  />
                </View>
                <View style={s.dateField}>
                  <Field
                    label={fields.endDate ?? 'End date'}
                    placeholder="Present / 2024-12"
                    value={draft.endDate}
                    onChangeText={endDate => p({ endDate })}
                  />
                </View>
              </View>
            )}
            {!!fields?.details && (
              <Field
                label={fields.details}
                multiline={fields.detailsMultiline}
                value={draft.details}
                onChangeText={details => p({ details })}
              />
            )}
            {draft.type === 'experience' && (
              <Text style={[s.smallTitle, { color: c.ink }]}>
                Add a starter bullet
              </Text>
            )}
            {draft.type === 'experience' && bulletExamples.map(x => (
              <Pressable
                key={x}
                style={[s.example, { backgroundColor: c.primarySoft }]}
                onPress={() =>
                  p({
                    details: [draft.details, x].filter(Boolean).join('\n• '),
                  })
                }
              >
                <Text style={[s.exampleText, { color: c.muted }]}>＋ {x}</Text>
              </Pressable>
            ))}
            {!!extras.legacy && (
              <Field
                label="Additional information from an earlier entry"
                value={extras.legacy}
                onChangeText={legacy => patchExtra('legacy', legacy)}
              />
            )}
            <Button
              label="✓ Done"
              onPress={() => onDone(draft)}
            />
            <Button
              label="⌫ Delete entry"
              kind="danger"
              onPress={() => onDelete(draft.id)}
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
  preview: { fontWeight: '800', color: colors.primary },
  tabBar: { flexGrow: 0, height: 60 },
  tabs: { padding: 9, gap: 7, alignItems: 'center' },
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
  dateField: { flex: 1, minWidth: 0 },
  photoPreview: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center' },
});
