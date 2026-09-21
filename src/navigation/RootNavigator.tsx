import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import HomeScreen from '../screens/HomeScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

/**
 * Mapa de telas do app.
 *
 * Nesta change não há sessão implementada ainda, então o navegador é uma
 * única pilha, sem distinção entre área pública e autenticada — a change de
 * `auth/session` reestrutura isto via delta quando a guarda existir (ver
 * design.md, "Navegação").
 */
export type RootStackParamList = {
  Home: undefined;
  Diagnostics: undefined;
  NotFound: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * `*` captura qualquer link profundo que não corresponda a nenhuma rota
 * mapeada acima e o direciona para `NotFound` — é o mecanismo padrão do
 * React Navigation para link profundo sem destino (ver spec
 * `navigation/routing`, "Rota desconhecida").
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['memwords://'],
  config: {
    screens: {
      Home: '',
      Diagnostics: 'diagnostics',
      NotFound: '*',
    },
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ headerShown: true, title: 'Diagnóstico' }} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
