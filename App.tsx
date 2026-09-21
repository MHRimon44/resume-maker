import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { AdsProvider } from './src/components/AdBanner';

export default function App() {
  const dark = useSettingsStore(s => s.darkMode);
  const hydrate = useSettingsStore(s => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <AdsProvider>
        <AppNavigator />
      </AdsProvider>
    </SafeAreaProvider>
  );
}
