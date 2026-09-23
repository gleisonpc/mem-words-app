import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/ApiError';
import { createCard } from '../api/cards';
import { collect } from '../auth/validation';
import { CardFields, EMPTY_CARD_VALUES, cardInputFromValues, type CardFieldValues } from '../cards/CardFields';
import { validateTranslation, validateWord } from '../cards/validation';
import type { AppStackParamList } from '../navigation/AppStack';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<AppStackParamList, 'AddCard'>;

/** Tela de criação de card (ver spec `decks/screens`), sobre `CardFields`. */
export default function AddCardScreen({ navigation, route }: Props) {
  const { deckId } = route.params;
  const theme = useTheme();

  const [values, setValues] = useState<CardFieldValues>(EMPTY_CARD_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof CardFieldValues, text: string) {
    setValues((current) => ({ ...current, [field]: text }));
  }

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const errors = collect({ word: validateWord(values.word), translation: validateTranslation(values.translation) });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const card = await createCard(deckId, cardInputFromValues(values));
      // Volta para `DeckDetail` levando o card novo no parâmetro (merge),
      // em vez de um callback não serializável — ver AppStack.tsx.
      navigation.navigate({ name: 'DeckDetail', params: { deckId, newCard: card }, merge: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
      } else {
        setFormError('Não foi possível concluir a operação.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Adicionar card</Text>

        {formError !== null && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.formError, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}
          >
            {formError}
          </Text>
        )}

        <CardFields values={values} onChange={handleChange} fieldErrors={fieldErrors} disabled={submitting} />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, opacity: submitting ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            {submitting ? 'Salvando…' : 'Salvar'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontWeight: '700',
  },
  formError: {
    fontWeight: '500',
  },
  button: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: '600',
  },
});
