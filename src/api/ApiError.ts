/**
 * Falha de uma chamada ao backend, em formato único.
 *
 * Adaptado de `mem-words-frontend/src/api/ApiError.js`: erro do backend,
 * falha de rede, tempo limite e resposta ilegível chegam às telas como a
 * mesma coisa, para que nenhuma tela precise descobrir a origem do
 * problema para conseguir exibi-lo (ver
 * `backend-integration/api-client`).
 */

export const NETWORK_ERROR = 'NETWORK_ERROR';
export const TIMEOUT = 'TIMEOUT';

const FALLBACK_MESSAGE = 'Não foi possível concluir a operação.';

export interface FieldErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}

/**
 * O backend prefixa o nome do campo com a parte da requisição em que ele
 * estava: `body.email`, `params.id`. As telas conhecem o campo pelo nome
 * nu.
 */
function fieldName(field: unknown): string {
  return String(field).replace(/^(body|params|query)\./, '');
}

/**
 * Converte o `details` do backend — `[{ field, message }]` — no mapa que
 * os formulários consomem. Entradas sem campo ou sem mensagem são
 * ignoradas: o erro geral já cobre o que elas diriam.
 */
function toFieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const detail of details) {
    if (
      detail &&
      typeof detail === 'object' &&
      typeof (detail as Record<string, unknown>).field === 'string' &&
      typeof (detail as Record<string, unknown>).message === 'string'
    ) {
      const name = fieldName((detail as Record<string, unknown>).field);
      const message = (detail as Record<string, unknown>).message as string;

      // Primeira mensagem por campo: o campo só tem um lugar para exibi-la.
      if (!(name in errors)) {
        errors[name] = message;
      }
    }
  }

  return errors;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string | undefined, options: ApiErrorOptions = {}) {
    const { status = 0, code = NETWORK_ERROR, details, cause } = options;

    super(message || FALLBACK_MESSAGE, cause === undefined ? undefined : { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fieldErrors = toFieldErrors(details);
  }

  /**
   * Constrói a falha a partir de uma resposta de erro do backend, que
   * sempre traz `{ error, code, details? }`.
   *
   * `body` pode ser nulo quando a resposta não tinha corpo legível — uma
   * resposta de erro nunca é tratada como sucesso, então nesse caso a
   * mensagem vem do próprio status HTTP.
   */
  static fromResponse(status: number, body: unknown): ApiError {
    const parsedBody = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

    const message =
      parsedBody && typeof parsedBody.error === 'string'
        ? parsedBody.error
        : `Falha na requisição (HTTP ${status}).`;

    return new ApiError(message, {
      status,
      code: (parsedBody && typeof parsedBody.code === 'string' && parsedBody.code) || `HTTP_${status}`,
      details: parsedBody ? parsedBody.details : undefined,
    });
  }

  /** Falha sem resposta: sem conectividade, DNS, origem bloqueada. */
  static network(cause: unknown): ApiError {
    return new ApiError('Não foi possível conectar ao backend.', {
      code: NETWORK_ERROR,
      cause,
    });
  }

  /** Falha por tempo limite, com o limite em milissegundos. */
  static timeout(timeoutMs: number): ApiError {
    return new ApiError(`Tempo limite de ${timeoutMs / 1000}s excedido.`, { code: TIMEOUT });
  }

  /** Verdadeiro quando o backend recusou por autenticação. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Verdadeiro quando a falha foi de conexão, e não uma recusa do backend. */
  get isConnectionFailure(): boolean {
    return this.code === NETWORK_ERROR || this.code === TIMEOUT;
  }
}

export default ApiError;
