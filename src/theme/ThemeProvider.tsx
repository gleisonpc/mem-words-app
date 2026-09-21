import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
  transition,
  type ColorScheme,
  type ColorTokens,
  type ThemePreference,
} from './tokens';

/**
 * Chave não sensível: guarda só a preferência de tema ("light" | "dark" |
 * "system"), nunca dado de sessão. O token de sessão (change `auth/session`)
 * vai para `expo-secure-store`, não para cá.
 */
const PREFERENCE_STORAGE_KEY = '@mem-words/theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  radius: typeof radius;
  /** Zerado quando o dispositivo pede movimento reduzido. */
  transition: { fast: number; slow: number };
  reduceMotion: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(scheme: ColorScheme, reduceMotion: boolean): Theme {
  return {
    scheme,
    colors: colors[scheme],
    spacing,
    fontSize,
    fontWeight,
    lineHeight,
    radius,
    transition: reduceMotion ? { fast: 0, slow: 0 } : transition,
    reduceMotion,
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Carrega a preferência salva uma vez, na montagem — tolerante a falha:
  // se o armazenamento estiver indisponível, o app segue com "system".
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(PREFERENCE_STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Armazenamento indisponível: segue com o padrão "system".
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        // Sem informação do SO: assume que o movimento não foi reduzido.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);

    AsyncStorage.setItem(PREFERENCE_STORAGE_KEY, next).catch(() => {
      // Falha ao persistir: a escolha continua valendo nesta sessão do
      // app, só não sobrevive a reabrir — comportamento tolerado (ver
      // spec design-system/tokens, "armazenamento indisponível").
    });
  }, []);

  const resolvedScheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo(() => buildTheme(resolvedScheme, reduceMotion), [resolvedScheme, reduceMotion]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  }

  return context.theme;
}

/** Para a tela de perfil (change futura) escolher entre claro/escuro/sistema. */
export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useThemePreference deve ser usado dentro de <ThemeProvider>.');
  }

  return [context.preference, context.setPreference];
}
