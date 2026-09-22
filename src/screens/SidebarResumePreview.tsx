import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ResumeBundle, SectionType } from '../types';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';
import { entriesForSection, sectionTitle, fontFamilies, fontFor } from '../utils/resumeStyle';

export function SidebarResumePreview({ bundle }: { bundle: ResumeBundle }) {
  const { resume, entries, sections } = bundle;
  const p = resume.personal;
  const scale = resume.fontScale;
  const style = resume.style?.colors ?? {};
  const fontFamily = fontFamilies.find(x => x.key === fontFor(resume))!.native;
  const visible = (type: SectionType) => sections.some(x => x.type === type && x.visible);
  const sideItems = (type: SectionType, heading: string) => {
    const list = visible(type) ? entries.filter(e => e.type === type) : [];
    if (!list.length) return null;
    return <View style={s.sideSection} key={type}>
      <Text style={[s.sideHeading, { color: style.sectionHeading, fontFamily, fontSize: 10 * scale }]}>{heading}</Text>
      {list.map(e => <View key={e.id} style={s.sideItem}>
        <Text style={[s.sideTitle, { color: style.entryTitle, fontFamily, fontSize: 8 * scale }]}>{e.title}</Text>
        {!!e.subtitle && <Text style={[s.sideText, { color: style.body, fontFamily, fontSize: 8 * scale }]}>{e.subtitle}</Text>}
        {!!e.details && <Text style={[s.sideText, { color: style.body, fontFamily, fontSize: 8 * scale }]}>{e.details}</Text>}
      </View>)}
    </View>;
  };
  return <View style={[s.page, { backgroundColor: style.page }]}>
    <View style={[s.top, { backgroundColor: style.header || resume.accent }]}>
      <View style={s.identity}><Text style={[s.name, { fontSize: 22 * scale, color: style.name, fontFamily }]}>{p.fullName || 'Your Name'}</Text>
        <Text style={[s.headline, { fontSize: 12 * scale, color: style.headline, fontFamily }]}>{p.headline}</Text></View>
      {!!p.photoUri && <Image source={{ uri: p.photoUri }} style={s.photo} />}
    </View>
    <View style={s.columns}>
      <View style={[s.sidebar, { backgroundColor: style.sidebar }]}>
        {[p.gender, p.dateOfBirth, p.nationality, p.phone, p.email, p.website, p.location, p.github, p.portfolio]
          .filter(Boolean).map((value, index) => <Text key={index} style={[s.sideContact, { color: style.contact, fontFamily, fontSize: 8 * scale }]}>{value}</Text>)}
        {sideItems('skills', 'SKILLS')}{sideItems('languages', 'LANGUAGES')}
        {sideItems('awards', 'HONORS & AWARDS')}{sideItems('certifications', 'CERTIFICATIONS')}
        {!!p.interests && <View style={s.sideSection}><Text style={[s.sideHeading, { color: style.sectionHeading, fontFamily }]}>INTERESTS</Text>
          <Text style={[s.sideText, { color: style.body, fontFamily }]}>{p.interests}</Text></View>}
      </View>
      <View style={[s.main, { backgroundColor: style.page }]}>
        {sections.filter(x => x.visible && !(['skills', 'languages', 'awards', 'certifications'] as SectionType[]).includes(x.type))
          .sort((a, b) => a.sortOrder - b.sortOrder).map(section => {
            const list = entriesForSection(bundle, section);
            if (section.type === 'summary' ? !resume.summary : !list.length) return null;
            const heading = section.type === 'summary' ? 'OBJECTIVE' : section.type === 'experience' ? 'WORK EXPERIENCE' :
              section.type === 'leadership' ? 'ACTIVITIES' : sectionTitle(section).toUpperCase();
            return <View key={section.id} style={s.section}>
              <View style={s.headingRow}><Text style={[s.heading, { fontSize: 10 * scale, color: section.color || style.sectionHeading, fontFamily }]}>{heading}</Text><View style={s.rule} /></View>
              {section.type === 'summary' ? <Text style={[s.body, { color: style.body, fontFamily, fontSize: 8 * scale }]}>{resume.summary}</Text> : list.map(e => {
                const extra = parseEntryExtras(e.meta);
                const period = [e.startDate, e.endDate].filter(Boolean).join(' - ');
                return <View style={s.item} key={e.id}>
                  <Text style={s.bullet}>•</Text>
                  <View style={s.itemContent}>
                    <View style={s.row}><Text style={[s.itemTitle, { color: style.entryTitle, fontFamily, fontSize: 8 * scale }]}>{e.title}</Text><Text style={[s.period, { color: style.meta, fontFamily }]}>{period}</Text></View>
                    {!!(e.subtitle || extra.location) && <View style={s.row}><Text style={[s.sub, { color: style.meta, fontFamily, fontSize: 8 * scale }]}>{e.subtitle}</Text><Text style={[s.period, { color: style.meta, fontFamily }]}>{extra.location}</Text></View>}
                    {!!e.details && <Text style={[s.body, { color: style.body, fontFamily, fontSize: 8 * scale }]}>{e.details}</Text>}
                    {entryExtraLines(section.type, e.meta).filter(x => !x.startsWith('Work location:') && !x.startsWith('Campus / location:'))
                      .map((line, index) => <Text style={[s.body, { color: style.body, fontFamily }]} key={index}>{line}</Text>)}
                  </View>
                </View>;
              })}
            </View>;
          })}
      </View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  page: { backgroundColor: '#F8FAFC', minHeight: 700, paddingTop: 12 },
  top: { height: 85, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  identity: { flex: 1 }, name: { color: '#FFFFFF', fontWeight: '800' },
  headline: { color: '#FFFFFF', letterSpacing: 1 },
  photo: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#FFFFFF' },
  columns: { flexDirection: 'row', minHeight: 603 },
  sidebar: { width: '31%', backgroundColor: '#293844', padding: 12 },
  sideContact: { color: '#EFF4F6', fontSize: 8, marginBottom: 8 },
  sideSection: { borderTopWidth: 1, borderTopColor: '#B6C2C8', paddingTop: 10, marginTop: 12 },
  sideHeading: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  sideItem: { marginBottom: 8 }, sideTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 8 },
  sideText: { color: '#E1E8EC', fontSize: 8, marginTop: 2 },
  main: { flex: 1, padding: 13 }, section: { marginBottom: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  heading: { color: '#293139', fontWeight: '800' }, rule: { flex: 1, height: 1, backgroundColor: '#555D64' },
  body: { color: '#4C535A', fontSize: 8, lineHeight: 11 },
  item: { flexDirection: 'row', marginBottom: 12 }, bullet: { width: 12, color: '#333333', fontSize: 12 },
  itemContent: { flex: 1 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  itemTitle: { flex: 1, color: '#32383E', fontWeight: '800', fontSize: 8 },
  period: { color: '#444B52', fontSize: 7, textAlign: 'right' },
  sub: { flex: 1, color: '#646C72', fontSize: 8 },
});
