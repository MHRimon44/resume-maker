import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ResumeBundle, SectionType } from '../types';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

export function AtsResumePreview({ bundle }: { bundle: ResumeBundle }) {
  const { resume, entries } = bundle;
  const p = resume.personal;
  const scale = resume.fontScale;
  const heading = (type: SectionType) => type === 'summary' ? 'Professional Summary' :
    type === 'experience' ? 'Professional Experience' : type === 'skills' ? 'Technical Skills' :
    type === 'projects' ? 'Selected Projects' : sectionLabels[type];
  return <View style={s.page}>
    <View style={s.header}>
      {!!p.photoUri && <Image source={{ uri: p.photoUri }} style={s.photo} />}
      <Text style={[s.name, { fontSize: 19 * scale }]}>{p.fullName || 'Your Name'}</Text>
      {!!p.headline && <Text style={[s.headline, { fontSize: 10 * scale }]}>{p.headline}</Text>}
      <Text style={s.contact}>{[p.location, p.phone, p.email].filter(Boolean).join('  |  ')}</Text>
      <Text style={s.contact}>{[p.website, p.github, p.portfolio].filter(Boolean).join('  |  ')}</Text>
    </View>
    {bundle.sections.filter(x => x.visible).sort((a, b) => a.sortOrder - b.sortOrder).map(section => {
      const items = entries.filter(e => e.type === section.type);
      if (section.type === 'summary' ? !resume.summary : !items.length) return null;
      return <View key={section.id} style={s.section}>
        <Text style={[s.heading, { color: resume.accent, borderBottomColor: resume.accent, fontSize: 11 * scale }]}>{heading(section.type)}</Text>
        {section.type === 'summary' ? <Text style={[s.body, { fontSize: 9 * scale }]}>{resume.summary}</Text> : items.map(e => {
          const extra = parseEntryExtras(e.meta);
          const right = section.type === 'projects' ? e.subtitle : [e.startDate, e.endDate].filter(Boolean).join(' – ');
          return <View key={e.id} style={s.item}>
            <View style={s.row}><Text style={[s.itemTitle, { fontSize: 9 * scale }]}>{e.title}{section.type === 'skills' && e.title && !e.title.endsWith(':') ? ':' : ''}</Text>
              {!!right && <Text style={[s.body, s.right, { fontSize: 8 * scale }]}>{right}</Text>}</View>
            {section.type !== 'projects' && (!!e.subtitle || !!extra.location) &&
              <View style={s.row}><Text style={[s.italic, { fontSize: 8 * scale }]}>{e.subtitle}</Text><Text style={[s.italic, s.right, { fontSize: 8 * scale }]}>{extra.location}</Text></View>}
            {!!e.details && <Text style={[s.body, { fontSize: 8 * scale }]}>{e.details.split('\n').filter(Boolean).map(line =>
              (section.type === 'experience' || section.type === 'leadership' || section.type === 'awards' ? '•  ' : '') + line.replace(/^[•›-]\s*/, '')).join('\n')}</Text>}
            {entryExtraLines(section.type, e.meta).filter(x => !x.startsWith('Work location:') && !x.startsWith('Campus / location:'))
              .map((line, index) => <Text key={index} style={[s.body, { fontSize: 8 * scale }]}>{line}</Text>)}
          </View>;
        })}
      </View>;
    })}
  </View>;
}
const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 27, minHeight: 650 },
  header: { alignItems: 'center', marginBottom: 7 },
  photo: { width: 45, height: 45, borderRadius: 23, marginBottom: 4 },
  name: { color: '#171717', fontFamily: 'serif', fontWeight: 'bold' },
  headline: { color: '#171717', fontFamily: 'serif' },
  contact: { color: '#171717', fontSize: 8, fontFamily: 'serif', textAlign: 'center' },
  section: { marginTop: 8 },
  heading: { fontFamily: 'serif', fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 },
  item: { marginBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  itemTitle: { flex: 1, color: '#171717', fontFamily: 'serif', fontWeight: 'bold' },
  right: { textAlign: 'right' },
  body: { color: '#171717', fontFamily: 'serif', lineHeight: 12 },
  italic: { flex: 1, color: '#171717', fontFamily: 'serif', fontStyle: 'italic' },
});
