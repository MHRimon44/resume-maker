import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { radius, useAppColors } from '../theme';

export const AppIcon = ({
  name,
  size = 21,
  color,
}: {
  name: string;
  size?: number;
  color: string;
}) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export const Button = ({
  label,
  onPress,
  kind = 'primary',
  disabled = false,
  icon,
}: {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: string;
}) => {
  const c = useAppColors();
  const backgroundColor =
    kind === 'danger' ? c.danger : kind === 'ghost' ? c.primarySoft : c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor },
        (pressed || disabled) && s.pressed,
      ]}
    >
      <View style={s.buttonContent}>
        {!!icon && (
          <AppIcon
            name={icon}
            size={19}
            color={kind === 'ghost' ? c.ink : '#FFFFFF'}
          />
        )}
        <Text
          style={[
            s.buttonText,
            { color: kind === 'ghost' ? c.ink : '#FFFFFF' },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export const IconButton = ({
  icon,
  accessibilityLabel,
  onPress,
  kind = 'neutral',
}: {
  icon: string;
  accessibilityLabel: string;
  onPress: (event: GestureResponderEvent) => void;
  kind?: 'neutral' | 'primary' | 'danger';
}) => {
  const c = useAppColors();
  const color = kind === 'danger' ? c.danger : c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        {
          backgroundColor: kind === 'neutral' ? c.surface : c.primarySoft,
          borderColor: c.line,
        },
        pressed && s.pressed,
      ]}
    >
      <AppIcon name={icon} size={21} color={color} />
    </Pressable>
  );
};

export const Field = ({
  label,
  error,
  ...p
}: TextInputProps & { label: string; error?: string }) => {
  const c = useAppColors();
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: c.ink }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        {...p}
        style={[
          s.input,
          {
            color: c.ink,
            backgroundColor: c.input,
            borderColor: error ? c.danger : c.line,
          },
          p.multiline && s.multiline,
          p.style,
        ]}
      />
      {!!error && <Text style={[s.error, { color: c.danger }]}>{error}</Text>}
    </View>
  );
};

export const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => {
  const c = useAppColors();
  return (
    <View
      style={[
        s.card,
        { backgroundColor: c.surface, borderColor: c.line },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const Empty = ({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) => {
  const c = useAppColors();
  return (
    <View style={s.empty}>
      <AppIcon name="file-document-edit-outline" size={42} color={c.primary} />
      <Text style={[s.h2, { color: c.ink }]}>{title}</Text>
      <Text style={[s.body, { color: c.muted }]}>{body}</Text>
      <Button icon="arrow-right" label={action} onPress={onPress} />
    </View>
  );
};

export const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: selected ? c.primarySoft : c.surface,
          borderColor: selected ? c.primary : c.line,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[s.chipText, { color: selected ? c.primary : c.muted }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  right,
  backgroundColor,
  brandImage,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  backgroundColor?: string;
  brandImage?: ImageSourcePropType;
}) => {
  const c = useAppColors();
  return (
    <View
      style={[
        s.header,
        {
          backgroundColor: backgroundColor || c.canvas,
          borderBottomColor: c.line,
        },
      ]}
    >
      <View style={s.headerRow}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={12}
            style={[s.backButton, { backgroundColor: c.primarySoft }]}
          >
            <AppIcon name="chevron-left" size={30} color={c.primary} />
          </Pressable>
        ) : (
          <View style={s.brandMark}>
            {brandImage ? (
              <Image
                source={brandImage}
                style={s.brandImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={s.brandLetter}>R</Text>
            )}
          </View>
        )}
        <View style={s.headerCopy}>
          <Text numberOfLines={1} style={[s.headerTitle, { color: c.ink }]}>
            {title}
          </Text>
          {!!subtitle && (
            <Text
              numberOfLines={1}
              style={[s.headerSubtitle, { color: c.muted }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {!!right && <View style={s.headerRight}>{right}</View>}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  button: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.7 },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: { fontSize: 18, lineHeight: 21, fontWeight: '800' },
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  error: { fontSize: 12 },
  card: {
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  empty: { padding: 28, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 34 },
  h2: { fontSize: 19, fontWeight: '800' },
  body: { textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  chip: {
    minHeight: 36,
    maxWidth: 210,
    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontWeight: '700', fontSize: 13 },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 27, lineHeight: 29, marginTop: -3 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#176B67',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandImage: { width: '100%', height: '100%' },
  brandLetter: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  headerRight: { flexShrink: 0 },
});
