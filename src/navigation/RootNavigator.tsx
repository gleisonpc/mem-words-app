import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../auth/session';
import { useTheme } from '../theme/ThemeProvider';
import AppStack, { type AppStackParamList } from './AppStack';
import PublicStack, { type PublicStackParamList } from './PublicStack';

/**
 * O navegador raiz escolhe entre três coisas, de acordo com o estado da
 * sessão (ver spec `navigation/routing`, "Duas pilhas de navegação,
 * escolhidas pela sessão"): nada ainda (carregando), a pilha pública ou a
 * autenticada. Nenhuma tela decide isso sozinha — só aqui.
 */
type RootLinkingParamList = PublicStackParamList & AppStackParamList;

/** Exportado para o teste de unidade do schema (`__tests__/linking.test.ts`). */
export const linking: LinkingOptions<RootLinkingParamList> = {
  prefixes: ['memwords://'],
  config: {
    screens: {
      Login: 'entrar',
      Register: 'cadastro',
      Home: '',
      DeckDetail: 'baralhos/:deckId',
      AddCard: 'baralhos/:deckId/cards/novo',
      Diagnostics: 'diagnostico',
      NotFound: '*',
    },
  },
};

function LoadingScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.loading, { backgroundColor: theme.colors.bg }]}>
      <ActivityIndicator color={theme.colors.primary} />
    </SafeAreaView>
  );
}

export default function RootNavigator() {
  const { state } = useSession();

  return (
    <NavigationContainer linking={linking}>
      {state.status === 'determinando' && <LoadingScreen />}
      {state.status === 'sem-sessão' && <PublicStack />}
      {state.status === 'autenticado' && <AppStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
