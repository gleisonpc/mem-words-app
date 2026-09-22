jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../api/cards', () => ({
  createCard: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createCard } from '../../api/cards';
import type { AppStackParamList } from '../../navigation/AppStack';
import { ThemeProvider } from '../../theme/ThemeProvider';
import AddCardScreen from '../AddCardScreen';

const createCardMock = createCard as jest.Mock;

type Props = NativeStackScreenProps<AppStackParamList, 'AddCard'>;

const navigation = { navigate: jest.fn() } as unknown as Props['navigation'];
const route = { key: 'add-card', name: 'AddCard' as const, params: { deckId: 'd1' } };

async function renderScreen() {
  return render(
    <ThemeProvider>
      <AddCardScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  createCardMock.mockReset();
  (navigation.navigate as jest.Mock).mockReset();
});

it('não envia quando palavra e tradução estão vazias', async () => {
  await renderScreen();

  await fireEvent.press(screen.getByText('Salvar'));

  expect(createCardMock).not.toHaveBeenCalled();
  expect(await screen.findByLabelText('Palavra. Informe a palavra.')).toBeTruthy();
  expect(screen.getByLabelText('Tradução. Informe a tradução.')).toBeTruthy();
});

it('cria o card e volta para DeckDetail com o card novo no parâmetro', async () => {
  const card = { id: 'c1', deckId: 'd1', word: 'casa', translation: 'house', synonyms: [], status: 'new', suspended: false, dueAt: null };
  createCardMock.mockResolvedValue(card);
  await renderScreen();

  await fireEvent.changeText(screen.getByLabelText('Palavra'), 'casa');
  await fireEvent.changeText(screen.getByLabelText('Tradução'), 'house');
  await fireEvent.press(screen.getByText('Salvar'));

  await waitFor(() => {
    expect(createCardMock).toHaveBeenCalledWith('d1', {
      word: 'casa',
      translation: 'house',
      partOfSpeech: undefined,
      synonyms: [],
      exampleSentence: undefined,
      exampleTranslation: undefined,
      personalNote: undefined,
    });
  });

  expect(navigation.navigate).toHaveBeenCalledWith({
    name: 'DeckDetail',
    params: { deckId: 'd1', newCard: card },
    merge: true,
  });
});
