import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/ApiError';
import {
  deleteCard,
  listCards,
  suspendCard,
  unsuspendCard,
  updateCard,
  type Card,
  type CardStatus,
} from '../api/cards';
import { deleteDeck, getDeck, updateDeck, type Deck } from '../api/decks';
import { collect } from '../auth/validation';
import {
  CardFields,
  cardInputFromValues,
  synonymsToText,
  type CardFieldValues,
} from '../cards/CardFields';
import { validateTranslation, validateWord } from '../cards/validation';
import { TextField } from '../components/TextField';
import { validateDeckName, validateLanguage } from '../decks/validation';
import type { AppStackParamList } from '../navigation/AppStack';
import { useTheme, type Theme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<AppStackParamList, 'DeckDetail'>;

const PAGE_SIZE = 10;

/** Debounce da busca por palavra — mesmo valor do `mem-words-frontend`. */
const SEARCH_DEBOUNCE_MS = 300;

type DeckLoadStatus = 'carregando' | 'indisponível' | 'erro' | 'ok';
type CardsLoadStatus = 'carregando' | 'erro' | 'ok';

const STATUS_LABELS: Record<CardStatus, string> = {
  new: 'Novo',
  learning: 'Aprendendo',
  difficult: 'Difícil',
  mature: 'Maduro',
  reviewing: 'Revisando',
  suspended: 'Suspenso',
};

const STATUS_FILTER_OPTIONS: Array<{ value: CardStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'new', label: STATUS_LABELS.new },
  { value: 'learning', label: STATUS_LABELS.learning },
  { value: 'difficult', label: STATUS_LABELS.difficult },
  { value: 'mature', label: STATUS_LABELS.mature },
  { value: 'reviewing', label: STATUS_LABELS.reviewing },
  { value: 'suspended', label: STATUS_LABELS.suspended },
];

/** `ApiError` de posse/existência: o backend distingue os dois casos, a tela não. */
function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}

/** "criado em <mês> de <ano>", a partir de `createdAt`. Texto fixo em pt-BR (i18n é Non-Goal). */
function formatCreatedMonth(createdAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(createdAt));
}

