jest.mock('../client', () => ({ request: jest.fn() }));

import { createDeck, deleteDeck, getDeck, listDecks, updateDeck } from '../decks';
import { request } from '../client';

const requestMock = request as jest.Mock;

beforeEach(() => {
  requestMock.mockReset();
});

describe('listDecks', () => {
  it('chama GET /decks com auth e devolve o array de baralhos', async () => {
    const decks = [{ id: '1' }];
    requestMock.mockResolvedValue({ decks });

    await expect(listDecks()).resolves.toBe(decks);

    expect(requestMock).toHaveBeenCalledWith('/decks', { auth: true });
  });
});

describe('createDeck', () => {
  it('chama POST /decks com o corpo e devolve o baralho criado', async () => {
    const deck = { id: '1', name: 'Inglês' };
    requestMock.mockResolvedValue({ deck });

    const input = { name: 'Inglês', sourceLanguage: 'pt', targetLanguage: 'en' };
    await expect(createDeck(input)).resolves.toBe(deck);

    expect(requestMock).toHaveBeenCalledWith('/decks', { method: 'POST', auth: true, body: input });
  });
});

describe('getDeck', () => {
  it('chama GET /decks/:id e devolve o baralho', async () => {
    const deck = { id: '1' };
    requestMock.mockResolvedValue({ deck });

    await expect(getDeck('1')).resolves.toBe(deck);

    expect(requestMock).toHaveBeenCalledWith('/decks/1', { auth: true });
  });
});

describe('updateDeck', () => {
  it('chama PATCH /decks/:id com os campos parciais', async () => {
    const deck = { id: '1', name: 'Novo nome' };
    requestMock.mockResolvedValue({ deck });

    await expect(updateDeck('1', { name: 'Novo nome' })).resolves.toBe(deck);

    expect(requestMock).toHaveBeenCalledWith('/decks/1', {
      method: 'PATCH',
      auth: true,
      body: { name: 'Novo nome' },
    });
  });
});

describe('deleteDeck', () => {
  it('chama DELETE /decks/:id', async () => {
    requestMock.mockResolvedValue(null);

    await deleteDeck('1');

    expect(requestMock).toHaveBeenCalledWith('/decks/1', { method: 'DELETE', auth: true });
  });
});
