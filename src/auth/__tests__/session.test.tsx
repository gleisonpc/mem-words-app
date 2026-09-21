import { renderHook } from '@testing-library/react-native';

import { useSession } from '../session';

it('useSession lança um erro claro quando usado fora de SessionProvider', async () => {
  await expect(renderHook(() => useSession())).rejects.toThrow(
    'useSession deve ser usado dentro de <SessionProvider>.',
  );
});
