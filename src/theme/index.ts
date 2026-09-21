import { useSettingsStore } from '../store/settingsStore';

export const lightColors = {
  ink: '#172B36', muted: '#61717A', primary: '#176B67',
  primarySoft: '#E3F2EE', surface: '#FFFFFF', canvas: '#F4F6F4',
  line: '#DEE6E2', danger: '#D94A58', success: '#23856D',
  input: '#FFFFFF', header: '#FFFFFF', overlay: '#E5EAE7',
};
export const darkColors = {
  ink: '#F1F6F4', muted: '#A8B8B4', primary: '#67C7BA',
  primarySoft: '#173B39', surface: '#182522', canvas: '#0E1715',
  line: '#30423E', danger: '#FF7180', success: '#67C7BA',
  input: '#13201D', header: '#14211E', overlay: '#07100E',
};
export const colors = lightColors;
export const useAppColors = () => {
  const dark = useSettingsStore(state => state.darkMode);
  return dark ? darkColors : lightColors;
};
export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 10, md: 16, lg: 24 };
