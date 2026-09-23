jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiUrl: 'http://localhost:3000', apiUrlSource: 'padrão de development' } } },
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

import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as tokenStore from '../tokenStore';
import { SessionProvider } from '../SessionProvider';
import { useSession } from '../session';

function jsonResponse(status: number, body: unknown, ok = status >= 200 && status < 300) {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) } as Response;
}

const user = { id: '1', name: 'Ana', email: 'ana@example.com', currentStreak: 0, createdAt: '', updatedAt: '' };

beforeEach(async () => {
  tokenStore.__resetForTests();
  await tokenStore.clearRefreshToken();
  globalThis.fetch = jest.fn();
});

function renderSession() {
  return renderHook(() => useSession(), { wrapper: SessionProvider });
}

describe('restauração ao abrir o app', () => {
  it('sem token guardado, vai direto para "sem-sessão" sem chamar o backend', async () => {
    const { result } = await renderSession();

    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('com token guardado e backend aceitando, confirma como autenticado', async () => {
    await tokenStore.setRefreshToken('r-1');

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'a-1', refreshToken: 'r-2', tokenType: 'Bearer', expiresIn: '15m' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { user }));

    const { result } = await renderSession();

    await waitFor(() => expect(result.current.state.status).toBe('autenticado'));
    expect(result.current.state).toMatchObject({ status: 'autenticado', user });
  });

  it('token guardado recusado pelo backend descarta o token e vai para "sem-sessão"', async () => {
    await tokenStore.setRefreshToken('r-1');

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(401, { error: 'Refresh token inválido.', code: 'HTTP_401' }),
    );

    const { result } = await renderSession();

    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));
    await expect(tokenStore.getRefreshToken()).resolves.toBeNull();
    expect(result.current.notice?.variant).toBe('warning');
  });

  it('backend inacessível não descarta o token, e avisa por problema de conexão', async () => {
    await tokenStore.setRefreshToken('r-1');

    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    const { result } = await renderSession();

    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));
    await expect(tokenStore.getRefreshToken()).resolves.toBe('r-1');
    expect(result.current.notice?.variant).toBe('danger');
  });
});

describe('login', () => {
  it('autentica e guarda os tokens', async () => {
    const { result } = await renderSession();
    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(200, { user, accessToken: 'a-1', refreshToken: 'r-1', tokenType: 'Bearer', expiresIn: '15m' }),
    );

    await act(() => result.current.login({ email: 'ana@example.com', password: 'senha1234' }));

    await waitFor(() => expect(result.current.state).toMatchObject({ status: 'autenticado', user }));
    expect(tokenStore.getAccessToken()).toBe('a-1');
    await expect(tokenStore.getRefreshToken()).resolves.toBe('r-1');
  });
});

describe('register', () => {
  it('cadastra e entra em seguida', async () => {
    const { result } = await renderSession();
    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(201, { user }))
      .mockResolvedValueOnce(
        jsonResponse(200, { user, accessToken: 'a-1', refreshToken: 'r-1', tokenType: 'Bearer', expiresIn: '15m' }),
      );

    await act(() => result.current.register({ name: 'Ana', email: 'ana@example.com', password: 'senha1234' }));

    await waitFor(() => expect(result.current.state).toMatchObject({ status: 'autenticado', user }));
  });

  it('conta criada com entrada falhando vira AccountCreatedError, sem mudar o estado', async () => {
    const { result } = await renderSession();
    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(201, { user }))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Credenciais inválidas.', code: 'HTTP_401' }));

    await expect(
      act(() => result.current.register({ name: 'Ana', email: 'ana@example.com', password: 'senha1234' })),
    ).rejects.toMatchObject({ name: 'AccountCreatedError' });

    expect(result.current.state.status).toBe('sem-sessão');
  });
});

describe('logout', () => {
  it('chama /auth/mobile/logout com o token e descarta a sessão quando o backend confirma', async () => {
    const { result } = await renderSession();
    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));

    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('a-1');
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204, text: () => Promise.resolve('') });

    await act(() => result.current.logout());

    expect(tokenStore.getAccessToken()).toBeNull();
    await expect(tokenStore.getRefreshToken()).resolves.toBeNull();
    const [logoutUrl, logoutInit] = (globalThis.fetch as jest.Mock).mock.calls.at(-1)!;
    expect(logoutUrl).toContain('/auth/mobile/logout');
    expect(JSON.parse(logoutInit.body)).toEqual({ refreshToken: 'r-1' });
  });

  it('descarta a sessão mesmo quando o backend falha', async () => {
    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('a-1');

    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    const { result } = await renderSession();
    // Estado inicial de restauração usa o token — deixa a restauração assentar antes do teste do logout.
    await waitFor(() => expect(result.current.state.status).toBe('sem-sessão'));

    await tokenStore.setRefreshToken('r-1');
    tokenStore.setAccessToken('a-1');
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    await act(() => result.current.logout());

    expect(tokenStore.getAccessToken()).toBeNull();
    await expect(tokenStore.getRefreshToken()).resolves.toBeNull();
  });
});
