import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/ApiError';
import { AccountCreatedError, useSession } from '../auth/session';
import { collect, validateEmail, validateName, validateNewPassword } from '../auth/validation';
import { TextField } from '../components/TextField';
import type { PublicStackParamList } from '../navigation/PublicStack';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<PublicStackParamList, 'Register'>;

/**
 * Tela de cadastro (ver spec `auth/screens`) — nome, e-mail e senha,
 * validação local espelhando o backend, e caminho para a entrada.
 */
export default function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const { register } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [accountCreatedNotice, setAccountCreatedNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const errors = collect({
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setAccountCreatedNotice(null);
    setSubmitting(true);

    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (error) {
      if (error instanceof AccountCreatedError) {
        // A conta foi criada — a entrada encadeada é quem falhou. Nunca
        // sugerir repetir o cadastro (ver spec `auth/session`).
        setAccountCreatedNotice(error.message);
      } else if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length === 0 ? error.message : null);
      } else {
        setFormError('Não foi possível concluir a operação.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Criar conta</Text>

      {accountCreatedNotice !== null && (
        <View style={[styles.notice, { backgroundColor: theme.colors.successBg }]}>
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success, fontSize: theme.fontSize.sm }}>
            {accountCreatedNotice}
          </Text>
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={[styles.linkText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>
              Ir para a entrada
            </Text>
          </Pressable>
        </View>
      )}

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
          label="Nome"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <TextField
          ref={emailRef}
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
          autoComplete="password-new"
          textContentType="newPassword"
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
            {submitting ? 'Criando…' : 'Criar conta'}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
        <Text style={[styles.linkText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>
          Já tem conta? Entrar
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
  notice: {
    borderRadius: 8,
    padding: 12,
    gap: 8,
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
