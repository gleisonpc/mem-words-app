jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../auth/session', () => ({
  ...jest.requireActual('../../auth/session'),
  useSession: jest.fn(),
}));

jest.mock('../../api/decks', () => ({
  listDecks: jest.fn(),
  createDeck: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createDeck, listDecks } from '../../api/decks';
import { useSession } from '../../auth/session';
import type { AppStackParamList } from '../../navigation/AppStack';
import { ThemeProvider } from '../../theme/ThemeProvider';
import HomeScreen from '../HomeScreen';

const useSessionMock = useSession as jest.Mock;
const listDecksMock = listDecks as jest.Mock;
const createDeckMock = createDeck as jest.Mock;

const navigation = { navigate: jest.fn() } as unknown as NativeStackScreenProps<AppStackParamList, 'Home'>['navigation'];
const route = { key: 'home', name: 'Home' as const, params: undefined };

async function renderScreen() {
  return render(
    <ThemeProvider>
      <HomeScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useSessionMock.mockReturnValue({ logout: jest.fn() });
  listDecksMock.mockReset();
  createDeckMock.mockReset();
  (navigation.navigate as jest.Mock).mockReset();
});

const deck = {
  id: 'd1',
  name: 'Inglês',
  sourceLanguage: 'pt',
  targetLanguage: 'en',
  cardCount: 3,
  dueCount: 0,
  newCount: 0,
  learningCount: 0,
  matureCount: 0,
  suspendedCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('estados de carregamento', () => {
  it('mostra indicador de carregamento e depois a lista', async () => {
    listDecksMock.mockResolvedValue([deck]);
    await renderScreen();

    expect(await screen.findByText('Inglês')).toBeTruthy();
  });

  it('mostra erro quando listDecks falha', async () => {
    listDecksMock.mockRejectedValue(new Error('falhou'));
    await renderScreen();

    expect(await screen.findByText('Não foi possível carregar os baralhos.')).toBeTruthy();
  });

  it('mostra estado de lista vazia', async () => {
    listDecksMock.mockResolvedValue([]);
    await renderScreen();

    expect(await screen.findByText('Você ainda não tem nenhum baralho.')).toBeTruthy();
  });
});

describe('selo de prontidão', () => {
  it('mostra "N hoje" quando há cards prontos', async () => {
    listDecksMock.mockResolvedValue([{ ...deck, dueCount: 5 }]);
    await renderScreen();

    expect(await screen.findByText('5 hoje')).toBeTruthy();
  });

  it('mostra "Em dia" quando não há cards prontos', async () => {
    listDecksMock.mockResolvedValue([{ ...deck, dueCount: 0 }]);
    await renderScreen();

    expect(await screen.findByText('Em dia')).toBeTruthy();
  });

  it('mostra nome, idiomas e total de cards', async () => {
    listDecksMock.mockResolvedValue([deck]);
    await renderScreen();

    expect(await screen.findByText('Inglês')).toBeTruthy();
    expect(screen.getByText('3 cards · pt → en')).toBeTruthy();
  });
});

describe('formulário de criar baralho', () => {
  it('não envia requisição quando os campos estão vazios', async () => {
    listDecksMock.mockResolvedValue([]);
    await renderScreen();
    await screen.findByText('Você ainda não tem nenhum baralho.');

    await fireEvent.press(screen.getByText('Criar baralho'));
    await fireEvent.press(screen.getByText('Criar baralho'));

    expect(createDeckMock).not.toHaveBeenCalled();
  });

  it('insere o baralho criado na lista sem recarregar', async () => {
    listDecksMock.mockResolvedValue([]);
    createDeckMock.mockResolvedValue({ id: 'd2', name: 'Espanhol', sourceLanguage: 'pt', targetLanguage: 'es' });
    await renderScreen();
    await screen.findByText('Você ainda não tem nenhum baralho.');

    await fireEvent.press(screen.getByText('Criar baralho'));
    await fireEvent.changeText(screen.getByLabelText('Nome do baralho'), 'Espanhol');
    await fireEvent.changeText(screen.getByLabelText('Idioma de origem'), 'pt');
    await fireEvent.changeText(screen.getByLabelText('Idioma de destino'), 'es');
    await fireEvent.press(screen.getByText('Criar baralho'));

    expect(await screen.findByText('Espanhol')).toBeTruthy();
    expect(listDecksMock).toHaveBeenCalledTimes(1);
  });
});

describe('navegação', () => {
  it('navega para DeckDetail ao tocar em um baralho', async () => {
    listDecksMock.mockResolvedValue([deck]);
    await renderScreen();

    await fireEvent.press(await screen.findByText('Inglês'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('DeckDetail', { deckId: 'd1' });
    });
  });
});
