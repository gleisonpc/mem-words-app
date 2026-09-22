jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../api/decks', () => ({
  getDeck: jest.fn(),
  updateDeck: jest.fn(),
  deleteDeck: jest.fn(),
}));

jest.mock('../../api/cards', () => ({
  listCards: jest.fn(),
  createCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  suspendCard: jest.fn(),
  unsuspendCard: jest.fn(),
}));

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiError } from '../../api/ApiError';
import type { Card } from '../../api/cards';
import { deleteCard, listCards, suspendCard, unsuspendCard, updateCard } from '../../api/cards';
import { deleteDeck, getDeck, updateDeck } from '../../api/decks';
import type { AppStackParamList } from '../../navigation/AppStack';
import { ThemeProvider } from '../../theme/ThemeProvider';
import DeckDetailScreen from '../DeckDetailScreen';

const getDeckMock = getDeck as jest.Mock;
const updateDeckMock = updateDeck as jest.Mock;
const deleteDeckMock = deleteDeck as jest.Mock;
const listCardsMock = listCards as jest.Mock;
const updateCardMock = updateCard as jest.Mock;
const deleteCardMock = deleteCard as jest.Mock;
const suspendCardMock = suspendCard as jest.Mock;
const unsuspendCardMock = unsuspendCard as jest.Mock;

type Props = NativeStackScreenProps<AppStackParamList, 'DeckDetail'>;

const navigation = { navigate: jest.fn(), setParams: jest.fn() } as unknown as Props['navigation'];

function makeRoute(params: Props['route']['params']): Props['route'] {
  return { key: 'deck-detail', name: 'DeckDetail', params };
}

async function renderScreen(deckId = 'd1') {
  return render(
    <ThemeProvider>
      <DeckDetailScreen navigation={navigation} route={makeRoute({ deckId })} />
    </ThemeProvider>,
  );
}

const deck = {
  id: 'd1',
  name: 'Inglês',
  sourceLanguage: 'pt',
  targetLanguage: 'en',
  cardCount: 2,
  dueCount: 1,
  newCount: 1,
  learningCount: 0,
  matureCount: 1,
  suspendedCount: 0,
  createdAt: '2026-01-15T00:00:00.000Z',
};

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deckId: 'd1',
    word: 'casa',
    translation: 'house',
    partOfSpeech: null,
    synonyms: [],
    exampleSentence: null,
    exampleTranslation: null,
    personalNote: null,
    status: 'new',
    suspended: false,
    dueAt: null,
    ...overrides,
  };
}

function emptyPage(page = 1) {
  return { items: [], total: 0, page, pageSize: 10 };
}

beforeEach(() => {
  jest.clearAllMocks();
  getDeckMock.mockResolvedValue(deck);
  listCardsMock.mockResolvedValue(emptyPage());
});

describe('carregamento e indisponibilidade', () => {
  it('mostra a mesma mensagem para 403 e 404, com caminho de volta', async () => {
    getDeckMock.mockRejectedValue(new ApiError('Não encontrado', { status: 404 }));
    await renderScreen();

    expect(await screen.findByText('Este baralho não está disponível.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Voltar aos baralhos'));
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });

  it('trata 403 como o mesmo caso de indisponibilidade', async () => {
    getDeckMock.mockRejectedValue(new ApiError('Proibido', { status: 403 }));
    await renderScreen();

    expect(await screen.findByText('Este baralho não está disponível.')).toBeTruthy();
  });

  it('mostra a mensagem do backend para outras falhas', async () => {
    getDeckMock.mockRejectedValue(new ApiError('Falha de conexão.', { status: 0, code: 'NETWORK_ERROR' }));
    await renderScreen();

    expect(await screen.findByText('Falha de conexão.')).toBeTruthy();
  });
});

describe('dados do baralho', () => {
  it('exibe nome, idiomas, total de cards, data de criação e os quatro blocos de contagem', async () => {
    await renderScreen();

    expect(await screen.findByText('Inglês')).toBeTruthy();
    expect(screen.getByText(/2 cards · pt → en · Criado em/)).toBeTruthy();

    expect(screen.getByText('Novos')).toBeTruthy();
    expect(screen.getByText('Maduros')).toBeTruthy();
    expect(screen.getByText('Suspensos')).toBeTruthy();
    expect(screen.getAllByText('1').length).toBe(2);
  });
});

describe('editar e excluir o baralho', () => {
  it('edita nome e idiomas', async () => {
    updateDeckMock.mockResolvedValue({ ...deck, name: 'Inglês avançado' });
    await renderScreen();
    await screen.findByText('Inglês');

    await fireEvent.press(screen.getByText('Editar'));
    await fireEvent.changeText(screen.getByLabelText('Nome do baralho'), 'Inglês avançado');
    await fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(updateDeckMock).toHaveBeenCalledWith('d1', { name: 'Inglês avançado', sourceLanguage: 'pt', targetLanguage: 'en' });
    });
    expect(await screen.findByText('Inglês avançado')).toBeTruthy();
  });

  it('exclui o baralho só depois de confirmar', async () => {
    deleteDeckMock.mockResolvedValue(undefined);
    await renderScreen();
    await screen.findByText('Inglês');

    await fireEvent.press(screen.getByText('Excluir'));
    expect(deleteDeckMock).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Confirmar exclusão'));

    await waitFor(() => {
      expect(deleteDeckMock).toHaveBeenCalledWith('d1');
      expect(navigation.navigate).toHaveBeenCalledWith('Home');
    });
  });
});

