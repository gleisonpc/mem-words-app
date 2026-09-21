/**
 * Tokens de design do mem-words-app.
 *
 * Portado de `mem-words-frontend/src/styles/tokens.css`, com os mesmos
 * nomes semânticos e os mesmos valores de cor — só a forma muda (objeto
 * TypeScript de tema, não custom properties CSS), porque React Native não
 * tem folha de estilo em cascata. Nenhum componente deve referenciar um
 * valor de cor literal: sempre um destes tokens.
 *
 * Contraste (WCAG 2.1 AA — 4.5:1 texto, 3:1 não textual) já foi verificado
 * para estes valores no design system web (ver o cabeçalho de
 * `tokens.css` e `openspec/specs/design-system/tokens/spec.md` do
 * `mem-words-frontend`); são os mesmos pares texto/superfície e
 * texto-de-estado/fundo-de-estado, então o resultado se mantém aqui.
 */

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export interface ColorTokens {
  bg: string;
  surface: string;
  surfaceMuted: string;

  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;

  primary: string;
  primaryHover: string;
  onPrimary: string;

  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;
}

const light: ColorTokens = {
  bg: '#f7f8fa',
  surface: '#ffffff',
  surfaceMuted: '#f1f3f6',

  border: '#dfe3e8',
  borderStrong: '#7b8590',

  text: '#16191d',
  textMuted: '#5b6672',

  primary: '#4f46e5',
  primaryHover: '#4338ca',
  onPrimary: '#ffffff',

  success: '#0f7a3d',
  successBg: '#e6f6ec',
  warning: '#8a6100',
  warningBg: '#fdf3d7',
  danger: '#b3241c',
  dangerBg: '#fdecea',
  info: '#0b5fa5',
  infoBg: '#e6f1fb',
};

const dark: ColorTokens = {
  bg: '#101316',
  surface: '#1a1e22',
  surfaceMuted: '#23282d',

  border: '#2f353b',
  borderStrong: '#7b8590',

  text: '#eceef1',
  textMuted: '#a0aab5',

  primary: '#a5b4fc',
  primaryHover: '#c7d2fe',
  onPrimary: '#101316',

  success: '#5fd08a',
  successBg: '#10301e',
  warning: '#e3c169',
  warningBg: '#2e2611',
  danger: '#ff9d95',
  dangerBg: '#3a1a18',
  info: '#8fc4f5',
  infoBg: '#11263a',
};

/** As duas palethas SHALL ter exatamente as mesmas chaves — ver spec. */
export const colors: Record<ColorScheme, ColorTokens> = { light, dark };

/** Escala de espaçamento, base 4px — mesmos degraus do design system web. */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

/** Em milissegundos; zerado quando o dispositivo pede movimento reduzido. */
export const transition = {
  fast: 120,
  slow: 240,
} as const;
