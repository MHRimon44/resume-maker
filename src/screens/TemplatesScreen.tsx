import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ui';
import { templates } from '../constants/content';
import { resumeRepository } from '../repositories/resumeRepository';
import { RootStackParamList, TemplateId } from '../types';
import { colors, space, useAppColors } from '../theme';
import { chooseTemplateForEditor } from '../store/templateSelection';

const accents: Record<TemplateId, string> = {
  mehedi: '#174A92',
  ats: '#173B57',
  sidebar: '#5689A4',
  international: '#0E4C77',
  profile: '#16439B',
  structured: '#81878E',
  navy: '#0D3156',
  timeline: '#154989',
  executive: '#D69B33',
};

export function TemplatesScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Templates'>) {
  const [busy, setBusy] = useState(false);
  const c = useAppColors();
  const select = async (id: TemplateId) => {
    if (busy) return;
    setBusy(true);
    try {
      if (route.params?.resumeId) {
        chooseTemplateForEditor(route.params.resumeId, id);
        navigation.goBack();
      } else {
        const resumeId = await resumeRepository.create(id);
        navigation.replace('Editor', { resumeId });
      }
    } catch (error) {
      Alert.alert('Could not choose template', String(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Template library"
        subtitle="Choose a layout for your resume"
        onBack={navigation.goBack}
      />
      <View style={s.head}>
        <Text style={[s.kicker, { color: c.primary }]}>
          NINE RESUME TEMPLATES
        </Text>
        <Text style={[s.title, { color: c.ink }]}>
          Your resume template.
        </Text>
        <Text style={[s.sub, { color: c.muted }]}>
          Choose the look that fits your resume.
        </Text>
      </View>
      <FlatList
        data={templates}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => select(item.id)}
            style={[
              s.card,
              { backgroundColor: c.surface, borderColor: c.line },
            ]}
          >
            <View style={[s.paper, { borderTopColor: accents[item.id] }]}> 
              {(['sidebar', 'profile', 'navy', 'timeline'] as TemplateId[]).includes(item.id) &&
                <View style={[s.paperSidebar, { backgroundColor: item.id === 'timeline' ? '#E5F0FC' : item.id === 'profile' ? '#F4F5F7' : '#293844' }]} />}
              <View
                style={[
                  s.paperName,
                  {
                    backgroundColor: accents[item.id],
                    width: item.id === 'ats' ? '70%' : '65%',
                    alignSelf: item.id === 'ats' ? 'center' : 'auto',
                  },
                ]}
              />
              <View style={s.paperContact} />
              <View
                style={[s.paperHeading, { backgroundColor: accents[item.id],
                  height: item.id === 'ats' ? 1 : 4, width: item.id === 'ats' ? '100%' : '42%' }]}
              />
              <View style={s.paperLine} />
              <View style={[s.paperLine, s.short]} />
              <View
                style={[s.paperHeading, { backgroundColor: accents[item.id],
                  height: item.id === 'ats' ? 1 : 4, width: item.id === 'ats' ? '100%' : '42%' }]}
              />
              <View style={s.paperLine} />
              <View style={s.paperLine} />
              <View style={[s.paperLine, s.short]} />
            </View>
            <View style={s.copy}>
              <Text style={[s.number, { color: c.primary }]}>
                0{index + 1} / 0{templates.length}
              </Text>
              <Text style={[s.name, { color: c.ink }]}>{item.name}</Text>
              <Text style={[s.desc, { color: c.muted }]}>
                {item.description}
              </Text>
              <Text style={[s.choose, { color: c.primary }]}>
                {busy ? 'Please wait…' : 'Use this style  ↗'}
              </Text>
            </View>
          </Pressable>
        )}
      />
      {busy && <ActivityIndicator style={s.activity} color={c.primary} />}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  head: { paddingHorizontal: 18, paddingTop: 9, paddingBottom: 18 },
  back: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 25,
  },
  kicker: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
    marginTop: 8,
    maxWidth: 310,
  },
  sub: { color: colors.muted, lineHeight: 19, marginTop: 7 },
  list: { paddingHorizontal: space.md, paddingBottom: 32, gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 17,
    padding: 11,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  paper: {
    width: 84,
    height: 113,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E5',
    borderTopWidth: 5,
    padding: 10,
    elevation: 2,
  },
  paperSidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%',
    backgroundColor: '#293844',
  },
  paperName: { height: 6, borderRadius: 3, marginBottom: 7 },
  paperContact: {
    height: 3,
    backgroundColor: '#B7C3C2',
    width: '78%',
    marginBottom: 13,
  },
  paperHeading: {
    height: 4,
    width: '42%',
    borderRadius: 2,
    marginBottom: 7,
    marginTop: 3,
  },
  paperLine: { height: 2, backgroundColor: '#CDD5D3', marginBottom: 5 },
  short: { width: '66%' },
  copy: { flex: 1 },
  number: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 6 },
  desc: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 5 },
  choose: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 10,
    fontSize: 13,
  },
  activity: { position: 'absolute', bottom: 10, alignSelf: 'center' },
});
