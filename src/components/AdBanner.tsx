import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import mobileAds, {
  AdsConsent,
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAppColors } from '../theme';

const PRODUCTION_BANNER_ID = 'ca-app-pub-3194644435083545/3737209183';
const AdsReadyContext = createContext(false);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let active = true;
    const prepareAds = async () => {
      try {
        await AdsConsent.gatherConsent();
      } catch {
        // The SDK can use the consent decision saved during a previous session.
      }

      try {
        await mobileAds().initialize();
        if (active) setReady(true);
      } catch (error) {
        if (__DEV__)
          console.warn('Google Mobile Ads initialization failed', error);
      }
    };

    prepareAds();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdsReadyContext.Provider value={ready}>
      {children}
    </AdsReadyContext.Provider>
  );
}

export function AdBanner() {
  const ready = useContext(AdsReadyContext);
  const c = useAppColors();

  if (!ready || Platform.OS !== 'android') return null;

  return (
    <View
      accessibilityLabel="Advertisement"
      style={[
        s.container,
        { backgroundColor: c.canvas, borderTopColor: c.line },
      ]}
    >
      <BannerAd
        unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : PRODUCTION_BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          if (__DEV__) console.log('Google test banner loaded');
        }}
        onAdFailedToLoad={error => {
          if (__DEV__) console.warn('Google test banner failed to load', error);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
});
