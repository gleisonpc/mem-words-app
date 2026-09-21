import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../auth/session';
import type { AppStackParamList } from '../navigation/AppStack';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

/**
 * Provisória: existe só para a pilha autenticada ter uma tela inicial,
 * um caminho visível até o diagnóstico e a ação de sair. As changes
 * seguintes (baralhos, revisão, perfil) substituem o conteúdo.
 */
export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { state, logout } = useSession();
  const name = state.status === 'autenticado' ? state.user.name : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Olá, {name}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontSize: theme.fontSize.md }]}>
        Fundação do app — sem telas de produto ainda.
      </Text>

      <Pressable
        onPress={() => navigation.navigate('Diagnostics')}
        style={[styles.link, { borderColor: theme.colors.border, borderRadius: theme.radius.md }]}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary, fontSize: theme.fontSize.md }]}>
          Diagnóstico do backend
        </Text>
      </Pressable>

      <Pressable
        onPress={() => logout()}
        style={[styles.link, { borderColor: theme.colors.border, borderRadius: theme.radius.md }]}
      >
        <Text style={[styles.linkText, { color: theme.colors.danger, fontSize: theme.fontSize.md }]}>Sair</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 16,
  },
  link: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  linkText: {
    fontWeight: '600',
  },
});
