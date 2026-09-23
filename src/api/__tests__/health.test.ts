jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
        apiUrlSource: 'padrão de development',
      },
    },
  },
}));

import { checkHealth } from '../health';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkHealth', () => {
  it('resolve ok quando o backend responde com sucesso', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ status: 'up' })),
    } as Response);

    const result = await checkHealth();

    expect(result.ok).toBe(true);
    expect(result.detail).toContain('up');
  });

  it('resolve com falha (não lança) quando o backend está fora do ar', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    const result = await checkHealth();

    expect(result.ok).toBe(false);
    expect(result.detail).toBe('Não foi possível conectar ao backend.');
  });

  it('resolve com falha quando o backend responde com erro', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(''),
    } as Response);

    const result = await checkHealth();

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('503');
  });
});
