import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ResumeBundle, SectionType } from '../types';
import { sectionLabels } from '../constants/content';
import { entriesForSection, sectionTitle, fontFamilies, fontFor } from '../utils/resumeStyle';

const sideTypes: SectionType[] = ['skills', 'languages'];
const leftTypes: SectionType[] = ['experience', 'projects', 'leadership'];
export function GlobalResumePreview({ bundle }: { bundle: ResumeBundle }) {
  const { resume, entries } = bundle;
  const p = resume.personal, color = resume.accent, variant = resume.templateId;
  const style = resume.style?.colors ?? {};
  const fontFamily = fontFamilies.find(x => x.key === fontFor(resume))!.native;
  const scale = resume.fontScale;
  const side = variant === 'profile' || variant === 'navy' || variant === 'timeline';
  const executive = variant === 'executive';
  const contact = [p.phone, p.email, p.location, p.website, p.github, p.portfolio, p.nationality].filter(Boolean).join('  |  ');
  const sectionNodes = (pick: (t: SectionType) => boolean, onDark = false) => bundle.sections.filter(s => s.visible && pick(s.type))
    .sort((a, b) => a.sortOrder - b.sortOrder).map(s => {
      const records = entriesForSection(bundle, s);
      if (s.type === 'summary' ? !resume.summary : !records.length) return null;
      const title = s.type === 'summary' ? 'About me' : s.type === 'experience' ? 'Work experience' :
        s.type === 'education' ? 'Education and training' : s.type === 'leadership' ? 'Activities' : sectionTitle(s);
      return <View key={s.id} style={styles.section}>
        <Text style={[styles.sectionTitle, { borderBottomColor: s.color || color, color: s.color || style.sectionHeading || (onDark ? '#FFFFFF' : '#253440'), fontFamily, fontSize: 10 * scale }]}>{title.toUpperCase()}</Text>
        {s.type === 'summary' ? <Text style={[styles.body, { color: style.body || (onDark ? '#FFFFFF' : undefined), fontFamily, fontSize: 8 * scale }]}>{resume.summary}</Text> : records.map(e =>
          <View key={e.id} style={[styles.entry, (variant === 'timeline' || variant === 'profile') && pick !== sidePick && styles.timelineEntry,
            (variant === 'timeline' || variant === 'profile') && pick !== sidePick && { borderLeftColor: color }]}>
            {!!(e.startDate || e.endDate) && <Text style={[styles.date, { color: style.meta || (onDark ? '#E4E9EE' : color), fontFamily, fontSize: 8 * scale }]}>{[e.startDate, e.endDate].filter(Boolean).join(' – ')}</Text>}
            <Text style={[styles.entryTitle, { color: style.entryTitle || (onDark ? '#FFFFFF' : undefined), fontFamily, fontSize: 9 * scale }]}>{e.title}</Text>
            {!!e.subtitle && <Text style={[styles.sub, { color: style.meta || (onDark ? '#E4E9EE' : undefined), fontFamily, fontSize: 8 * scale }]}>{e.subtitle}</Text>}
            {!!e.details && <Text style={[styles.body, { color: style.body || (onDark ? '#E4E9EE' : undefined), fontFamily, fontSize: 8 * scale }]}>{e.details}</Text>}
          </View>)}
      </View>;
    });
  function sidePick(type: SectionType) { return sideTypes.includes(type); }
  const photo = !!p.photoUri && <Image source={{ uri: p.photoUri }} style={styles.photo} />;
  const identity = <View style={executive ? { flex: 1 } : undefined}><Text style={[styles.name, { color: style.name || (variant === 'navy' ? '#FFFFFF' : undefined), fontFamily, fontSize: 19 * scale }]}>{p.fullName || 'Your Name'}</Text>
    <Text style={[styles.headline, { color: style.headline || (variant === 'navy' ? '#E4E9EE' : undefined), fontFamily, fontSize: 9 * scale }]}>{p.headline}</Text></View>;
  if (side) return <View style={[styles.page, { backgroundColor: style.page }]}>
    <View style={styles.columns}>
      <View style={[styles.aside, { backgroundColor: style.sidebar || (variant === 'navy' ? '#0C3154' : variant === 'timeline' ? '#E5F0FC' : '#F5F7F9') }]}>
        {photo}{identity}
        {[p.gender, p.dateOfBirth, p.phone, p.email, p.website, p.location, p.github, p.portfolio, p.nationality].filter(Boolean).map((x, i) =>
          <Text key={i} style={[styles.contactItem, { color: style.contact || (variant === 'navy' ? '#FFFFFF' : '#39444C'), fontFamily, fontSize: 8 * scale }]}>{x}</Text>)}
        {sectionNodes(sidePick, variant === 'navy')}
        {!!p.interests && <Text style={[styles.contactItem, { color: style.contact || (variant === 'navy' ? '#FFFFFF' : undefined), fontFamily, fontSize: 8 * scale }]}>INTERESTS\n{p.interests}</Text>}
      </View>
      <View style={[styles.main, { backgroundColor: style.page }]}>{sectionNodes(t => !sideTypes.includes(t))}</View>
    </View>
  </View>;
  if (executive) return <View style={[styles.page, { padding: 20, backgroundColor: style.page }]}>
    <View style={[styles.executiveHead, { borderColor: color, backgroundColor: style.header }]}><View style={styles.row}>{photo}{identity}</View>
      {!!resume.summary && <Text style={[styles.body, { color: style.body, fontFamily, fontSize: 8 * scale }]}>{resume.summary}</Text>}</View>
    <View style={[styles.contactStrip, { backgroundColor: style.header }]}><Text style={[styles.whiteContact, { color: style.contact, fontFamily }]}>{contact}</Text></View>
    <View style={styles.columns}><View style={styles.half}>{sectionNodes(t => leftTypes.includes(t))}</View>
      <View style={styles.half}>{sectionNodes(t => t !== 'summary' && !leftTypes.includes(t))}</View></View>
  </View>;
  return <View style={[styles.page, { padding: 25, backgroundColor: style.page }]}>
    <View style={[styles.header, { backgroundColor: style.header }, variant === 'international' && { backgroundColor: style.header || color, padding: 15, marginBottom: 10 }]}>
      {photo}<View style={{ flex: 1 }}><Text style={[styles.name, { color: style.name || (variant === 'international' ? '#FFFFFF' : undefined), fontFamily, fontSize: 19 * scale }]}>{p.fullName || 'Your Name'}</Text>
        <Text style={[styles.headline, { color: style.headline || (variant === 'international' ? '#FFFFFF' : undefined), fontFamily, fontSize: 9 * scale }]}>{p.headline}</Text>
        <Text style={[styles.contactItem, { color: style.contact || (variant === 'international' ? '#FFFFFF' : undefined), fontFamily, fontSize: 8 * scale }]}>{contact}</Text></View>
    </View>{sectionNodes(() => true)}
  </View>;
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', minHeight: 700 }, columns: { flexDirection: 'row', minHeight: 700 },
  aside: { width: '31%', padding: 13 }, main: { width: '69%', padding: 18 }, half: { flex: 1, paddingHorizontal: 5 },
  photo: { width: 54, height: 54, borderRadius: 27, marginBottom: 8 },
  name: { fontSize: 19, fontWeight: '800', color: '#273641' },
  headline: { fontSize: 9, color: '#53616B', marginTop: 3 },
  contactItem: { fontSize: 8, marginTop: 7, color: '#485661' },
  header: { flexDirection: 'row', gap: 9, marginBottom: 13 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '800', borderBottomWidth: 1, paddingBottom: 3, marginBottom: 5 },
  entry: { marginBottom: 9 }, entryTitle: { fontSize: 9, fontWeight: '800', color: '#273641' },
  date: { fontSize: 8 }, sub: { fontSize: 8, color: '#5B666E' },
  body: { fontSize: 8, lineHeight: 12, color: '#414C53' },
  timelineEntry: { paddingLeft: 9, borderLeftWidth: 1 },
  executiveHead: { borderWidth: 1, borderRadius: 7, padding: 12 },
  row: { flexDirection: 'row', gap: 10 },
  contactStrip: { backgroundColor: '#20394D', padding: 12, borderRadius: 5, marginVertical: 8 },
  whiteContact: { color: '#FFFFFF', fontSize: 8 },
});
