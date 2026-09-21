import Constants from 'expo-constants';

import { ApiError } from './ApiError';

/**
 * Cliente HTTP do backend — a única porta de saída do app nesta change.
 *
 * Transporte apenas: URL base, JSON, tempo limite, tradução de erro. Sem
 * `credentials`/cookie (não existe o mesmo conceito em React Native) e sem
 * envio de token — isso é responsabilidade da capability `auth/session`,
 * que ainda não existe (ver `backend-integration/api-client`, Purpose).
 */

const DEFAULT_TIMEOUT_MS = 15000;

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
 * Executa uma requisição ao backend.
 *
 * Lança `ApiError` para toda falha — do backend, de rede ou de tempo
 * limite — nunca deixa um erro nativo (`TypeError` do `fetch`, `DOMException`
 * do abort) escapar para quem chamou.
 */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
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

    // Sem conectividade, DNS, backend fora do ar: o RN não distingue os
    // casos para o script, e a tela não precisa distinguir.
    throw ApiError.network(error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, payload);
  }

  return payload as T;
}
