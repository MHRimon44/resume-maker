import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppColors } from '../theme';

const valid = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);
const hsvToHex = (h: number, s: number, v: number) => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255)
      .toString(16).padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`.toUpperCase();
};
const hexToHsv = (hex: string): [number, number, number] => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, max === 0 ? 0 : d / max, max];
};

function Channel({ label, value, color, onChange }: {
  label: string; value: number; color: string; onChange: (value: number) => void;
}) {
  const c = useAppColors();
  const [width, setWidth] = useState(1);
  return <View style={styles.channel}>
    <Text style={{ color: c.ink, marginBottom: 8 }}>{label} · {Math.round(value * 100)}%</Text>
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={e => onChange(Math.max(0, Math.min(1, e.nativeEvent.locationX / width)))}
      onResponderMove={e => onChange(Math.max(0, Math.min(1, e.nativeEvent.locationX / width)))}
      style={[styles.track, { backgroundColor: c.line }]}>
      <View style={[styles.fill, { width: `${value * 100}%`, backgroundColor: color }]} />
      <View style={[styles.thumb, { left: `${value * 100}%`, borderColor: c.ink }]} />
    </View>
  </View>;
}

export function ColorPicker({ value, onChange, compact = false }: { value: string; onChange: (hex: string) => void; compact?: boolean }) {
  const c = useAppColors();
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value);
  const [h, setH] = useState(210), [sat, setSat] = useState(1), [bright, setBright] = useState(1);
  useEffect(() => {
    setHex(value);
    if (valid(value)) {
      const [nextH, nextS, nextV] = hexToHsv(value);
      setH(nextH); setSat(nextS); setBright(nextV);
    }
  }, [value, open]);
  const update = (nextH: number, nextS: number, nextV: number) => {
    setH(nextH); setSat(nextS); setBright(nextV);
    setHex(hsvToHex(nextH, nextS, nextV));
  };
  const palette = Array.from({ length: 24 }, (_, i) => hsvToHex(i * 15, 1, 1));
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Choose color ${value}`}
      onPress={() => setOpen(true)} style={[styles.trigger, compact && styles.compactTrigger,
        { borderColor: c.line, backgroundColor: c.surface }]}> 
      <View style={[styles.sample, { backgroundColor: valid(value) ? value : '#173B57' }]} />
      {!compact && <Text style={{ color: c.ink, fontWeight: '700' }}>{value.toUpperCase()}  ·  Choose any color</Text>}
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={[styles.scrim, { backgroundColor: c.overlay + 'EE' }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.sheet, { backgroundColor: c.surface }]}>
          <Text style={[styles.title, { color: c.ink }]}>Choose accent color</Text>
          <View style={[styles.preview, { backgroundColor: valid(hex) ? hex : value }]} />
          <Text style={[styles.label, { color: c.ink }]}>Hue</Text>
          <View style={styles.palette}>{palette.map((color, index) =>
            <Pressable key={color} accessibilityLabel={`Hue ${index * 15} degrees`} onPress={() => update(index * 15, sat, bright)}
              style={[styles.paletteItem, { backgroundColor: color }]} />)}</View>
          <Channel label="Fine hue" value={h / 360} color={hsvToHex(h, 1, 1)}
            onChange={x => update(x * 360, sat, bright)} />
          <Channel label="Saturation" value={sat} color={hsvToHex(h, 1, bright)} onChange={x => update(h, x, bright)} />
          <Channel label="Brightness" value={bright} color={hsvToHex(h, sat, 1)} onChange={x => update(h, sat, x)} />
          <Text style={[styles.label, { color: c.ink }]}>Hex color (any #RRGGBB)</Text>
          <TextInput autoCapitalize="characters" maxLength={7} value={hex} onChangeText={text => {
            setHex(text);
            if (valid(text)) { const [nh, ns, nv] = hexToHsv(text); setH(nh); setSat(ns); setBright(nv); }
          }} style={[styles.input, { backgroundColor: c.input, borderColor: c.line, color: c.ink }]} placeholder="#173B57" placeholderTextColor={c.muted} />
          {!valid(hex) && <Text style={{ color: c.danger }}>Enter a six-digit hex color, such as #173B57.</Text>}
          <View style={styles.actions}>
            <Pressable onPress={() => setOpen(false)} style={[styles.button, { backgroundColor: c.primarySoft }]}><Text style={{ color: c.ink }}>Cancel</Text></Pressable>
            <Pressable disabled={!valid(hex)} onPress={() => { onChange(hex.toUpperCase()); setOpen(false); }} style={[styles.button, { backgroundColor: valid(hex) ? c.primary : c.line }]}><Text style={{ color: '#FFFFFF' }}>Use color</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  trigger: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactTrigger: { padding: 4, borderRadius: 9 },
  sample: { width: 30, height: 30, borderRadius: 8 },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 22, paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 19, fontWeight: '800', marginBottom: 12 },
  preview: { height: 45, borderRadius: 9, marginBottom: 15 },
  label: { fontWeight: '700', marginBottom: 9 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  paletteItem: { width: '8.33%', height: 32 },
  channel: { marginBottom: 22 }, track: { height: 17, borderRadius: 12, justifyContent: 'center' },
  fill: { height: 17, borderRadius: 12 }, thumb: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, backgroundColor: '#FFFFFF', position: 'absolute' },
  input: { height: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: { flex: 1, padding: 14, borderRadius: 11, alignItems: 'center' },
});
