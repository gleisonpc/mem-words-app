import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

/**
 * Campo de formulário com rótulo e erro associados por
 * `accessibilityLabel` — RN não tem o equivalente de `<label for>` do
 * HTML, então o rótulo (e o erro, quando presente) entram direto no
 * rótulo acessível do campo, alcançável por VoiceOver/TalkBack mesmo sem
 * relação visual (ver spec `auth/screens`, "Erro alcançável por leitor de
 * tela").
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const accessibilityLabel = error ? `${label}. ${error}` : label;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            fontSize: theme.fontSize.md,
          },
          style,
        ]}
        {...inputProps}
      />
      {error !== undefined && error !== null && (
        <Text style={[styles.error, { color: theme.colors.danger, fontSize: theme.fontSize.xs }]}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    marginTop: 2,
  },
});
