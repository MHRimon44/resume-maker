import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
type S = {
  darkMode: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: () => Promise<void>;
};
export const useSettingsStore = create<S>((set, get) => ({
  darkMode: false,
  hydrated: false,
  hydrate: async () => {
    set({
      darkMode: (await AsyncStorage.getItem('darkMode')) === 'true',
      hydrated: true,
    });
  },
  toggle: async () => {
    const value = !get().darkMode;
    set({ darkMode: value });
    await AsyncStorage.setItem('darkMode', String(value));
  },
}));