describe('paginação da lista de cards', () => {
  it('anexa a segunda página em vez de substituir a primeira', async () => {
    const firstPage = { items: [makeCard({ id: 'c1' }), makeCard({ id: 'c2' })], total: 4, page: 1, pageSize: 2 };
    const secondPage = { items: [makeCard({ id: 'c3' }), makeCard({ id: 'c4' })], total: 4, page: 2, pageSize: 2 };
    listCardsMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    await renderScreen();
    await screen.findByText('Inglês');
    await waitFor(() => expect(screen.getAllByText('casa').length).toBe(2));

    const list = screen.getByTestId('deck-detail-cards-list');
    await act(async () => {
      list.props.onEndReached();
    });

    await waitFor(() => expect(listCardsMock).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText('casa').length).toBe(4);
  });
});

describe('busca e filtro', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('busca por palavra com debounce de 300ms e reinicia a paginação', async () => {
    await renderScreen();
    await screen.findByText('Inglês');
    listCardsMock.mockClear();
    listCardsMock.mockResolvedValue(emptyPage());

    await fireEvent.changeText(screen.getByLabelText('Buscar por palavra'), 'casa');

    expect(listCardsMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(listCardsMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(listCardsMock).toHaveBeenCalledWith('d1', { page: 1, pageSize: 10, q: 'casa' });
    });
  });

  it('filtro por status dispara na hora, combinado com a busca', async () => {
    await renderScreen();
    await screen.findByText('Inglês');
    listCardsMock.mockClear();
    listCardsMock.mockResolvedValue(emptyPage());

    await fireEvent.changeText(screen.getByLabelText('Buscar por palavra'), 'casa');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(listCardsMock).toHaveBeenCalledWith('d1', { page: 1, pageSize: 10, q: 'casa' }));

    listCardsMock.mockClear();
    await fireEvent.press(screen.getByTestId('status-filter-learning'));

    await waitFor(() => {
      expect(listCardsMock).toHaveBeenCalledWith('d1', { page: 1, pageSize: 10, q: 'casa', status: 'learning' });
    });
  });
});

describe('ações do card', () => {
  it('mostra o selo de status e a próxima revisão', async () => {
    listCardsMock.mockResolvedValue({
      items: [makeCard({ status: 'mature', dueAt: '2026-01-16T00:00:00.000Z' })],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    await renderScreen();
    await screen.findByText('casa');

    expect(screen.getAllByText('Maduro').length).toBe(2);
    expect(screen.getByText('Hoje')).toBeTruthy();
  });

  it('edita um card inline e reflete a mudança sem recarregar a tela inteira', async () => {
    listCardsMock.mockResolvedValue({ items: [makeCard()], total: 1, page: 1, pageSize: 10 });
    updateCardMock.mockResolvedValue(makeCard({ word: 'casinha' }));
    await renderScreen();
    await screen.findByText('casa');

    await fireEvent.press(screen.getAllByText('Editar')[1]);
    await fireEvent.changeText(screen.getByLabelText('Palavra'), 'casinha');
    await fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() => expect(updateCardMock).toHaveBeenCalled());
    expect(await screen.findByText('casinha')).toBeTruthy();
    expect(listCardsMock).toHaveBeenCalledTimes(1);
  });

  it('exclui um card só depois de confirmar, atualizando a lista e as contagens', async () => {
    listCardsMock.mockResolvedValue({ items: [makeCard()], total: 1, page: 1, pageSize: 10 });
    deleteCardMock.mockResolvedValue(undefined);
    getDeckMock.mockResolvedValueOnce(deck).mockResolvedValueOnce({ ...deck, cardCount: 1 });
    await renderScreen();
    await screen.findByText('casa');

    await fireEvent.press(screen.getAllByText('Excluir')[1]);
    await fireEvent.press(screen.getByText('Confirmar exclusão'));

    await waitFor(() => expect(deleteCardMock).toHaveBeenCalledWith('c1'));
    expect(screen.queryByText('casa')).toBeNull();
    await waitFor(() => expect(getDeckMock).toHaveBeenCalledTimes(2));
  });

  it('suspende e reativa um card sem recarregar a tela inteira', async () => {
    listCardsMock.mockResolvedValue({ items: [makeCard({ suspended: false })], total: 1, page: 1, pageSize: 10 });
    suspendCardMock.mockResolvedValue(makeCard({ suspended: true, status: 'suspended' }));
    unsuspendCardMock.mockResolvedValue(makeCard({ suspended: false, status: 'new' }));
    await renderScreen();
    await screen.findByText('casa');

    await fireEvent.press(screen.getByText('Suspender'));
    await waitFor(() => expect(suspendCardMock).toHaveBeenCalledWith('c1'));
    expect(await screen.findByText('Reativar')).toBeTruthy();

    await fireEvent.press(screen.getByText('Reativar'));
    await waitFor(() => expect(unsuspendCardMock).toHaveBeenCalledWith('c1'));
    expect(await screen.findByText('Suspender')).toBeTruthy();

    expect(listCardsMock).toHaveBeenCalledTimes(1);
  });
});

describe('estados vazios da lista de cards', () => {
  it('distingue baralho sem nenhum card de busca sem resultado', async () => {
    listCardsMock.mockResolvedValue(emptyPage());
    await renderScreen();

    expect(await screen.findByText('Este baralho ainda não tem nenhum card.')).toBeTruthy();

    jest.useFakeTimers();
    listCardsMock.mockClear();
    listCardsMock.mockResolvedValue(emptyPage());
    await fireEvent.changeText(screen.getByLabelText('Buscar por palavra'), 'xyz');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Nenhum card encontrado.')).toBeTruthy();
    jest.useRealTimers();
  });
});
