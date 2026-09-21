import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/ApiError';
import { useSession } from '../auth/session';
import { collect, validateCurrentPassword, validateEmail } from '../auth/validation';
import { TextField } from '../components/TextField';
import type { PublicStackParamList } from '../navigation/PublicStack';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<PublicStackParamList, 'Login'>;

/**
 * Tela de entrada (ver spec `auth/screens`) — e-mail e senha, validação
 * local espelhando o backend, erro por campo, e caminho para o cadastro.
 */
export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { login } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const errors = collect({ email: validateEmail(email), password: validateCurrentPassword(password) });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.fieldErrors.email || error.fieldErrors.password ? null : error.message);
      } else {
        setFormError('Não foi possível concluir a operação.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Entrar</Text>

      {formError !== null && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.formError, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}
        >
          {formError}
        </Text>
      )}

      <View style={styles.form}>
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <TextField
          ref={passwordRef}
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, opacity: submitting ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.link}>
        <Text style={[styles.linkText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>
          Ainda não tem conta? Criar conta
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  formError: {
    fontWeight: '500',
  },
  button: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  buttonText: {
    fontWeight: '600',
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    fontWeight: '500',
  },
});
