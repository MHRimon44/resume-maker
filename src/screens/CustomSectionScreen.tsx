import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Field, IconButton, ScreenHeader } from '../components/ui';
import { CustomField, CustomFieldKind, RootStackParamList } from '../types';
import { useAppColors } from '../theme';
import { makeId } from '../utils/id';
import { putCustomSectionDraft } from '../store/customSectionDraft';

const kinds: { kind: CustomFieldKind; label: string }[] = [
  { kind: 'text', label: 'Short text' }, { kind: 'multiline', label: 'Long text' },
  { kind: 'date', label: 'Date' }, { kind: 'email', label: 'Email' },
  { kind: 'phone', label: 'Phone' }, { kind: 'url', label: 'Link' },
];
const suggestions = [
  { label: 'Title', kind: 'text' as const },
  { label: 'Subtitle', kind: 'text' as const },
  { label: 'Organization', kind: 'text' as const },
  { label: 'Location', kind: 'text' as const },
  { label: 'Start date', kind: 'date' as const },
  { label: 'End date', kind: 'date' as const },
  { label: 'Description', kind: 'multiline' as const },
  { label: 'Email', kind: 'email' as const },
  { label: 'Phone', kind: 'phone' as const },
  { label: 'Link', kind: 'url' as const },
];
export function CustomSectionScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'CustomSection'>) {
  const c = useAppColors();
  const [title, setTitle] = useState(route.params.title ?? '');
  const [fields, setFields] = useState<CustomField[]>(route.params.fields?.length ? route.params.fields : []);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKind, setFieldKind] = useState<CustomFieldKind>('text');
  const addField = (label: string, kind: CustomFieldKind) => {
    const trimmed = label.trim();
    if (!trimmed) { Alert.alert('Field name required', 'Enter a name for this field.'); return; }
    if (fields.some(f => f.label.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Field exists', 'Each field needs a different name.'); return;
    }
    setFields(current => [...current, { id: makeId(), label: trimmed, kind }]);
    setFieldLabel('');
  };
  const move = (index: number, direction: number) => {
    const next = [...fields], target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
  };
  return <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
    <ScreenHeader title={route.params.sectionId ? 'Edit custom section' : 'New custom section'}
      subtitle="Choose the fields shown when adding an entry" onBack={navigation.goBack} />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Card><Field label="Section title" placeholder="e.g. Publications" value={title} onChangeText={setTitle} /></Card>
      <Card>
        <Text style={[s.heading, { color: c.ink }]}>Entry fields</Text>
        <Text style={[s.help, { color: c.muted }]}>Add the fields you want on this section's entry form.</Text>
        <View style={s.suggestions}>{suggestions.map(x => <Chip key={x.label} label={x.label}
          selected={false} onPress={() => addField(x.label, x.kind)} />)}</View>
        <Field label="Your own field label" value={fieldLabel} onChangeText={setFieldLabel}
          placeholder="e.g. Publication ID" />
        <View style={s.suggestions}>{kinds.map(x => <Chip key={x.kind} label={x.label}
          selected={fieldKind === x.kind} onPress={() => setFieldKind(x.kind)} />)}</View>
        <Button icon="plus" label="Add field" onPress={() => addField(fieldLabel, fieldKind)} />
      </Card>
      <Card>
        <Text style={[s.heading, { color: c.ink }]}>Form preview</Text>
        {!fields.length && <Text style={[s.help, { color: c.muted }]}>Choose at least one field above.</Text>}
        {fields.map((field, index) => <View key={field.id} style={[s.fieldRow, { borderColor: c.line }]}>
          <View style={s.fieldText}><Text style={{ color: c.ink, fontWeight: '700' }}>{field.label}</Text>
            <Text style={{ color: c.muted }}>{kinds.find(x => x.kind === field.kind)?.label}</Text></View>
          <IconButton icon="arrow-up" accessibilityLabel={`Move ${field.label} up`} onPress={() => move(index, -1)} />
          <IconButton icon="arrow-down" accessibilityLabel={`Move ${field.label} down`} onPress={() => move(index, 1)} />
          <IconButton icon="delete-outline" kind="danger" accessibilityLabel={`Remove ${field.label}`}
            onPress={() => setFields(current => current.filter(x => x.id !== field.id))} />
        </View>)}
      </Card>
      <Button icon="content-save-outline" label="Save section" onPress={() => {
        const name = title.trim();
        if (!name) { Alert.alert('Title required', 'Enter a title for this section.'); return; }
        if (!fields.length) { Alert.alert('Fields required', 'Choose at least one entry field.'); return; }
        putCustomSectionDraft(route.params.resumeId, { id: route.params.sectionId, title: name, fields });
        navigation.goBack();
      }} />
      <Text style={[s.help, { color: c.muted }]}>After adding this section, use the editor's Save button to store all resume changes.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 16, paddingBottom: 40, gap: 13 },
  heading: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  help: { fontSize: 12, marginBottom: 12 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingVertical: 10 },
  fieldText: { flex: 1 }, action: { fontSize: 23, paddingHorizontal: 5, fontWeight: '700' },
});
