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
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  AppIcon,
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
import {
  Entry,
  ResumeBundle,
  ResumeSection,
  RootStackParamList,
} from '../types';
import { parseErrors, resumeSchema } from '../utils/validation';
import { colors, space, useAppColors } from '../theme';
import { useSettingsStore } from '../store/settingsStore';
import { makeId } from '../utils/id';
import { chooseResumePhoto } from '../services/photoService';
import { takeTemplateForEditor } from '../store/templateSelection';
import { ColorPicker } from '../components/ColorPicker';
import { colorRoles, fontFamilies, sectionTitle } from '../utils/resumeStyle';
import { displayCustomEntry, customFieldsFor } from '../utils/resumeStyle';
import { takeCustomSectionDraft } from '../store/customSectionDraft';
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
    [entry, setEntry] = useState<Entry>(),
    [saving, setSaving] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [renamingSection, setRenamingSection] = useState<ResumeSection>(),
    [sectionNameDraft, setSectionNameDraft] = useState('');
  const load = useCallback(
    async () => setData(await resumeRepository.bundle(route.params.resumeId)),
    [route.params.resumeId],
  );
  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      const templateId = takeTemplateForEditor(route.params.resumeId);
      const customDraft = takeCustomSectionDraft(route.params.resumeId);
      if (templateId) {
        setData(
          current =>
            current && {
              ...current,
              resume: {
                ...current.resume,
                templateId,
                accent: current.resume.accent,
              },
            },
        );
      }
      if (customDraft) {
        const sectionId = customDraft.id ?? makeId();
        setData(
          current =>
            current && {
              ...current,
              sections: customDraft.id
                ? current.sections.map(section =>
                    section.id === customDraft.id
                      ? {
                          ...section,
                          title: customDraft.title,
                          fields: customDraft.fields,
                        }
                      : section,
                  )
                : [
                    ...current.sections,
                    {
                      id: sectionId,
                      resumeId: current.resume.id,
                      type: 'custom',
                      title: customDraft.title,
                      fields: customDraft.fields,
                      visible: true,
                      sortOrder: current.sections.length,
                    },
                  ],
            },
        );
        setTab(sectionId);
      }
    }, [route.params.resumeId]),
  );
  if (!data) return <View />;
  const r = data.resume;
  const patch = (x: Partial<typeof r>) =>
    setData({ ...data, resume: { ...r, ...x } });
  const startRenamingSection = (sectionItem: ResumeSection) => {
    setRenamingSection(sectionItem);
    setSectionNameDraft(sectionTitle(sectionItem));
  };
  const applySectionName = () => {
    if (!renamingSection) return;
    const title = sectionNameDraft.trim();
    if (!title) {
      Alert.alert('Name required', 'Enter a name for this section.');
      return;
    }
    if (
      data.sections.some(
        item =>
          item.id !== renamingSection.id &&
          sectionTitle(item).toLowerCase() === title.toLowerCase(),
      )
    ) {
      Alert.alert('Duplicate section', 'Give each section a unique title.');
      return;
    }
    setData({
      ...data,
      sections: data.sections.map(item =>
        item.id === renamingSection.id ? { ...item, title } : item,
      ),
    });
    setRenamingSection(undefined);
  };
  const confirmRemoveSection = (sectionItem: ResumeSection) =>
    Alert.alert(
      `Delete ${sectionTitle(sectionItem)}?`,
      'The section and all of its entries will be removed when you save.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setData(
              current =>
                current && {
                  ...current,
                  sections: current.sections.filter(
                    item => item.id !== sectionItem.id,
                  ),
                  entries: current.entries.filter(item =>
                    sectionItem.type === 'custom'
                      ? item.sectionId !== sectionItem.id
                      : item.type !== sectionItem.type,
                  ),
                },
            );
            if (tab === sectionItem.id || tab === sectionItem.type)
              setTab('sections');
          },
        },
      ],
    );
  const save = async () => {
    if (saving) return;
    try {
      await resumeSchema.validate(
        { title: r.title, ...r.personal, summary: r.summary },
        { abortEarly: false },
      );
      setErrors({});
      setSaving(true);
      if (
        data.sections.some(
          item => item.type === 'custom' && !item.title?.trim(),
        )
      ) {
        Alert.alert('Name required', 'Give every custom section a name.');
        setTab('sections');
        return;
      }
      if (
        new Set(data.sections.map(item => sectionTitle(item).toLowerCase()))
          .size !== data.sections.length
      ) {
        Alert.alert('Duplicate section', 'Give each section a unique title.');
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
        Alert.alert(
          'Could not save',
          e instanceof Error ? e.message : 'Please try again.',
        );
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
      : data.entries.filter(x =>
          section?.type === 'custom'
            ? x.type === 'custom' && x.sectionId === section.id
            : x.type === section?.type,
        );
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Edit resume"
        subtitle={r.title}
        onBack={navigation.goBack}
        right={
          <Button
            label="Preview"
            icon="open-in-new"
            kind="ghost"
            onPress={() =>
              navigation.navigate('Preview', { resumeId: r.id, draft: data })
            }
          />
        }
      />
      <ScrollView
        horizontal
        style={s.tabBar}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabs}
      >
        {[
          'basics',
          'sections',
          ...[...data.sections]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => (item.type === 'custom' ? item.id : item.type)),
        ].map(x => (
          <Chip
            key={x}
            label={
              x === 'basics'
                ? 'Basics'
                : x === 'sections'
                ? 'Layout'
                : sectionTitle(
                    data.sections.find(
                      item => item.id === x || item.type === x,
                    )!,
                  )
            }
            selected={tab === x}
            onPress={() => setTab(x)}
          />
        ))}
      </ScrollView>
      <NestableScrollContainer
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
                <Field
                  label="Nationality (optional)"
                  value={r.personal.nationality ?? ''}
                  onChangeText={nationality =>
                    patch({ personal: { ...r.personal, nationality } })
                  }
                />
                <>
                  <Field
                    label="Gender (optional)"
                    value={r.personal.gender ?? ''}
                    onChangeText={gender =>
                      patch({ personal: { ...r.personal, gender } })
                    }
                  />
                  <Field
                    label="Date of birth (optional)"
                    value={r.personal.dateOfBirth ?? ''}
                    onChangeText={dateOfBirth =>
                      patch({ personal: { ...r.personal, dateOfBirth } })
                    }
                  />
                  <Field
                    label="Interests (optional)"
                    value={r.personal.interests ?? ''}
                    onChangeText={interests =>
                      patch({ personal: { ...r.personal, interests } })
                    }
                  />
                </>
                <Text style={[s.smallTitle, { color: c.ink }]}>
                  Profile photo (optional)
                </Text>
                {!!r.personal.photoUri && (
                  <Image
                    source={{ uri: r.personal.photoUri }}
                    style={s.photoPreview}
                  />
                )}
                <Button
                  icon="image-plus"
                  label={r.personal.photoUri ? 'Change photo' : 'Upload photo'}
                  kind="ghost"
                  onPress={async () => {
                    try {
                      const photoUri = await chooseResumePhoto();
                      if (photoUri)
                        patch({ personal: { ...r.personal, photoUri } });
                    } catch (error) {
                      Alert.alert(
                        'Could not upload photo',
                        error instanceof Error
                          ? error.message
                          : 'Please try again.',
                      );
                    }
                  }}
                />
                {!!r.personal.photoUri && (
                  <Button
                    icon="image-remove"
                    label="Remove photo"
                    kind="ghost"
                    onPress={() =>
                      patch({
                        personal: { ...r.personal, photoUri: undefined },
                      })
                    }
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
                  <Chip
                    key={x}
                    label={`${Math.round(x * 100)}%`}
                    selected={r.fontScale === x}
                    onPress={() => patch({ fontScale: x })}
                  />
                ))}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>Font family</Text>
              <View style={s.choiceRow}>
                {fontFamilies.map(x => (
                  <Chip
                    key={x.key}
                    label={x.label}
                    selected={
                      (r.style?.fontFamily ??
                        (r.templateId === 'ats' ? 'serif' : 'sans')) === x.key
                    }
                    onPress={() =>
                      patch({ style: { ...r.style, fontFamily: x.key } })
                    }
                  />
                ))}
              </View>
              <Text style={[s.smallTitle, { color: c.ink }]}>
                Accent and design colors
              </Text>
              <Text style={[s.help, { color: c.muted }]}>
                Choose colors for each part of the document.
              </Text>
              <ColorPicker
                label="Accent / divider"
                value={r.accent}
                onChange={accent => patch({ accent })}
              />
              {colorRoles.map(({ key, label }) => (
                  <ColorPicker key={key} label={label}
                    value={
                      r.style?.colors?.[key] ??
                      (key === 'sidebar'
                        ? '#293844'
                        : ['header', 'divider', 'sectionBackground'].includes(
                            key,
                          )
                        ? r.accent
                        : key === 'photoBorder' || key === 'sidebarHeading'
                        ? '#FFFFFF'
                        : key === 'page'
                        ? '#FFFFFF'
                        : key === 'contact'
                        ? '#374151'
                        : '#222222')
                    }
                    onChange={value =>
                      patch({
                        style: {
                          ...r.style,
                          colors: { ...r.style?.colors, [key]: value },
                        },
                      })
                    }
                  />
              ))}
            </Card>
            <NestableDraggableFlatList
              data={[...data.sections].sort((a, b) => a.sortOrder - b.sortOrder)}
              keyExtractor={item => item.id}
              activationDistance={8}
              contentContainerStyle={s.dragList}
              onDragEnd={({ data: nextSections }) =>
                setData({
                  ...data,
                  sections: nextSections.map((item, index) => ({
                    ...item,
                    sortOrder: index,
                  })),
                })
              }
              renderItem={({ item: x, drag, isActive }) => {
                const sectionCard = (
                  <ScaleDecorator>
                    <Card style={isActive ? s.draggingCard : undefined}>
                      <View style={s.orderRow}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Drag ${sectionTitle(x)}`}
                          accessibilityHint="Press and hold, then drag to reorder"
                          delayLongPress={120}
                          disabled={isActive}
                          onLongPress={drag}
                          style={({ pressed }) => [
                            s.dragHandle,
                            { backgroundColor: c.primarySoft, borderColor: c.line },
                            pressed && s.dragHandlePressed,
                          ]}
                        >
                          <AppIcon name="drag-vertical" size={24} color={c.primary} />
                        </Pressable>
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
                        <Pressable
                          style={s.orderTitlePressable}
                          accessibilityRole="button"
                          accessibilityLabel={`Rename ${sectionTitle(x)}`}
                          accessibilityHint="Long press to edit this section name"
                          delayLongPress={350}
                          onLongPress={() => startRenamingSection(x)}
                        >
                          <Text style={[s.orderTitle, { color: c.ink }]}> 
                            {sectionTitle(x)}
                          </Text>
                          <Text style={[s.longPressHint, { color: c.muted }]}> 
                            Long press to rename
                          </Text>
                        </Pressable>
                        {x.type === 'custom' && (
                          <IconButton
                            icon="pencil-outline"
                            accessibilityLabel={`Edit ${sectionTitle(x)} fields`}
                            onPress={() =>
                              navigation.navigate('CustomSection', {
                                resumeId: r.id,
                                sectionId: x.id,
                                title: x.title,
                                fields: x.fields?.length
                                  ? x.fields
                                  : customFieldsFor(x),
                              })
                            }
                          />
                        )}
                        <ColorPicker
                          compact
                          value={
                            x.color ||
                            r.style?.colors?.sectionHeading ||
                            r.accent
                          }
                          onChange={color =>
                            setData({
                              ...data,
                              sections: data.sections.map(z =>
                                z.id === x.id ? { ...z, color } : z,
                              ),
                            })
                          }
                        />
                      </View>
                    </Card>
                  </ScaleDecorator>
                );
                return x.type === 'custom' ? (
                  <Swipeable
                    overshootRight={false}
                    renderRightActions={() => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${sectionTitle(x)}`}
                        onPress={() => confirmRemoveSection(x)}
                        style={[s.swipeDelete, { backgroundColor: c.danger }]}
                      >
                        <AppIcon name="delete-outline" size={26} color="#FFFFFF" />
                      </Pressable>
                    )}
                  >
                    {sectionCard}
                  </Swipeable>
                ) : sectionCard;
              }}
            />
            <Card>
              <Button
                icon="plus"
                label="Create custom section"
                onPress={() =>
                  navigation.navigate('CustomSection', { resumeId: r.id })
                }
              />
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
                  {section ? sectionTitle(section) : 'Section'}
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
                      {(section?.type === 'custom'
                        ? displayCustomEntry(e, section).title
                        : e.title) ||
                        `Untitled ${
                          section ? sectionTitle(section) : 'Section'
                        }`}
                    </Text>
                    <Text style={[s.entrySub, { color: c.muted }]}>
                      {(section?.type === 'custom'
                        ? displayCustomEntry(e, section).subtitle
                        : e.subtitle) || 'Tap to add details'}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              <Button
                icon="plus"
                label={`Add ${section ? sectionTitle(section) : 'Section'}`}
                onPress={() =>
                  setEntry({
                    id: makeId(),
                    resumeId: r.id,
                    type: section?.type ?? 'custom',
                    sectionId:
                      section?.type === 'custom' ? section.id : undefined,
                    title: '',
                    subtitle: '',
                    startDate: '',
                    endDate: '',
                    details: '',
                    meta: '',
                    sortOrder: Date.now(),
                  })
                }
              />
            </View>
          </>
        )}
      </NestableScrollContainer>
      <Modal
        visible={!!renamingSection}
        transparent
        animationType="fade"
        onRequestClose={() => setRenamingSection(undefined)}
      >
        <View style={[s.renameScrim, { backgroundColor: c.overlay + 'CC' }]}>
          <View
            style={[
              s.renameCard,
              { backgroundColor: c.surface, borderColor: c.line },
            ]}
          >
            <Text style={[s.renameTitle, { color: c.ink }]}>
              Rename section
            </Text>
            <Text style={[s.help, { color: c.muted }]}>
              This name will be used in the editor and on the resume.
            </Text>
            <Field
              label="Section name"
              value={sectionNameDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={applySectionName}
              onChangeText={setSectionNameDraft}
            />
            <View style={s.renameActions}>
              <View style={s.renameAction}>
                <Button
                  icon="close"
                  label="Cancel"
                  kind="ghost"
                  onPress={() => setRenamingSection(undefined)}
                />
              </View>
              <View style={s.renameAction}>
                <Button icon="check" label="Apply" onPress={applySectionName} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <EntryModal
        value={entry}
        sectionName={section ? sectionTitle(section) : undefined}
        customFields={
          section?.type === 'custom' ? customFieldsFor(section) : undefined
        }
        onClose={() => setEntry(undefined)}
        onDone={saved => {
          setData(
            current =>
              current && {
                ...current,
                entries: current.entries.some(item => item.id === saved.id)
                  ? current.entries.map(item =>
                      item.id === saved.id ? saved : item,
                    )
                  : [...current.entries, saved],
              },
          );
          setEntry(undefined);
        }}
        onDelete={id => {
          setData(
            current =>
              current && {
                ...current,
                entries: current.entries.filter(item => item.id !== id),
              },
          );
          setEntry(undefined);
        }}
      />
      <View
        style={[s.bottom, { backgroundColor: c.header, borderColor: c.line }]}
      >
        <Button
          icon="view-grid-outline"
          label="Change template"
          kind="ghost"
          onPress={() => navigation.navigate('Templates', { resumeId: r.id })}
        />
        <Button
          icon="content-save-outline"
          label={saving ? 'Saving…' : 'Save'}
          disabled={saving}
          onPress={save}
        />
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
  customFields,
}: {
  value?: Entry;
  sectionName?: string;
  customFields?: import('../types').CustomField[];
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
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
        <ScrollView
          style={{ backgroundColor: c.canvas }}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.heading, { color: c.ink }]}>
            Edit {sectionName || sectionLabels[draft.type]}
          </Text>
          <View style={s.form}>
            {draft.type === 'custom' && customFields ? (
              customFields.map(field => (
                <Field
                  key={field.id}
                  label={field.label}
                  value={
                    draft.customValues?.[field.id] ??
                    (field.id === 'title'
                      ? draft.title
                      : field.id === 'subtitle'
                      ? draft.subtitle
                      : field.id === 'startDate'
                      ? draft.startDate
                      : field.id === 'endDate'
                      ? draft.endDate
                      : field.id === 'details'
                      ? draft.details
                      : '')
                  }
                  multiline={field.kind === 'multiline'}
                  keyboardType={
                    field.kind === 'email'
                      ? 'email-address'
                      : field.kind === 'phone'
                      ? 'phone-pad'
                      : field.kind === 'url'
                      ? 'url'
                      : 'default'
                  }
                  autoCapitalize={
                    field.kind === 'email' || field.kind === 'url'
                      ? 'none'
                      : 'sentences'
                  }
                  onChangeText={value =>
                    p({
                      customValues: {
                        ...Object.fromEntries(
                          customFields.map(item => [
                            item.id,
                            draft.customValues?.[item.id] ??
                              (item.id === 'title'
                                ? draft.title
                                : item.id === 'subtitle'
                                ? draft.subtitle
                                : item.id === 'startDate'
                                ? draft.startDate
                                : item.id === 'endDate'
                                ? draft.endDate
                                : item.id === 'details'
                                ? draft.details
                                : ''),
                          ]),
                        ),
                        [field.id]: value,
                      },
                    })
                  }
                />
              ))
            ) : (
              <>
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
                {draft.type === 'experience' &&
                  bulletExamples.map(x => (
                    <Pressable
                      key={x}
                      style={[s.example, { backgroundColor: c.primarySoft }]}
                      onPress={() =>
                        p({
                          details: [draft.details, x]
                            .filter(Boolean)
                            .join('\n• '),
                        })
                      }
                    >
                      <Text style={[s.exampleText, { color: c.muted }]}>
                        {x}
                      </Text>
                    </Pressable>
                  ))}
                {!!extras.legacy && (
                  <Field
                    label="Additional information from an earlier entry"
                    value={extras.legacy}
                    onChangeText={legacy => patchExtra('legacy', legacy)}
                  />
                )}
              </>
            )}
            <Button icon="check" label="Done" onPress={() => onDone(draft)} />
            <Button
              icon="delete-outline"
              label="Delete entry"
              kind="danger"
              onPress={() => onDelete(draft.id)}
            />
            <Button
              icon="close"
              label="Cancel"
              kind="ghost"
              onPress={onClose}
            />
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
  dragList: { gap: 10 },
  dragHandle: {
    width: 36,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandlePressed: { opacity: 0.65 },
  draggingCard: { opacity: 0.96, elevation: 8 },
  orderTitlePressable: { flex: 1, minWidth: 0 },
  orderTitle: { fontWeight: '800', color: colors.ink },
  longPressHint: { fontSize: 10, marginTop: 2 },
  swipeDelete: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  sectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  orderButton: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.primary,
    paddingHorizontal: 8,
  },
  renameScrim: { flex: 1, justifyContent: 'center', padding: 22 },
  renameCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  renameTitle: { fontSize: 20, fontWeight: '900' },
  renameActions: { flexDirection: 'row', gap: 10 },
  renameAction: { flex: 1 },
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
  photoPreview: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
  },
});
