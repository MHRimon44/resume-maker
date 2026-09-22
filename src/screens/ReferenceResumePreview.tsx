import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { sectionLabels } from '../constants/content';
import { ResumeBundle } from '../types';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

export function ReferenceResumePreview({
  bundle,
}: {
  bundle: ResumeBundle;
}) {
  const { resume, entries } = bundle;
  const p = resume.personal;
  const accent = resume.accent;
  const scale = resume.fontScale;
  const contacts = [
    p.phone,
    p.email,
    p.website && `LinkedIn: ${p.website}`,
    p.github && `GitHub: ${p.github}`,
    p.portfolio && `Portfolio: ${p.portfolio}`,
    p.location,
  ].filter(Boolean);
  return (
    <View style={s.page}>
      <View style={s.header}>
        {!!p.photoUri && <Image source={{ uri: p.photoUri }} style={s.photo} />}
        <View style={s.identity}>
          <Text style={[s.name, { fontSize: 23 * scale }]}>{p.fullName || 'Your Name'}</Text>
          <Text style={[s.headline, { fontSize: 10 * scale }]}>{p.headline}</Text>
        </View>
        <View style={s.contacts}>
          {contacts.map((contact, index) => (
            <Text key={index} style={[s.contact, { fontSize: 8 * scale }]}>
              {contact}
            </Text>
          ))}
        </View>
      </View>
      {bundle.sections
        .filter(item => item.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(section => {
          const items = entries.filter(entry => entry.type === section.type);
          if (section.type === 'summary' && !resume.summary) return null;
          if (section.type !== 'summary' && !items.length) return null;
          return (
            <View key={section.id} style={s.section}>
              <View style={[s.badge, { backgroundColor: accent }]}>
                <Text style={s.badgeText}>
                  {section.type === 'summary' ? 'Summary' : sectionLabels[section.type]}
                </Text>
              </View>
              {section.type === 'summary' ? (
                <Text style={[s.description, { fontSize: 9 * scale }]}>
                  •  {resume.summary}
                </Text>
              ) : items.map(item => {
                const extra = parseEntryExtras(item.meta);
                const right = section.type === 'projects'
                  ? item.subtitle
                  : [item.startDate, item.endDate].filter(Boolean).join(' – ');
                return (
                  <View key={item.id} style={s.item}>
                    <View style={s.itemRow}>
                      <Text style={[s.itemTitle, { fontSize: 9 * scale }]}>{item.title}</Text>
                      {!!right && <Text style={[s.right, { fontSize: 8 * scale, color: section.type === 'projects' ? accent : '#394047' }]}>{right}</Text>}
                    </View>
                    {!!item.subtitle && section.type !== 'projects' && (
                      <Text style={[s.sub, { fontSize: 8 * scale }]}>{item.subtitle}</Text>
                    )}
                    {!!extra.location && (
                      <Text style={[s.location, { fontSize: 8 * scale }]}>{extra.location}</Text>
                    )}
                    {!!item.details && (
                      <Text style={[s.description, { fontSize: 8 * scale }]}>
                        {section.type === 'skills' || section.type === 'references' ? '' : '›  '}
                        {item.details}
                      </Text>
                    )}
                    {entryExtraLines(section.type, item.meta)
                      .filter(line => !line.startsWith('Work location:') && !line.startsWith('Campus / location:'))
                      .map((line, index) => (
                        <Text key={index} style={[s.meta, { fontSize: 8 * scale }]}>{line}</Text>
                      ))}
                  </View>
                );
              })}
            </View>
          );
        })}
    </View>
  );
}

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 24, minHeight: 650 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  photo: { width: 48, height: 48, borderRadius: 24 },
  identity: { flex: 1 },
  name: { color: '#101010', fontWeight: '900' },
  headline: { color: '#333333', fontStyle: 'italic' },
  contacts: { width: '38%', gap: 1 },
  contact: { color: '#303030' },
  section: { marginTop: 11 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  badgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 9 },
  item: { paddingLeft: 7, marginTop: 5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemTitle: { color: '#101010', fontWeight: '800', flex: 1 },
  right: { textAlign: 'right' },
  sub: { color: '#4C555C', fontStyle: 'italic' },
  location: { color: '#4C555C', fontStyle: 'italic' },
  description: { color: '#3B3B3B', lineHeight: 13 },
  meta: { color: '#4C555C', marginTop: 1 },
});
