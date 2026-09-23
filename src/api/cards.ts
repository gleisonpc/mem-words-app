import { request } from './client';

export type CardStatus = 'new' | 'learning' | 'difficult' | 'mature' | 'reviewing' | 'suspended';

export interface Card {
  id: string;
  deckId: string;
  word: string;
  translation: string;
  partOfSpeech?: string | null;
  synonyms: string[];
  exampleSentence?: string | null;
  exampleTranslation?: string | null;
  personalNote?: string | null;
  status: CardStatus;
  suspended: boolean;
  dueAt: string | null;
}

export interface CreateCardInput {
  word: string;
  translation: string;
  partOfSpeech?: string;
  synonyms?: string[];
  exampleSentence?: string;
  exampleTranslation?: string;
  personalNote?: string;
}

export type UpdateCardInput = Partial<CreateCardInput>;

export interface ListCardsOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: CardStatus;
}

export interface ListCardsResult {
  items: Card[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lista os cards de um baralho, paginados.
 *
 * `page`/`pageSize` são opcionais — omitidos, o backend aplica seus próprios
 * padrões. `q` busca por palavra e `status` filtra pelo status calculado do
 * card; os dois são opcionais e se combinam.
 */
export function listCards(deckId: string, options: ListCardsOptions = {}): Promise<ListCardsResult> {
  const { page, pageSize, q, status } = options;
  const params = new URLSearchParams();

  if (page !== undefined) {
    params.set('page', String(page));
  }

  if (pageSize !== undefined) {
    params.set('pageSize', String(pageSize));
  }

  if (q !== undefined) {
    params.set('q', q);
  }

  if (status !== undefined) {
    params.set('status', status);
  }

  const query = params.toString();
  return request<ListCardsResult>(`/decks/${deckId}/cards${query === '' ? '' : `?${query}`}`, { auth: true });
}

/** Cria um card em um baralho. */
export async function createCard(deckId: string, input: CreateCardInput): Promise<Card> {
  const { card } = await request<{ card: Card }>(`/decks/${deckId}/cards`, {
    method: 'POST',
    auth: true,
    body: input,
  });
  return card;
}

/** Edita os campos de um card. */
export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const { card } = await request<{ card: Card }>(`/cards/${id}`, { method: 'PATCH', auth: true, body: input });
  return card;
}

/** Exclui um card. */
export async function deleteCard(id: string): Promise<void> {
  await request(`/cards/${id}`, { method: 'DELETE', auth: true });
}

/** Suspende um card, tirando-o da revisão até ser reativado. */
export async function suspendCard(id: string): Promise<Card> {
  const { card } = await request<{ card: Card }>(`/cards/${id}/suspend`, { method: 'POST', auth: true });
  return card;
}

/** Reativa um card suspenso, retomando seu agendamento de onde parou. */
export async function unsuspendCard(id: string): Promise<Card> {
  const { card } = await request<{ card: Card }>(`/cards/${id}/unsuspend`, { method: 'POST', auth: true });
  return card;
}
