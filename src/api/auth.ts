import { request } from './client';

/**
 * Chamadas de autenticação do app — mobile login/refresh/logout devolvem
 * o refresh token no corpo (ver design.md), diferente do fluxo web por
 * cookie.
 */

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  currentStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface LoginResult extends AuthTokens {
  user: PublicUser;
}

/** `POST /auth/register` — sem token no retorno, mesma rota do cliente web. */
export function register(input: RegisterInput): Promise<{ user: PublicUser }> {
  return request('/auth/register', { method: 'POST', body: input });
}

export interface LoginInput {
  email: string;
  password: string;
}

/** `POST /auth/mobile/login` — refresh token no corpo, sem `Set-Cookie`. */
export function login(input: LoginInput): Promise<LoginResult> {
  return request('/auth/mobile/login', { method: 'POST', body: input });
}

/** `POST /auth/mobile/refresh` — usado diretamente por `client.ts`; exportado para reuso e testes. */
export function refresh(refreshToken: string): Promise<AuthTokens> {
  return request('/auth/mobile/refresh', { method: 'POST', body: { refreshToken } });
}

/** `POST /auth/mobile/logout` — idempotente, nunca revela se o token existia. */
export function logout(refreshToken?: string): Promise<void> {
  return request('/auth/mobile/logout', { method: 'POST', body: { refreshToken } });
}
