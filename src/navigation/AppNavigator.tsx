import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CustomSectionScreen } from '../screens/CustomSectionScreen';
import { useSettingsStore } from '../store/settingsStore';
import { darkColors, lightColors } from '../theme';
const Stack = createNativeStackNavigator<RootStackParamList>();
export function AppNavigator() {
  const dark = useSettingsStore(s => s.darkMode);
  const palette = dark ? darkColors : lightColors;
  const theme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.primary,
      background: palette.canvas,
      card: palette.header,
      text: palette.ink,
      border: palette.line,
    },
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
          <Stack.Screen name="Editor" component={EditorScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="CustomSection" component={CustomSectionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
