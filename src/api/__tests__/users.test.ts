jest.mock('../client', () => ({ request: jest.fn() }));

import { request } from '../client';
import { getMe } from '../users';

const requestMock = request as jest.Mock;

it('chama GET /users/me com auth: true', async () => {
  requestMock.mockResolvedValue({ user: { id: '1' } });

  await getMe();

  expect(requestMock).toHaveBeenCalledWith('/users/me', { auth: true });
});
