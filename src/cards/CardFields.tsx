import { View } from 'react-native';

import type { CreateCardInput } from '../api/cards';
import { TextField } from '../components/TextField';

/**
 * Campos, valores vazios e conversão para o corpo da requisição —
 * compartilhados entre a tela de criação de card (`AddCardScreen`) e a
 * edição de card dentro de `DeckDetailScreen`, que aplicam a mesma regra
 * (espelha o backend) sobre os mesmos campos. Mesmo papel de
 * `mem-words-frontend/src/pages/cardForm.jsx`.
 */
export interface CardFieldValues {
  word: string;
  translation: string;
  synonyms: string;
  partOfSpeech: string;
  exampleSentence: string;
  exampleTranslation: string;
  personalNote: string;
}

export const EMPTY_CARD_VALUES: CardFieldValues = {
  word: '',
  translation: '',
  synonyms: '',
  partOfSpeech: '',
  exampleSentence: '',
  exampleTranslation: '',
  personalNote: '',
};

/** Converte um campo opcional de texto: vazio vira "sem valor" (omitido no envio). */
function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function textToSynonyms(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

/** Sinônimos guardados como array viram texto separado por vírgula no campo. */
export function synonymsToText(synonyms: string[] | null | undefined): string {
  return (synonyms ?? []).join(', ');
}

export function cardInputFromValues(values: CardFieldValues): CreateCardInput {
  return {
    word: values.word.trim(),
    translation: values.translation.trim(),
    partOfSpeech: optionalText(values.partOfSpeech),
    synonyms: textToSynonyms(values.synonyms),
    exampleSentence: optionalText(values.exampleSentence),
    exampleTranslation: optionalText(values.exampleTranslation),
    personalNote: optionalText(values.personalNote),
  };
}

export interface CardFieldsProps {
  values: CardFieldValues;
  onChange: (field: keyof CardFieldValues, value: string) => void;
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}

/** Os sete campos de um card, sobre `TextField`. */
export function CardFields({ values, onChange, fieldErrors = {}, disabled = false }: CardFieldsProps) {
  return (
    <View style={{ gap: 12 }}>
      <TextField
        label="Palavra"
        value={values.word}
        onChangeText={(text) => onChange('word', text)}
        error={fieldErrors.word}
        editable={!disabled}
      />
      <TextField
        label="Tradução"
        value={values.translation}
        onChangeText={(text) => onChange('translation', text)}
        error={fieldErrors.translation}
        editable={!disabled}
      />
      <TextField
        label="Sinônimos (separados por vírgula)"
        value={values.synonyms}
        onChangeText={(text) => onChange('synonyms', text)}
        error={fieldErrors.synonyms}
        editable={!disabled}
      />
      <TextField
        label="Classe gramatical"
        value={values.partOfSpeech}
        onChangeText={(text) => onChange('partOfSpeech', text)}
        error={fieldErrors.partOfSpeech}
        editable={!disabled}
      />
      <TextField
        label="Frase de exemplo"
        value={values.exampleSentence}
        onChangeText={(text) => onChange('exampleSentence', text)}
        error={fieldErrors.exampleSentence}
        editable={!disabled}
      />
      <TextField
        label="Tradução da frase"
        value={values.exampleTranslation}
        onChangeText={(text) => onChange('exampleTranslation', text)}
        error={fieldErrors.exampleTranslation}
        editable={!disabled}
      />
      <TextField
        label="Anotação pessoal"
        value={values.personalNote}
        onChangeText={(text) => onChange('personalNote', text)}
        error={fieldErrors.personalNote}
        editable={!disabled}
      />
    </View>
  );
}
