jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000/',
        apiUrlSource: 'padrão de development',
      },
    },
  },
}));

import { ApiError } from '../ApiError';
import { API_URL, request } from '../client';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  globalThis.fetch = jest.fn().mockResolvedValue(response as Response);
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('API_URL', () => {
  it('remove a barra final da URL configurada', () => {
    expect(API_URL).toBe('http://localhost:3000');
  });
});

describe('request', () => {
  it('resolve com o corpo em JSON de uma resposta bem-sucedida', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
    });

    const result = await request<{ ok: boolean }>('/health');

    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('trata resposta 204 como sucesso sem corpo', async () => {
    mockFetchOnce({ ok: true, status: 204, text: () => Promise.resolve('') });

    await expect(request('/logout', { method: 'POST' })).resolves.toBeNull();
  });

  it('lança ApiError com o formato do backend quando a resposta falha', async () => {
    mockFetchOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve(JSON.stringify({ error: 'Dados inválidos.', code: 'VALIDATION_ERROR' })),
    });

    await expect(request('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('lança ApiError de rede quando o fetch falha', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    const error = await request('/health').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isConnectionFailure).toBe(true);
  });

  it('lança ApiError de tempo limite quando a requisição excede o prazo', async () => {
    jest.useFakeTimers();

    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        }),
    );

    const promise = request('/health', { timeoutMs: 1000 });
    const assertion = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });

    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});
