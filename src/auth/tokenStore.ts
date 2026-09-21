import * as SecureStore from 'expo-secure-store';

/**
 * Único módulo que toca o armazenamento seguro do dispositivo e a memória
 * do access token — `client.ts` e `SessionProvider` leem dele, nenhum
 * deles importa o outro (ver design.md, "Módulo único concentra o
 * armazenamento").
 *
 * O refresh token é de uso único (o backend rotaciona a cada renovação, e
 * reapresentar um já gasto revoga todas as sessões do usuário) — por isso
 * `getOrCreateRefreshPromise` existe: garante que chamadores concorrentes
 * aguardem a mesma renovação em vez de apresentar o mesmo token duas
 * vezes.
 */

const REFRESH_TOKEN_KEY = 'mem-words.refreshToken';

export type SessionEndReason = 'logout' | 'session-expired';
type SessionEndListener = (reason: SessionEndReason) => void;

let accessToken: string | null = null;
let refreshPromise: Promise<unknown> | null = null;
const listeners = new Set<SessionEndListener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Armazenamento seguro indisponível: trata como se não houvesse
    // token guardado — a sessão vale só enquanto o app estiver aberto.
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch {
    // Falha ao persistir: a sessão atual continua valendo em memória, só
    // não sobrevive a fechar o app — degradação tolerada (ver spec
    // auth/session, "Armazenamento seguro indisponível").
  }
}

export async function clearRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Nada a fazer: se não dá para gravar, também não dá para apagar.
  }
}

/**
 * Registra interesse no encerramento da sessão e devolve a função que
 * cancela a inscrição. Só o encerramento é notificado — quem cria uma
 * sessão (login/cadastro) já sabe disso por conta própria; o que não dá
 * para perceber sozinho é a sessão morrendo dentro de uma renovação
 * recusada, longe de qualquer tela.
 */
export function onSessionEnded(listener: SessionEndListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Descarta o access token em memória e o refresh token do armazenamento
 * seguro, e avisa quem está inscrito — é o único caminho de encerramento,
 * usado tanto pela saída pedida pelo usuário quanto por uma renovação
 * recusada pelo backend.
 */
export async function clearSession(reason: SessionEndReason): Promise<void> {
  accessToken = null;
  await clearRefreshToken();

  for (const listener of listeners) {
    listener(reason);
  }
}

/**
 * Garante que só exista uma renovação em curso por vez. Quem chama
 * durante uma renovação em andamento recebe a mesma promessa — nunca
 * dispara uma segunda chamada a `/auth/mobile/refresh`.
 */
export function getOrCreateRefreshPromise<T>(factory: () => Promise<T>): Promise<T> {
  if (refreshPromise === null) {
    refreshPromise = factory().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise as Promise<T>;
}

/** Só para testes: reseta o estado em memória entre casos. */
export function __resetForTests(): void {
  accessToken = null;
  refreshPromise = null;
}
