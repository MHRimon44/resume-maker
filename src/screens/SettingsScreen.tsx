import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenHeader } from '../components/ui';
import { useSettingsStore } from '../store/settingsStore';
import { resumeRepository } from '../repositories/resumeRepository';
import { backupJson, pickBackupJson } from '../services/exportService';
import { RootStackParamList } from '../types';
import { useAppColors } from '../theme';

export default function SettingsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { darkMode, toggle, hydrate } = useSettingsStore();
  const [isRestoring, setIsRestoring] = useState(false);
  const c = useAppColors();
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const chooseBackup = async () => {
    try {
      const backup = await pickBackupJson();
      if (backup === null) return;
      Alert.alert(
        'Restore this backup?',
        'Your current resumes will be replaced by the resumes in this backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setIsRestoring(true);
              try {
                const count = await resumeRepository.restoreAll(backup);
                Alert.alert(
                  'Backup restored',
                  `${count} ${
                    count === 1 ? 'resume' : 'resumes'
                  } restored successfully.`,
                );
              } catch (error) {
                Alert.alert(
                  'Restore failed',
                  error instanceof Error
                    ? error.message
                    : 'Could not restore this backup.',
                );
              } finally {
                setIsRestoring(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Could not open backup',
        error instanceof Error
          ? error.message
          : 'Please choose a valid JSON backup.',
      );
    }
  };
  return (
    <SafeAreaView style={[s.page, { backgroundColor: c.canvas }]}>
      <ScreenHeader
        title="Settings"
        subtitle="Appearance, privacy and local data"
        onBack={navigation.goBack}
      />
      <ScrollView contentContainerStyle={s.content}>
        <Card>
          <View style={s.row}>
            <View style={s.grow}>
              <Text style={[s.itemTitle, { color: c.ink }]}>
                Dark appearance
              </Text>
              <Text style={[s.copy, { color: c.muted }]}>
                Use the dark theme throughout the app.
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggle}
              trackColor={{ false: c.line, true: c.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
        <Card>
          <Text style={[s.itemTitle, { color: c.ink }]}>Local backup</Text>
          <Text style={[s.copy, { color: c.muted }]}>
            Export a private copy of all resumes stored on this device.
          </Text>
          <View style={s.spacer} />
          <Button
            icon="export-variant"
            label="Export backup"
            onPress={async () => backupJson(await resumeRepository.exportAll())}
          />
          <View style={s.buttonSpacer} />
          <Button
            icon="import"
            label={isRestoring ? 'Restoring…' : 'Import and restore backup'}
            kind="ghost"
            disabled={isRestoring}
            onPress={chooseBackup}
          />
        </Card>
        <Card>
          <Text style={[s.itemTitle, { color: c.ink }]}>Your privacy</Text>
          <Text style={[s.copy, { color: c.muted }]}>
            No account or cloud database. Your resume content stays in the app
            unless you share an export.
          </Text>
        </Card>
        <Card>
          <Text style={[s.itemTitle, { color: c.danger }]}>
            Delete all local data
          </Text>
          <Text style={[s.copy, { color: c.muted }]}>
            Permanently removes every resume from this device.
          </Text>
          <View style={s.spacer} />
          <Button
            icon="delete-outline"
            label="Delete everything"
            kind="danger"
            onPress={() =>
              Alert.alert('Delete all resumes?', 'This cannot be undone.', [
                { text: 'Cancel' },
                {
                  text: 'Delete all',
                  style: 'destructive',
                  onPress: () => resumeRepository.deleteAll(),
                },
              ])
            }
          />
        </Card>
        <Text style={[s.footer, { color: c.muted }]}>
          Resume Studio · Version {DeviceInfo.getVersion()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 14, gap: 11 },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800' },
  copy: { lineHeight: 18, marginTop: 4, fontSize: 13 },
  spacer: { height: 11 },
  buttonSpacer: { height: 8 },
  footer: { textAlign: 'center', margin: 18 },
});
