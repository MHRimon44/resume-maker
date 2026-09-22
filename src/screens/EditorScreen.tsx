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
import { colorRoles, fontFamilies, sectionTitle } from '../utils/resumeStyle';
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
    [tab, setTab] = useState<string>('basics'),
    [newSection, setNewSection] = useState(''),
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
      if (data.sections.some(item => item.type === 'custom' && !item.title?.trim())) {
        Alert.alert('Name required', 'Give every custom section a name.');
        setTab('sections');
        return;
      }
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
      : data.sections.find(x => x.type === tab || x.id === tab);
  const sectionEntries =
    tab === 'basics' || tab === 'sections'
      ? []
      : data.entries.filter(x => section?.type === 'custom'
        ? x.type === 'custom' && x.sectionId === section.id
        : x.type === section?.type);
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
        {(['basics', 'sections', ...Object.keys(sectionLabels).filter(x => x !== 'custom'),
          ...data.sections.filter(x => x.type === 'custom').map(x => x.id)]).map(x => (
          <Chip
            key={x}
            label={
              x === 'basics'
                ? 'Basics'
                : x === 'sections'
                ? 'Layout'
                : data.sections.find(s => s.id === x)?.title || sectionLabels[x as SectionType]
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
                <Field label="Nationality (optional)" value={r.personal.nationality ?? ''}
                  onChangeText={nationality => patch({ personal: { ...r.personal, nationality } })} />
                <>
                  <Field label="Gender (optional)" value={r.personal.gender ?? ''}
                    onChangeText={gender => patch({ personal: { ...r.personal, gender } })} />
                  <Field label="Date of birth (optional)" value={r.personal.dateOfBirth ?? ''}
                    onChangeText={dateOfBirth => patch({ personal: { ...r.personal, dateOfBirth } })} />
                  <Field label="Interests (optional)" value={r.personal.interests ?? ''}
                    onChangeText={interests => patch({ personal: { ...r.personal, interests } })} />
                </>
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
              <Text style={[s.smallTitle, { color: c.ink }]}>Font size</Text>
              <View style={s.choiceRow}>
                {[0.75, 0.85, 1, 1.15, 1.3, 1.5].map(x => (
                  <Chip key={x} label={`${Math.round(x * 100)}%`} selected={r.fontScale === x}
                    onPress={() => patch({ fontScale: x })} />
                ))}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>Font family</Text>
              <View style={s.choiceRow}>
                {fontFamilies.map(x => <Chip key={x.key} label={x.label}
                  selected={(r.style?.fontFamily ?? (r.templateId === 'ats' ? 'serif' : 'sans')) === x.key}
                  onPress={() => patch({ style: { ...r.style, fontFamily: x.key } })} />)}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>Accent and design colors</Text>
              <Text style={[s.help, { color: c.muted }]}>Choose colors for each part of the document.</Text>
              <Text style={[s.smallTitle, { color: c.ink }]}>Accent / divider</Text>
              <ColorPicker value={r.accent} onChange={accent => patch({ accent })} />
              {colorRoles.map(({ key, label }) => (
                <View key={key} style={{ marginTop: 10 }}>
                  <Text style={[s.smallTitle, { color: c.ink }]}>{label}</Text>
                  <ColorPicker value={r.style?.colors?.[key] ?? (
                    key === 'sidebar' ? '#293844' : key === 'header' ? r.accent :
                    key === 'page' ? '#FFFFFF' : key === 'contact' ? '#374151' : '#222222'
                  )} onChange={value => patch({ style: { ...r.style,
                    colors: { ...r.style?.colors, [key]: value } } })} />
                </View>
              ))}
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
                        {sectionTitle(x)}
                      </Text>
                      <Pressable onPress={() => reorder(i, -1)}>
                        <Text style={s.orderButton}>↑</Text>
                      </Pressable>
                      <Pressable onPress={() => reorder(i, 1)}>
                        <Text style={s.orderButton}>↓</Text>
                      </Pressable>
                    </View>
                    {x.type === 'custom' && <>
                      <Field label="Section name" value={x.title ?? ''}
                        onChangeText={title => setData({ ...data, sections: data.sections.map(z =>
                          z.id === x.id ? { ...z, title } : z) })} />
                      <Button kind="danger" label="Remove custom section" onPress={() =>
                        Alert.alert('Remove section?', 'Its entries will also be removed when you save.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => {
                            setData(current => current && ({ ...current,
                              sections: current.sections.filter(z => z.id !== x.id),
                              entries: current.entries.filter(e => e.sectionId !== x.id),
                            }));
                            if (tab === x.id) setTab('sections');
                          } },
                        ])} />
                    </>}
                    <Text style={[s.smallTitle, { color: c.ink }]}>Section heading color</Text>
                    <ColorPicker value={x.color || r.style?.colors?.sectionHeading || r.accent}
                      onChange={color => setData({ ...data, sections: data.sections.map(z =>
                        z.id === x.id ? { ...z, color } : z) })} />
                  </Card>
                ))}
            </View>
            <Card>
              <Field label="New section name" placeholder="e.g. Publications, Volunteer work"
                value={newSection} onChangeText={setNewSection} />
              <Button label="＋ Add custom section" onPress={() => {
                const title = newSection.trim();
                if (!title) { Alert.alert('Name required', 'Enter a section name.'); return; }
                if (data.sections.some(x => sectionTitle(x).toLowerCase() === title.toLowerCase())) {
                  Alert.alert('Already exists', 'Choose a different section name.'); return;
                }
                const id = makeId();
                setData({ ...data, sections: [...data.sections, {
                  id, resumeId: r.id, type: 'custom', title, visible: true,
                  sortOrder: data.sections.length,
                }] });
                setNewSection('');
                setTab(id);
              }} />
            </Card>
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
                      x.id === section?.id ? { ...x, visible: v } : x,
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
                  {section ? sectionTitle(section) : "Section"}
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
                      x.id === section?.id ? { ...x, visible: v } : x,
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
                      {e.title || `Untitled ${section ? sectionTitle(section) : "Section"}`}
                    </Text>
                    <Text style={[s.entrySub, { color: c.muted }]}>
                      {e.subtitle || 'Tap to add details'}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              <Button
                label={`＋ Add ${section ? sectionTitle(section) : "Section"}`}
                onPress={() => setEntry({
                  id: makeId(),
                  resumeId: r.id,
                  type: section?.type ?? 'custom', sectionId: section?.type === 'custom' ? section.id : undefined,
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
        sectionName={section ? sectionTitle(section) : undefined}
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
  sectionName,
}: {
  value?: Entry;
  sectionName?: string;
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
        />
        <ScrollView
          style={{ backgroundColor: c.canvas }}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.heading, { color: c.ink }]}>
            Edit {sectionName || sectionLabels[draft.type]}
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
