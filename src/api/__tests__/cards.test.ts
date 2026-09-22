jest.mock('../client', () => ({ request: jest.fn() }));

import { createCard, deleteCard, listCards, suspendCard, unsuspendCard, updateCard } from '../cards';
import { request } from '../client';

const requestMock = request as jest.Mock;

beforeEach(() => {
  requestMock.mockReset();
});

describe('listCards', () => {
  it('chama GET /decks/:id/cards sem query quando nenhuma opção é passada', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });

    await listCards('deck-1');

    expect(requestMock).toHaveBeenCalledWith('/decks/deck-1/cards', { auth: true });
  });

  it('monta a query string com page, pageSize, q e status quando presentes', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0, page: 2, pageSize: 10 });

    await listCards('deck-1', { page: 2, pageSize: 10, q: 'casa', status: 'learning' });

    const [path, options] = requestMock.mock.calls[0] as [string, unknown];
    expect(options).toEqual({ auth: true });
    expect(path).toBe('/decks/deck-1/cards?page=2&pageSize=10&q=casa&status=learning');
  });

  it('inclui só as opções presentes na query string', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });

    await listCards('deck-1', { q: 'casa' });

    expect(requestMock).toHaveBeenCalledWith('/decks/deck-1/cards?q=casa', { auth: true });
  });
});

describe('createCard', () => {
  it('chama POST /decks/:id/cards com o corpo e devolve o card criado', async () => {
    const card = { id: '1', word: 'casa', translation: 'house' };
    requestMock.mockResolvedValue({ card });

    const input = { word: 'casa', translation: 'house' };
    await expect(createCard('deck-1', input)).resolves.toBe(card);

    expect(requestMock).toHaveBeenCalledWith('/decks/deck-1/cards', { method: 'POST', auth: true, body: input });
  });
});

describe('updateCard', () => {
  it('chama PATCH /cards/:id com os campos parciais', async () => {
    const card = { id: '1', word: 'casa' };
    requestMock.mockResolvedValue({ card });

    await expect(updateCard('1', { word: 'casa' })).resolves.toBe(card);

    expect(requestMock).toHaveBeenCalledWith('/cards/1', { method: 'PATCH', auth: true, body: { word: 'casa' } });
  });
});

describe('deleteCard', () => {
  it('chama DELETE /cards/:id', async () => {
    requestMock.mockResolvedValue(null);

    await deleteCard('1');

    expect(requestMock).toHaveBeenCalledWith('/cards/1', { method: 'DELETE', auth: true });
  });
});

describe('suspendCard', () => {
  it('chama POST /cards/:id/suspend e devolve o card atualizado', async () => {
    const card = { id: '1', suspended: true };
    requestMock.mockResolvedValue({ card });

    await expect(suspendCard('1')).resolves.toBe(card);

    expect(requestMock).toHaveBeenCalledWith('/cards/1/suspend', { method: 'POST', auth: true });
  });
});

describe('unsuspendCard', () => {
  it('chama POST /cards/:id/unsuspend e devolve o card atualizado', async () => {
    const card = { id: '1', suspended: false };
    requestMock.mockResolvedValue({ card });

    await expect(unsuspendCard('1')).resolves.toBe(card);

    expect(requestMock).toHaveBeenCalledWith('/cards/1/unsuspend', { method: 'POST', auth: true });
  });
});