/** Rótulo curto da próxima revisão de um card — "Hoje"/"Amanhã"/"Em Nd"/"—". */
function formatNextReview(dueAt: string | null, now: Date): string {
  if (dueAt === null) {
    return '—';
  }

  const diffDays = Math.ceil((new Date(dueAt).getTime() - now.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    return 'Hoje';
  }

  if (diffDays === 1) {
    return 'Amanhã';
  }

  return `Em ${diffDays}d`;
}

/**
 * Mapeamento fixo status→cor (ver design.md, "Selo de status do card").
 * `reviewing`/`suspended` reaproveitam `textMuted`/`border` — `tokens.ts`
 * não define uma cor "neutral" própria.
 */
function statusBadgeColors(status: CardStatus, theme: Theme): { color: string; backgroundColor: string } {
  switch (status) {
    case 'new':
      return { color: theme.colors.info, backgroundColor: theme.colors.infoBg };
    case 'learning':
      return { color: theme.colors.warning, backgroundColor: theme.colors.warningBg };
    case 'difficult':
      return { color: theme.colors.danger, backgroundColor: theme.colors.dangerBg };
    case 'mature':
      return { color: theme.colors.success, backgroundColor: theme.colors.successBg };
    case 'reviewing':
    case 'suspended':
      return { color: theme.colors.textMuted, backgroundColor: theme.colors.border };
  }
}

interface DeckEditFormProps {
  deck: Deck;
  theme: Theme;
  onSaved: (deck: Deck) => void;
  onCancel: () => void;
}

/** Formulário de nome/idiomas — reaproveitado para editar o baralho. */
function DeckEditForm({ deck, theme, onSaved, onCancel }: DeckEditFormProps) {
  const [name, setName] = useState(deck.name);
  const [sourceLanguage, setSourceLanguage] = useState(deck.sourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(deck.targetLanguage);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const errors = collect({
      name: validateDeckName(name),
      sourceLanguage: validateLanguage(sourceLanguage),
      targetLanguage: validateLanguage(targetLanguage),
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const updated = await updateDeck(deck.id, {
        name: name.trim(),
        sourceLanguage: sourceLanguage.trim(),
        targetLanguage: targetLanguage.trim(),
      });
      onSaved(updated);
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
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      {formError !== null && (
        <Text accessibilityLiveRegion="polite" style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>
          {formError}
        </Text>
      )}

      <TextField label="Nome do baralho" value={name} onChangeText={setName} error={fieldErrors.name} editable={!submitting} />
      <TextField
        label="Idioma de origem"
        value={sourceLanguage}
        onChangeText={setSourceLanguage}
        error={fieldErrors.sourceLanguage}
        editable={!submitting}
      />
      <TextField
        label="Idioma de destino"
        value={targetLanguage}
        onChangeText={setTargetLanguage}
        error={fieldErrors.targetLanguage}
        editable={!submitting}
      />

      <View style={styles.formActions}>
        <Pressable onPress={onCancel} disabled={submitting} style={styles.smallButton}>
          <Text style={[styles.smallButtonText, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, opacity: submitting ? 0.6 : 1 }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            {submitting ? 'Salvando…' : 'Salvar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface DeckHeaderProps {
  deck: Deck;
  theme: Theme;
  onUpdated: (deck: Deck) => void;
  onDeleted: () => void;
}

/** Cabeçalho do baralho: exibição, edição e exclusão (confirmação em dois passos, sem modal). */
function DeckHeader({ deck, theme, onUpdated, onDeleted }: DeckHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteDeck(deck.id);
      onDeleted();
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Não foi possível excluir o baralho.');
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <DeckEditForm
        deck={deck}
        theme={theme}
        onSaved={(updated) => {
          onUpdated(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>{deck.name}</Text>

        <View style={styles.cardHeaderActions}>
          <Pressable testID="deck-edit-button" onPress={() => setEditing(true)} style={styles.smallButton}>
            <Text style={[styles.smallButtonText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>Editar</Text>
          </Pressable>

          {!confirmingDelete ? (
            <Pressable testID="deck-delete-button" onPress={() => setConfirmingDelete(true)} style={styles.smallButton}>
              <Text style={[styles.smallButtonText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>Excluir</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={handleDelete} disabled={deleting} style={styles.smallButton}>
                <Text style={[styles.smallButtonText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>
                  {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setConfirmingDelete(false)} disabled={deleting} style={styles.smallButton}>
                <Text style={[styles.smallButtonText, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>Cancelar</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {deleteError !== null && (
        <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>{deleteError}</Text>
      )}

      <Text style={[styles.cardMeta, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>
        {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'} · {deck.sourceLanguage} → {deck.targetLanguage} · Criado em{' '}
        {formatCreatedMonth(deck.createdAt)}
      </Text>
    </View>
  );
}

interface DeckStatsProps {
  deck: Deck;
  theme: Theme;
}

/** Os quatro blocos de contagem por status do baralho. */
function DeckStats({ deck, theme }: DeckStatsProps) {
  const tiles: Array<{ label: string; value: number }> = [
    { label: 'Novos', value: deck.newCount ?? 0 },
    { label: 'Aprendendo', value: deck.learningCount ?? 0 },
    { label: 'Maduros', value: deck.matureCount ?? 0 },
    { label: 'Suspensos', value: deck.suspendedCount ?? 0 },
  ];

  return (
    <View style={styles.statsRow}>
      {tiles.map((tile) => (
        <View
          key={tile.label}
          style={[styles.statTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}
        >
          <Text style={[styles.statValue, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>{tile.value}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted, fontSize: theme.fontSize.xs }]}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

interface CardEditFormProps {
  card: Card;
  theme: Theme;
  onSaved: (card: Card) => void;
  onCancel: () => void;
}

/** Formulário de edição de um card existente, sobre `CardFields` (mesma validação da criação). */
function CardEditForm({ card, theme, onSaved, onCancel }: CardEditFormProps) {
  const [values, setValues] = useState<CardFieldValues>({
    word: card.word,
    translation: card.translation,
    synonyms: synonymsToText(card.synonyms),
    partOfSpeech: card.partOfSpeech ?? '',
    exampleSentence: card.exampleSentence ?? '',
    exampleTranslation: card.exampleTranslation ?? '',
    personalNote: card.personalNote ?? '',
  });
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
      const updated = await updateCard(card.id, cardInputFromValues(values));
      onSaved(updated);
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
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      {formError !== null && (
        <Text accessibilityLiveRegion="polite" style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>
          {formError}
        </Text>
      )}

      <CardFields values={values} onChange={handleChange} fieldErrors={fieldErrors} disabled={submitting} />

      <View style={styles.formActions}>
        <Pressable onPress={onCancel} disabled={submitting} style={styles.smallButton}>
          <Text style={[styles.smallButtonText, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, opacity: submitting ? 0.6 : 1 }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            {submitting ? 'Salvando…' : 'Salvar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface CardRowProps {
  card: Card;
  theme: Theme;
  now: Date;
  onUpdated: (card: Card) => void;
  onDeleted: (id: string) => void;
  onSuspendToggled: (card: Card) => void;
}

/** Um card na lista: exibição, edição, exclusão e suspensão/reativação. */
function CardRow({ card, theme, now, onUpdated, onDeleted, onSuspendToggled }: CardRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteCard(card.id);
      onDeleted(card.id);
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Não foi possível excluir o card.');
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSuspendToggle() {
    setSuspending(true);
    setSuspendError(null);

    try {
      const updated = card.suspended ? await unsuspendCard(card.id) : await suspendCard(card.id);
      onSuspendToggled(updated);
    } catch (error) {
      setSuspendError(
        error instanceof ApiError
          ? error.message
          : card.suspended
            ? 'Não foi possível reativar o card.'
            : 'Não foi possível suspender o card.',
      );
    } finally {
      setSuspending(false);
    }
  }

  if (editing) {
    return (
      <CardEditForm
        card={card}
        theme={theme}
        onSaved={(updated) => {
          onUpdated(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const badgeColors = statusBadgeColors(card.status, theme);
  const detailLine = [card.partOfSpeech, card.synonyms.length > 0 ? `sin.: ${card.synonyms.join(', ')}` : null]
    .filter((entry): entry is string => Boolean(entry))
    .join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      {deleteError !== null && (
        <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>{deleteError}</Text>
      )}
      {suspendError !== null && (
        <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>{suspendError}</Text>
      )}

      <View style={styles.cardHeaderRow}>
        <View style={styles.cardMainText}>
          <Text style={[styles.cardWord, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>{card.word}</Text>
          <Text style={[styles.cardTranslation, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>{card.translation}</Text>
        </View>

        <View style={styles.cardStatusColumn}>
          <View style={[styles.badge, { backgroundColor: badgeColors.backgroundColor, borderRadius: theme.radius.pill }]}>
            <Text style={[styles.badgeText, { color: badgeColors.color, fontSize: theme.fontSize.xs }]}>{STATUS_LABELS[card.status]}</Text>
          </View>
          <Text style={[styles.nextReview, { color: theme.colors.textMuted, fontSize: theme.fontSize.xs }]}>
            {formatNextReview(card.dueAt, now)}
          </Text>
        </View>
      </View>

      {detailLine !== '' && (
        <Text style={[styles.cardDetail, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>{detailLine}</Text>
      )}

      {card.exampleSentence && (
        <Text style={[styles.cardDetail, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>
          {card.exampleSentence}
          {card.exampleTranslation ? ` — ${card.exampleTranslation}` : ''}
        </Text>
      )}

      {card.personalNote && (
        <Text style={[styles.cardDetail, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>{card.personalNote}</Text>
      )}

      <View style={styles.cardActions}>
        <Pressable onPress={() => setEditing(true)} style={styles.smallButton}>
          <Text style={[styles.smallButtonText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>Editar</Text>
        </Pressable>

        <Pressable onPress={handleSuspendToggle} disabled={suspending} style={styles.smallButton}>
          <Text style={[styles.smallButtonText, { color: theme.colors.text, fontSize: theme.fontSize.sm }]}>
            {card.suspended ? 'Reativar' : 'Suspender'}
          </Text>
        </Pressable>

        {!confirmingDelete ? (
          <Pressable onPress={() => setConfirmingDelete(true)} style={styles.smallButton}>
            <Text style={[styles.smallButtonText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>Excluir</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={handleDelete} disabled={deleting} style={styles.smallButton}>
              <Text style={[styles.smallButtonText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>
                {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setConfirmingDelete(false)} disabled={deleting} style={styles.smallButton}>
              <Text style={[styles.smallButtonText, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>Cancelar</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

/** Tela de detalhe de um baralho: dados do baralho e seus cards, paginados (ver spec `decks/screens`). */
export default function DeckDetailScreen({ navigation, route }: Props) {
  const { deckId, newCard } = route.params;
  const theme = useTheme();

  const [deckStatus, setDeckStatus] = useState<DeckLoadStatus>('carregando');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);

  const [cardsStatus, setCardsStatus] = useState<CardsLoadStatus>('carregando');
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CardStatus | ''>('');

  const loadDeck = useCallback(async () => {
    setDeckStatus('carregando');

    try {
      setDeck(await getDeck(deckId));
      setDeckStatus('ok');
    } catch (error) {
      setDeckError(
        isUnavailable(error)
          ? 'Este baralho não está disponível.'
          : error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar o baralho.',
      );
      setDeckStatus(isUnavailable(error) ? 'indisponível' : 'erro');
    }
  }, [deckId]);

  // Atualiza só as contagens do baralho, sem passar pela tela de carregamento inteira.
  const refreshDeckStats = useCallback(async () => {
    try {
      setDeck(await getDeck(deckId));
    } catch {
      // Falha aqui só deixa as contagens desatualizadas até a próxima ação.
    }
  }, [deckId]);

  const loadCards = useCallback(
    async (pageToLoad: number, options: { append: boolean }) => {
      if (options.append) {
        setLoadingMore(true);
      } else {
        setCardsStatus('carregando');
      }

      try {
        const result = await listCards(deckId, {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          ...(debouncedSearch.trim() !== '' && { q: debouncedSearch.trim() }),
          ...(statusFilter !== '' && { status: statusFilter }),
        });

        setCards((current) => (options.append ? [...current, ...result.items] : result.items));
        setTotal(result.total);
        setPage(pageToLoad);
        setCardsStatus('ok');
      } catch {
        if (!options.append) {
          setCardsStatus('erro');
        }
      } finally {
        if (options.append) {
          setLoadingMore(false);
        }
      }
    },
    [deckId, debouncedSearch, statusFilter],
  );

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  // Busca ou filtrar reinicia a paginação — a página atual pode não existir no conjunto filtrado.
  useEffect(() => {
    if (deckStatus === 'ok') {
      loadCards(1, { append: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckStatus, loadCards]);

  // Debounce só na busca por texto — o filtro por status dispara na hora.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  function handleCardCreated(card: Card) {
    setCards((current) => [card, ...current]);
    setTotal((current) => current + 1);
    refreshDeckStats();
  }

  // `AddCardScreen` volta com `newCard` no parâmetro (merge, ver AppStack.tsx) em vez de um callback.
  useEffect(() => {
    if (newCard) {
      handleCardCreated(newCard);
      navigation.setParams({ newCard: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCard]);

  function handleEndReached() {
    if (cardsStatus !== 'ok' || loadingMore || cards.length >= total) {
      return;
    }

    loadCards(page + 1, { append: true });
  }

  function handleCardUpdated(updated: Card) {
    setCards((current) => current.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleCardDeleted(id: string) {
    setCards((current) => current.filter((c) => c.id !== id));
    setTotal((current) => Math.max(0, current - 1));
    refreshDeckStats();
  }

  function handleCardSuspendToggled(updated: Card) {
    setCards((current) => current.map((c) => (c.id === updated.id ? updated : c)));
    refreshDeckStats();
  }

  if (deckStatus === 'carregando') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (deckStatus === 'indisponível' || deckStatus === 'erro' || deck === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.messageText, { color: theme.colors.danger, fontSize: theme.fontSize.md }]}>{deckError}</Text>
        <Pressable onPress={() => navigation.navigate('Home')} style={styles.smallButton}>
          <Text style={[styles.smallButtonText, { color: theme.colors.primary, fontSize: theme.fontSize.md }]}>Voltar aos baralhos</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const isFiltering = debouncedSearch.trim() !== '' || statusFilter !== '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <FlatList
        testID="deck-detail-cards-list"
        data={cards}
        keyExtractor={(card) => card.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Pressable onPress={() => navigation.navigate('Home')}>
              <Text style={[styles.backLink, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>← Meus baralhos</Text>
            </Pressable>

            <DeckHeader deck={deck} theme={theme} onUpdated={setDeck} onDeleted={() => navigation.navigate('Home')} />
            <DeckStats deck={deck} theme={theme} />

            <View style={styles.cardsHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>Cards</Text>
              <Pressable
                onPress={() => navigation.navigate('AddCard', { deckId })}
                style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
              >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.sm }]}>Adicionar card</Text>
              </Pressable>
            </View>

            <TextField label="Buscar por palavra" value={search} onChangeText={setSearch} placeholder="Digite para buscar" />

            <View style={styles.filterRow}>
              {STATUS_FILTER_OPTIONS.map((option) => {
                const active = option.value === statusFilter;
                return (
                  <Pressable
                    key={option.value === '' ? 'todos' : option.value}
                    testID={`status-filter-${option.value === '' ? 'todos' : option.value}`}
                    onPress={() => setStatusFilter(option.value)}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? theme.colors.primaryHover : theme.colors.surface,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? theme.colors.onPrimary : theme.colors.textMuted, fontSize: theme.fontSize.xs },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {cardsStatus === 'carregando' && (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}

            {cardsStatus === 'erro' && (
              <Text style={[styles.messageText, { color: theme.colors.danger, fontSize: theme.fontSize.md }]}>
                Não foi possível carregar os cards.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CardRow
            card={item}
            theme={theme}
            now={now}
            onUpdated={handleCardUpdated}
            onDeleted={handleCardDeleted}
            onSuspendToggled={handleCardSuspendToggled}
          />
        )}
        ListEmptyComponent={
          cardsStatus === 'ok' ? (
            <Text style={[styles.messageText, { color: theme.colors.textMuted, fontSize: theme.fontSize.md }]}>
              {isFiltering ? 'Nenhum card encontrado.' : 'Este baralho ainda não tem nenhum card.'}
            </Text>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    gap: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
  headerSection: {
    gap: 12,
    marginBottom: 8,
  },
  backLink: {
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    fontWeight: '700',
    flexShrink: 1,
  },
  cardMeta: {},
  errorText: {
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: {
    fontWeight: '600',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  smallButtonText: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {},
  cardsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipText: {
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  messageText: {
    textAlign: 'center',
  },
  cardMainText: {
    flex: 1,
    gap: 2,
  },
  cardWord: {
    fontWeight: '600',
  },
  cardTranslation: {},
  cardStatusColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontWeight: '600',
  },
  nextReview: {},
  cardDetail: {},
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
});
