jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiUrl: 'http://localhost:3000', apiUrlSource: 'padrão de development' } } },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

import { getStateFromPath } from '@react-navigation/native';

import { linking } from '../RootNavigator';

describe('linking', () => {
  it('resolve baralhos/:deckId para DeckDetail com o parâmetro', () => {
    const state = getStateFromPath('baralhos/abc123', linking.config);

    expect(state?.routes[0]?.name).toBe('DeckDetail');
    expect(state?.routes[0]?.params).toEqual({ deckId: 'abc123' });
  });

  it('resolve baralhos/:deckId/cards/novo para AddCard com o parâmetro', () => {
    const state = getStateFromPath('baralhos/abc123/cards/novo', linking.config);

    expect(state?.routes[0]?.name).toBe('AddCard');
    expect(state?.routes[0]?.params).toEqual({ deckId: 'abc123' });
  });

  it('continua resolvendo as rotas já existentes', () => {
    expect(getStateFromPath('entrar', linking.config)?.routes[0]?.name).toBe('Login');
    expect(getStateFromPath('cadastro', linking.config)?.routes[0]?.name).toBe('Register');
    expect(getStateFromPath('', linking.config)?.routes[0]?.name).toBe('Home');
    expect(getStateFromPath('diagnostico', linking.config)?.routes[0]?.name).toBe('Diagnostics');
  });

  it('rota desconhecida cai em NotFound', () => {
    expect(getStateFromPath('nada-registrado/aqui', linking.config)?.routes[0]?.name).toBe('NotFound');
  });
});
