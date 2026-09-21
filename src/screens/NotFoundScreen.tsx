import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

/**
 * Destino de qualquer link profundo sem rota correspondente (ver spec
 * `navigation/routing`, "Rota desconhecida") — nunca uma tela em branco ou
 * uma queda do app.
 */
export default function NotFoundScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>
          Destino não encontrado
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Home')}
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
