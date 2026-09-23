import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { Card } from '../api/cards';
import AddCardScreen from '../screens/AddCardScreen';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import HomeScreen from '../screens/HomeScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

/**
 * Pilha de quem está autenticado (ver spec `navigation/routing`, delta
 * `add-decks-and-cards-screens`). `Home` lista os baralhos; `DeckDetail` e
 * `AddCard` encaixam a partir dela.
 *
 * `newCard` em `DeckDetail` é o canal de volta do `AddCardScreen`: ele
 * navega de volta com `merge: true` (padrão oficial de "passar dados para
 * a tela anterior" do React Navigation) em vez de expor um callback nos
 * parâmetros, que não é serializável.
 */
export type AppStackParamList = {
  Home: undefined;
  DeckDetail: { deckId: string; newCard?: Card };
  AddCard: { deckId: string };
  Diagnostics: undefined;
  NotFound: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ headerShown: true, title: 'Diagnóstico' }} />
      <Stack.Screen name="NotFound">{() => <NotFoundScreen homeRoute="Home" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
