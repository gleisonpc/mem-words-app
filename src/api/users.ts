import type { PublicUser } from './auth';
import { request } from './client';

/** `GET /users/me` — usado na restauração de sessão para confirmar a identidade. */
export function getMe(): Promise<{ user: PublicUser }> {
  return request('/users/me', { auth: true });
}
