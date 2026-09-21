import type { ExpoConfig } from 'expo/config';

/**
 * URL base do backend por variante de ambiente.
 *
 * `APP_VARIANT` é definida antes de chamar `expo start`/`eas build`
 * (`development` por padrão). `EXPO_PUBLIC_API_URL` sobrepõe quando
 * definida — mesmo papel de `VITE_API_URL` no `mem-words-frontend`, sem o
 * cuidado de origem única do navegador: o app não é uma página web, então
 * a URL pode apontar para qualquer host.
 */
const DEVELOPMENT_API_URL = 'http://localhost:3000';
const PRODUCTION_API_URL = 'https://mem-words-backend.onrender.com';

const variant = process.env.APP_VARIANT ?? 'development';
const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
const apiUrl = configuredApiUrl || (variant === 'production' ? PRODUCTION_API_URL : DEVELOPMENT_API_URL);

const config: ExpoConfig = {
  name: variant === 'production' ? 'Mem Words' : `Mem Words (${variant})`,
  slug: 'mem-words-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'memwords',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: variant === 'production' ? 'com.gleisonpc.memwords' : `com.gleisonpc.memwords.${variant}`,
  },
  android: {
    package: variant === 'production' ? 'com.gleisonpc.memwords' : `com.gleisonpc.memwords.${variant}`,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiUrl,
    apiUrlSource: configuredApiUrl ? 'EXPO_PUBLIC_API_URL' : `padrão de ${variant}`,
    eas: {
      // Preenchido por `eas build:configure` quando o projeto EAS existir.
      projectId: undefined,
    },
  },
};

export default config;
