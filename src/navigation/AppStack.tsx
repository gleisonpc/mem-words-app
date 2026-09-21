import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import HomeScreen from '../screens/HomeScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

/**
 * Pilha de quem está autenticado (ver spec `navigation/routing`, delta
 * desta change). Ponto de encaixe para baralhos/revisão/perfil nas
 * changes seguintes — hoje só a tela inicial provisória.
 */
export type AppStackParamList = {
  Home: undefined;
  Diagnostics: undefined;
  NotFound: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ headerShown: true, title: 'Diagnóstico' }} />
      <Stack.Screen name="NotFound">{() => <NotFoundScreen homeRoute="Home" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
