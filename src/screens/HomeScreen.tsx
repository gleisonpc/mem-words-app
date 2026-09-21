import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Provisória: existe só para o navegador raiz ter uma tela inicial e um
 * caminho visível até o diagnóstico, sem depender do backend (ver spec
 * `navigation/routing`, "Tela inicial alcançável sem sessão"). As changes
 * seguintes (auth, decks) substituem o conteúdo.
 */
export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Mem Words</Text>
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
