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

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();

  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

import * as tokenStore from '../../auth/tokenStore';
import { request } from '../client';

function jsonResponse(status: number, body: unknown, ok = status >= 200 && status < 300) {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) } as Response;
}

beforeEach(async () => {
  tokenStore.__resetForTests();
  await tokenStore.clearRefreshToken();
});

describe('request com auth: true', () => {
  it('envia Authorization quando há access token em memória', async () => {
    tokenStore.setAccessToken('a-1');
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));

    await request('/users/me', { auth: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer a-1' }) }),
    );
  });

  it('não envia Authorization quando auth não é pedido', async () => {
    tokenStore.setAccessToken('a-1');
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));

    await request('/health');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('renova e repete a requisição original quando o token expirou', async () => {
    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('expired');

    globalThis.fetch = jest
      .fn()
      // 1ª tentativa: 401 (token expirado)
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado.', code: 'HTTP_401' }))
      // renovação: sucesso
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'a-2', refreshToken: 'r-2', tokenType: 'Bearer', expiresIn: '15m' }))
      // repetição: sucesso
      .mockResolvedValueOnce(jsonResponse(200, { user: { id: '1' } }));

    const result = await request('/users/me', { auth: true });

    expect(result).toEqual({ user: { id: '1' } });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    expect(tokenStore.getAccessToken()).toBe('a-2');
    await expect(tokenStore.getRefreshToken()).resolves.toBe('r-2');

    const [renewalUrl, renewalInit] = (globalThis.fetch as jest.Mock).mock.calls[1];
    expect(renewalUrl).toContain('/auth/mobile/refresh');
    expect(JSON.parse(renewalInit.body)).toEqual({ refreshToken: 'r-1' });
  });

  it('encerra a sessão local quando a renovação é recusada', async () => {
    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('expired');

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado.', code: 'HTTP_401' }))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Refresh token inválido.', code: 'HTTP_401' }));

    await expect(request('/users/me', { auth: true })).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });

    expect(tokenStore.getAccessToken()).toBeNull();
    await expect(tokenStore.getRefreshToken()).resolves.toBeNull();
  });

  it('não tenta renovar de novo quando a requisição repetida também falha por autenticação', async () => {
    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('expired');

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado.', code: 'HTTP_401' }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'a-2', refreshToken: 'r-2', tokenType: 'Bearer', expiresIn: '15m' }))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Ainda recusado.', code: 'HTTP_401' }));

    await expect(request('/users/me', { auth: true })).rejects.toMatchObject({ status: 401, code: 'HTTP_401' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('sem refresh token guardado, encerra a sessão sem chamar o backend para renovar', async () => {
    tokenStore.setAccessToken('expired');

    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado.', code: 'HTTP_401' }));

    await expect(request('/users/me', { auth: true })).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('duas requisições que expiram juntas disparam uma única renovação', async () => {
    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('expired');

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: 'x', code: 'HTTP_401' }))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'x', code: 'HTTP_401' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'a-2', refreshToken: 'r-2', tokenType: 'Bearer', expiresIn: '15m' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: 1 }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: 2 }));

    const [first, second] = await Promise.all([
      request('/a', { auth: true }),
      request('/b', { auth: true }),
    ]);

    expect(first).toEqual({ ok: 1 });
    expect(second).toEqual({ ok: 2 });

    const refreshCalls = (globalThis.fetch as jest.Mock).mock.calls.filter(([url]) =>
      String(url).includes('/auth/mobile/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('endpoint público não aciona renovação mesmo recebendo 401', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'Credenciais inválidas.', code: 'HTTP_401' }));

    await expect(request('/auth/mobile/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
