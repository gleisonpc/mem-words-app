import { ApiError } from './ApiError';
import { request } from './client';

/**
 * Consulta o endpoint `/health` do backend.
 *
 * Resolve com `{ ok, detail }`: `ok` indica se a conexão foi bem sucedida
 * e `detail` traz a mensagem do backend ou o motivo da falha. Nunca
 * lança — a tela de diagnóstico trata sucesso e falha do mesmo jeito,
 * como dois resultados possíveis, não como caminho feliz vs. exceção.
 *
 * Tempo limite curto e próprio desta chamada: aqui o objetivo é reportar
 * rápido que o backend não está respondendo.
 */

const TIMEOUT_MS = 5000;

export interface HealthCheckResult {
  ok: boolean;
  detail: string;
}

function describeBody(payload: unknown): string {
  if (payload === null) {
    return 'HTTP 200';
  }

  return typeof payload === 'string' ? payload : JSON.stringify(payload);
}

/** Motivo da falha: conexão perdida vem pronta; recusa do backend leva o status. */
function describeFailure(error: ApiError): string {
  if (error.isConnectionFailure) {
    return error.message;
  }

  return `HTTP ${error.status} ${error.message}`.trim();
}

export async function checkHealth(): Promise<HealthCheckResult> {
  try {
    const payload = await request('/health', { timeoutMs: TIMEOUT_MS });
    return { ok: true, detail: describeBody(payload) };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, detail: describeFailure(error) };
    }

    throw error;
  }
}
