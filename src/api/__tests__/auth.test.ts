jest.mock('../client', () => ({ request: jest.fn() }));

import { login, logout, refresh, register } from '../auth';
import { request } from '../client';

const requestMock = request as jest.Mock;

beforeEach(() => {
  requestMock.mockReset();
});

describe('register', () => {
  it('chama POST /auth/register sem auth', async () => {
    requestMock.mockResolvedValue({ user: { id: '1' } });

    await register({ name: 'Ana', email: 'ana@example.com', password: 'senha1234' });

    expect(requestMock).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { name: 'Ana', email: 'ana@example.com', password: 'senha1234' },
    });
  });
});

describe('login', () => {
  it('chama POST /auth/mobile/login', async () => {
    requestMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: '15m', user: {} });

    await login({ email: 'ana@example.com', password: 'senha1234' });

    expect(requestMock).toHaveBeenCalledWith('/auth/mobile/login', {
      method: 'POST',
      body: { email: 'ana@example.com', password: 'senha1234' },
    });
  });
});

describe('refresh', () => {
  it('chama POST /auth/mobile/refresh com o token no corpo', async () => {
    requestMock.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2', tokenType: 'Bearer', expiresIn: '15m' });

    await refresh('r-1');

    expect(requestMock).toHaveBeenCalledWith('/auth/mobile/refresh', {
      method: 'POST',
      body: { refreshToken: 'r-1' },
    });
  });
});

describe('logout', () => {
  it('chama POST /auth/mobile/logout com o token quando presente', async () => {
    requestMock.mockResolvedValue(undefined);

    await logout('r-1');

    expect(requestMock).toHaveBeenCalledWith('/auth/mobile/logout', {
      method: 'POST',
      body: { refreshToken: 'r-1' },
    });
  });

  it('chama POST /auth/mobile/logout sem token quando não há nenhum', async () => {
    requestMock.mockResolvedValue(undefined);

    await logout();

    expect(requestMock).toHaveBeenCalledWith('/auth/mobile/logout', {
      method: 'POST',
      body: { refreshToken: undefined },
    });
  });
});
