import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/ApiError';
import { createDeck, listDecks, type Deck } from '../api/decks';
import { useSession } from '../auth/session';
import { collect } from '../auth/validation';
import { TextField } from '../components/TextField';
import { validateDeckName, validateLanguage } from '../decks/validation';
import type { AppStackParamList } from '../navigation/AppStack';
import { useTheme, type Theme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

type LoadStatus = 'carregando' | 'erro' | 'ok';

/** Selo de quantos cards estão prontos para revisão agora, ou "em dia" (ver design.md, "Ação de revisar adiada" — informativo, sem navegação nesta change). */
function DueBadge({ dueCount, theme }: { dueCount: number; theme: Theme }) {
  const ready = dueCount > 0;
  const label = ready ? `${dueCount} hoje` : 'Em dia';
  const backgroundColor = ready ? theme.colors.warningBg : theme.colors.successBg;
  const color = ready ? theme.colors.warning : theme.colors.success;

  return (
    <View style={[styles.badge, { backgroundColor, borderRadius: theme.radius.pill }]}>
      <Text style={[styles.badgeText, { color, fontSize: theme.fontSize.xs }]}>{label}</Text>
    </View>
  );
}

interface DeckRowProps {
  deck: Deck;
  theme: Theme;
  onPress: () => void;
}

function DeckRow({ deck, theme, onPress }: DeckRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.deckRow,
        { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.deckRowMain}>
        <Text style={[styles.deckName, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>{deck.name}</Text>
        <Text style={[styles.deckMeta, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>
          {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'} · {deck.sourceLanguage} → {deck.targetLanguage}
        </Text>
      </View>

      <DueBadge dueCount={deck.dueCount} theme={theme} />
    </Pressable>
  );
}

interface CreateDeckFormProps {
  theme: Theme;
  onCreated: (deck: Deck) => void;
  onCancel: () => void;
}

/** Formulário de criação de um baralho novo, revelado sob demanda. */
function CreateDeckForm({ theme, onCreated, onCancel }: CreateDeckFormProps) {
  const [name, setName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
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
      const deck = await createDeck({
        name: name.trim(),
        sourceLanguage: sourceLanguage.trim(),
        targetLanguage: targetLanguage.trim(),
      });
      onCreated(deck);
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
    <View style={[styles.form, { borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      {formError !== null && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.formError, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}
        >
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
        <Pressable onPress={onCancel} disabled={submitting} style={styles.formCancel}>
          <Text style={[styles.formCancelText, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, opacity: submitting ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
            {submitting ? 'Criando…' : 'Criar baralho'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Lista dos baralhos do usuário (ver spec `decks/screens`) — ponto de entrada da pilha autenticada. */
export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { logout } = useSession();

  const [status, setStatus] = useState<LoadStatus>('carregando');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setStatus('carregando');

    try {
      setDecks(await listDecks());
      setStatus('ok');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os baralhos.');
      setStatus('erro');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(deck: Deck) {
    setDecks((current) => [...current, { ...deck, cardCount: deck.cardCount ?? 0, dueCount: deck.dueCount ?? 0 }]);
    setCreating(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>Meus baralhos</Text>

        <View style={styles.headerLinks}>
          <Pressable onPress={() => navigation.navigate('Diagnostics')}>
            <Text style={[styles.headerLinkText, { color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>
              Diagnóstico
            </Text>
          </Pressable>
          <Pressable onPress={() => logout()}>
            <Text style={[styles.headerLinkText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>Sair</Text>
          </Pressable>
        </View>
      </View>

      {!creating && (
        <Pressable
          onPress={() => setCreating(true)}
          style={[styles.button, styles.createButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>Criar baralho</Text>
        </Pressable>
      )}

      {creating && <CreateDeckForm theme={theme} onCreated={handleCreated} onCancel={() => setCreating(false)} />}

      {status === 'carregando' && (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {status === 'erro' && (
        <View style={styles.centered}>
          <Text style={[styles.messageText, { color: theme.colors.danger, fontSize: theme.fontSize.md }]}>{error}</Text>
        </View>
      )}

      {status === 'ok' && decks.length === 0 && (
        <View style={styles.centered}>
          <Text style={[styles.messageText, { color: theme.colors.textMuted, fontSize: theme.fontSize.md }]}>
            Você ainda não tem nenhum baralho.
          </Text>
        </View>
      )}

      {status === 'ok' && decks.length > 0 && (
        <FlatList
          data={decks}
          keyExtractor={(deck) => deck.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DeckRow deck={item} theme={theme} onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '700',
  },
  headerLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  headerLinkText: {
    fontWeight: '600',
  },
  createButton: {
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontWeight: '600',
  },
  form: {
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  formError: {
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  formCancel: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  formCancelText: {
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  messageText: {
    textAlign: 'center',
  },
  list: {
    gap: 8,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  deckRowMain: {
    flex: 1,
    gap: 4,
  },
  deckName: {
    fontWeight: '600',
  },
  deckMeta: {},
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontWeight: '600',
  },
});
