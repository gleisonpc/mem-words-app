import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  /** Nome da tela inicial da pilha atual (`Login` na pública, `Home` na autenticada). */
  homeRoute: string;
}

/**
 * Destino de qualquer link profundo sem rota correspondente (ver spec
 * `navigation/routing`, "Rota desconhecida") — nunca uma tela em branco
 * ou uma queda do app. Compartilhada pelas duas pilhas (pública e
 * autenticada), cada uma te navega de volta à sua própria tela inicial.
 */
export default function NotFoundScreen({ homeRoute }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>
          Destino não encontrado
        </Text>
        <Pressable
          onPress={() => navigation.navigate(homeRoute)}
          style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            Voltar ao início
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontWeight: '600',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: '600',
  },
});
