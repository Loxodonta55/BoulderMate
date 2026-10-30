import type { CapacitorConfig } from '@capacitor/cli';

/**
 * SPEC-045: BoulderMate als App (iPhone und Android).
 * Die App enthält die gebaute Web-App aus `dist/` (startet ohne Netz).
 * Ablauf: `npm run app:sync` (= build + cap sync), danach Android Studio / Xcode oder Codemagic.
 */
const config: CapacitorConfig = {
  appId: 'ch.bouldermate.app',
  appName: 'BoulderMate',
  webDir: 'dist',
  // §4.4: Zoom mit zwei Fingern erlaubt (Android; iPhone über den Viewport)
  zoomEnabled: true,
  backgroundColor: '#F4F2EE',
  plugins: {
    SplashScreen: {
      // §4.1: Startbild bleibt, bis die Wand gezeichnet ist (main.tsx blendet es aus)
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: '#F4F2EE',
      showSpinner: false,
    },
    // §4.3: Supabase-Rücksprung kommt als App-Link, nicht über die Web-Ansicht
    CapacitorHttp: { enabled: false },
  },
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
