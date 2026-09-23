jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { fireEvent, render, screen } from '@testing-library/react-native';

import { CardFields, EMPTY_CARD_VALUES, cardInputFromValues, synonymsToText } from '../CardFields';
import { ThemeProvider } from '../../theme/ThemeProvider';

const FIELD_LABELS: Record<string, string> = {
  word: 'Palavra',
  translation: 'Tradução',
  synonyms: 'Sinônimos (separados por vírgula)',
  partOfSpeech: 'Classe gramatical',
  exampleSentence: 'Frase de exemplo',
  exampleTranslation: 'Tradução da frase',
  personalNote: 'Anotação pessoal',
};

it('exibe os valores atuais e propaga o onChange de cada campo', async () => {
  const onChange = jest.fn();

  await render(
    <ThemeProvider>
      <CardFields values={{ ...EMPTY_CARD_VALUES, word: 'casa', translation: 'house' }} onChange={onChange} />
    </ThemeProvider>,
  );

  expect(screen.getByDisplayValue('casa')).toBeTruthy();
  expect(screen.getByDisplayValue('house')).toBeTruthy();

  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    fireEvent.changeText(screen.getByLabelText(label), `valor de ${field}`);
    expect(onChange).toHaveBeenCalledWith(field, `valor de ${field}`);
  }
});

describe('cardInputFromValues', () => {
  it('recorta palavra e tradução e omite os campos opcionais vazios', () => {
    const input = cardInputFromValues({
      ...EMPTY_CARD_VALUES,
      word: '  casa  ',
      translation: '  house  ',
    });

    expect(input).toEqual({
      word: 'casa',
      translation: 'house',
      partOfSpeech: undefined,
      synonyms: [],
      exampleSentence: undefined,
      exampleTranslation: undefined,
      personalNote: undefined,
    });
    expect(JSON.stringify(input)).not.toContain('partOfSpeech');
  });

  it('converte sinônimos separados por vírgula em array, descartando vazios', () => {
    const input = cardInputFromValues({
      ...EMPTY_CARD_VALUES,
      word: 'casa',
      translation: 'house',
      synonyms: 'lar, , moradia ,casa',
    });

    expect(input.synonyms).toEqual(['lar', 'moradia', 'casa']);
  });

  it('preenche os opcionais quando presentes', () => {
    const input = cardInputFromValues({
      word: 'casa',
      translation: 'house',
      synonyms: '',
      partOfSpeech: 'substantivo',
      exampleSentence: 'Esta é minha casa.',
      exampleTranslation: 'This is my house.',
      personalNote: 'nota',
    });

    expect(input.partOfSpeech).toBe('substantivo');
    expect(input.exampleSentence).toBe('Esta é minha casa.');
    expect(input.exampleTranslation).toBe('This is my house.');
    expect(input.personalNote).toBe('nota');
  });
});

describe('synonymsToText', () => {
  it('junta o array com vírgula e espaço', () => {
    expect(synonymsToText(['lar', 'moradia'])).toBe('lar, moradia');
  });

  it('devolve texto vazio para nulo/indefinido/array vazio', () => {
    expect(synonymsToText(null)).toBe('');
    expect(synonymsToText(undefined)).toBe('');
    expect(synonymsToText([])).toBe('');
  });
});
