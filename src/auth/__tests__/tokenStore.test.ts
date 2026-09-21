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

import * as SecureStore from 'expo-secure-store';

import {
  __resetForTests,
  clearRefreshToken,
  getAccessToken,
  getOrCreateRefreshPromise,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../tokenStore';

beforeEach(async () => {
  __resetForTests();
  jest.clearAllMocks();
  await clearRefreshToken();
  jest.clearAllMocks();
});

describe('access token', () => {
  it('fica só em memória, nunca no armazenamento seguro', async () => {
    setAccessToken('abc123');
    expect(getAccessToken()).toBe('abc123');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('refresh token', () => {
  it('grava e lê pelo armazenamento seguro', async () => {
    await setRefreshToken('r-1');
    await expect(getRefreshToken()).resolves.toBe('r-1');
  });

  it('remove o token guardado', async () => {
    await setRefreshToken('r-1');
    await clearRefreshToken();
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('trata falha de leitura do armazenamento como ausência de token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('não lança quando a escrita falha', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    await expect(setRefreshToken('r-1')).resolves.toBeUndefined();
  });

  it('não lança quando a remoção falha', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    await expect(clearRefreshToken()).resolves.toBeUndefined();
  });
});

describe('getOrCreateRefreshPromise', () => {
  it('convergem chamadas concorrentes em uma única invocação da factory', async () => {
    const factory = jest.fn().mockResolvedValue('novo-token');

    const [a, b] = await Promise.all([getOrCreateRefreshPromise(factory), getOrCreateRefreshPromise(factory)]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toBe('novo-token');
    expect(b).toBe('novo-token');
  });

  it('permite uma nova renovação depois que a anterior termina', async () => {
    const factory = jest.fn().mockResolvedValue('t');

    await getOrCreateRefreshPromise(factory);
    await getOrCreateRefreshPromise(factory);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('libera a promessa mesmo quando a factory falha', async () => {
    const failing = jest.fn().mockRejectedValueOnce(new Error('nope'));
    const succeeding = jest.fn().mockResolvedValue('t');

    await expect(getOrCreateRefreshPromise(failing)).rejects.toThrow('nope');
    await expect(getOrCreateRefreshPromise(succeeding)).resolves.toBe('t');
  });
});
