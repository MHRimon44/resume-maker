import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScreenHeader } from '../components/ui';
import { resumeRepository } from '../repositories/resumeRepository';
import { exportPdf } from '../services/exportService';
import { ResumeBundle, RootStackParamList } from '../types';
import { ReferenceResumePreview } from './ReferenceResumePreview';
import { AtsResumePreview } from './AtsResumePreview';
import { SidebarResumePreview } from './SidebarResumePreview';
import { GlobalResumePreview } from './GlobalResumePreview';
import { templates } from '../constants/content';
import { useAppColors } from '../theme';

export function PreviewScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Preview'>) {
  const c = useAppColors();
  const [bundle, setBundle] = useState<ResumeBundle | undefined>(route.params.draft);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    if (route.params.draft) setBundle(route.params.draft);
    else resumeRepository.bundle(route.params.resumeId).then(setBundle).catch(error =>
      Alert.alert('Could not load preview', String(error)),
    );
  }, [route.params.resumeId, route.params.draft]));

  if (!bundle) return <ActivityIndicator color={c.primary} />;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Resume preview"
        subtitle={`${bundle.resume.paperSize} · ${templates.find(t => t.id === bundle.resume.templateId)?.name ?? 'CV'}`}
        onBack={navigation.goBack}
        right={<Button label={busy ? 'Exporting…' : '↓ PDF'} disabled={busy} onPress={async () => {
          try {
            setBusy(true);
            await exportPdf(bundle);
          } catch (error) {
            Alert.alert('Export failed', error instanceof Error ? error.message : 'Please try again');
          } finally {
            setBusy(false);
          }
        }} />}
      />
      <ScrollView style={{ backgroundColor: c.overlay }} contentContainerStyle={styles.canvas}>
        <View style={styles.paper}>{bundle.resume.templateId === 'sidebar'
          ? <SidebarResumePreview bundle={bundle} />
          : bundle.resume.templateId === 'ats' ? <AtsResumePreview bundle={bundle} />
          : bundle.resume.templateId !== 'mehedi' ? <GlobalResumePreview bundle={bundle} />
          : <ReferenceResumePreview bundle={bundle} />}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  canvas: { padding: 14, paddingBottom: 36, alignItems: 'center' },
  paper: {
    backgroundColor: '#FFFFFF', width: '100%', maxWidth: 540, minHeight: 620,
    shadowColor: '#111827', shadowOpacity: 0.1, shadowRadius: 14, elevation: 5,
  },
});
