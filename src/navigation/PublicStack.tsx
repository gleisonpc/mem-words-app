import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import LoginScreen from '../screens/LoginScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import RegisterScreen from '../screens/RegisterScreen';

/** Pilha de quem não está autenticado (ver spec `navigation/routing`, delta desta change). */
export type PublicStackParamList = {
  Login: undefined;
  Register: undefined;
  Diagnostics: undefined;
  NotFound: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export default function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ headerShown: true, title: 'Diagnóstico' }} />
      <Stack.Screen name="NotFound">{() => <NotFoundScreen homeRoute="Login" />}</Stack.Screen>
    </Stack.Navigator>
  );
}
