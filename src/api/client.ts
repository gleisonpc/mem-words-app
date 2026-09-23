import Constants from 'expo-constants';

import * as tokenStore from '../auth/tokenStore';
import { ApiError } from './ApiError';

/**
 * Cliente HTTP do backend — a única porta de saída do app.
 *
 * Tempo limite, formato de erro, envio do token e renovação da sessão são
 * decididos aqui, uma vez, e não repetidos por tela (ver spec
 * `backend-integration/api-client`, e `auth/session` para a parte de
 * renovação).
 */

const DEFAULT_TIMEOUT_MS = 15000;

/** Mensagem de sessão perdida, usada quando a renovação é recusada. */
const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.';

/** Remove a barra final para evitar URLs com `//` ao concatenar caminhos. */
function normalize(url: string): string {
  return url.replace(/\/+$/, '');
}

const configuredApiUrl = Constants.expoConfig?.extra?.['apiUrl'];

if (typeof configuredApiUrl !== 'string' || configuredApiUrl.trim() === '') {
  throw new Error(
    'extra.apiUrl não está configurado em app.config.ts — o app não sabe para onde enviar requisições.',
  );
}

export const API_URL = normalize(configuredApiUrl);

/** De onde veio a URL deste build, exibido na tela de diagnóstico. */
export const API_URL_SOURCE: string =
  typeof Constants.expoConfig?.extra?.['apiUrlSource'] === 'string'
    ? Constants.expoConfig.extra['apiUrlSource']
    : 'desconhecida';

export interface RequestOptions {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  /** Envia `Authorization: Bearer` e aciona renovação automática num 401. */
  auth?: boolean;
}

interface AttemptOptions {
  method: string;
  body?: unknown;
  timeoutMs: number;
  auth: boolean;
}

/** Devolve `null` quando não há corpo — sucesso sem dados, não falha de leitura. */
async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (text === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text.trim();
  }
}

/**
 * Uma tentativa de requisição: monta a URL, envia, devolve o corpo já
 * traduzido ou lança `ApiError`.
 *
 * O token é lido no momento do envio, não capturado antes — é isso que faz
 * a repetição depois de uma renovação usar o token novo.
 */
async function attempt<T>(path: string, options: AttemptOptions): Promise<T> {
  const { method, body, timeoutMs, auth } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const accessToken = tokenStore.getAccessToken();

    if (accessToken !== null) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  let payload: unknown;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    // A leitura fica dentro do tempo limite: uma resposta que começa e não
    // termina prenderia a tela em carregamento do mesmo jeito.
    payload = await readBody(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout(timeoutMs);
    }

    throw ApiError.network(error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, payload);
  }

  return payload as T;
}

interface MobileAuthTokens {
  accessToken: string;
  refreshToken: string;
}

function sessionExpired(cause: unknown): ApiError {
  return new ApiError(SESSION_EXPIRED_MESSAGE, { status: 401, code: 'SESSION_EXPIRED', cause });
}

/**
 * Troca o refresh token guardado por um novo par de tokens
 * (`POST /auth/mobile/refresh`), e os grava via `tokenStore`.
 *
 * Chama `/auth/mobile/refresh` diretamente em vez de importar
 * `api/auth.ts`, para não criar dependência circular entre os dois
 * módulos — mesma escolha do cliente web (ver design.md, "Renovação de
 * disparo único").
 *
 * Backend inacessível NÃO é tratado como sessão inválida: só uma recusa
 * explícita do backend (refresh token expirado, reusado, inexistente)
 * derruba a sessão local.
 */
async function performRenewal(): Promise<MobileAuthTokens> {
  const refreshToken = await tokenStore.getRefreshToken();

  if (refreshToken === null) {
    throw sessionExpired(undefined);
  }

  let tokens: MobileAuthTokens;

  try {
    tokens = await attempt<MobileAuthTokens>('/auth/mobile/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof ApiError && error.isConnectionFailure) {
      throw error;
    }

    await tokenStore.clearSession('session-expired');
    throw sessionExpired(error);
  }

  tokenStore.setAccessToken(tokens.accessToken);
  await tokenStore.setRefreshToken(tokens.refreshToken);
  return tokens;
}

/**
 * Troca o token de acesso por um novo, garantindo uma única renovação em
 * curso por vez (ver `tokenStore.getOrCreateRefreshPromise`). Exportada
 * porque a restauração de sessão na abertura do app reaproveita a mesma
 * renovação.
 */
export function renewTokens(): Promise<MobileAuthTokens> {
  return tokenStore.getOrCreateRefreshPromise(performRenewal);
}

/**
 * Executa uma requisição ao backend.
 *
 * Com `auth: true`, uma recusa por autenticação (401) dispara uma
 * renovação e **uma** repetição: a repetição é feita fora do `catch`,
 * então uma segunda recusa sobe para quem chamou em vez de iniciar outra
 * renovação — sem esse limite, credenciais erradas (que também respondem
 * 401) entrariam em laço.
 */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, auth = false } = options;
  const attemptOptions: AttemptOptions = { method, body, timeoutMs, auth };

  if (!auth) {
    return attempt<T>(path, attemptOptions);
  }

  try {
    return await attempt<T>(path, attemptOptions);
  } catch (error) {
    if (!(error instanceof ApiError) || !error.isUnauthorized) {
      throw error;
    }

    await renewTokens();
    return attempt<T>(path, attemptOptions);
  }
}
