import { request } from './client';

export interface Deck {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  cardCount: number;
  dueCount: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  suspendedCount: number;
  createdAt: string;
}

export interface CreateDeckInput {
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export type UpdateDeckInput = Partial<CreateDeckInput>;

/** Lista os baralhos do usuário autenticado. */
export async function listDecks(): Promise<Deck[]> {
  const { decks } = await request<{ decks: Deck[] }>('/decks', { auth: true });
  return decks;
}

/** Cria um baralho. */
export async function createDeck(input: CreateDeckInput): Promise<Deck> {
  const { deck } = await request<{ deck: Deck }>('/decks', { method: 'POST', auth: true, body: input });
  return deck;
}

/** Detalhe de um baralho, incluindo a contagem de cards. */
export async function getDeck(id: string): Promise<Deck> {
  const { deck } = await request<{ deck: Deck }>(`/decks/${id}`, { auth: true });
  return deck;
}

/** Edita nome e/ou par de idiomas de um baralho. */
export async function updateDeck(id: string, input: UpdateDeckInput): Promise<Deck> {
  const { deck } = await request<{ deck: Deck }>(`/decks/${id}`, { method: 'PATCH', auth: true, body: input });
  return deck;
}

/** Exclui um baralho e, em cascata, seus cards. */
export async function deleteDeck(id: string): Promise<void> {
  await request(`/decks/${id}`, { method: 'DELETE', auth: true });
}
