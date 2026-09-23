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

jest.mock('../../auth/session', () => ({
  ...jest.requireActual('../../auth/session'),
  useSession: jest.fn(),
}));

jest.mock('../../api/decks', () => ({
  listDecks: jest.fn(() => Promise.resolve([])),
}));

import { render, screen } from '@testing-library/react-native';

import { useSession } from '../../auth/session';
import { ThemeProvider } from '../../theme/ThemeProvider';
import RootNavigator from '../RootNavigator';

const useSessionMock = useSession as jest.Mock;

const user = { id: '1', name: 'Ana', email: 'ana@example.com', currentStreak: 0, createdAt: '', updatedAt: '' };

function renderRoot() {
  return render(
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>,
  );
}

describe('RootNavigator', () => {
  it('"determinando" mostra a tela de carregamento, sem nenhuma pilha', async () => {
    useSessionMock.mockReturnValue({ state: { status: 'determinando' } });

    await renderRoot();

    expect(screen.queryByText('Entrar')).toBeNull();
    expect(screen.queryByText('Meus baralhos')).toBeNull();
  });

  it('"sem-sessão" mostra a pilha pública, começando pela entrada', async () => {
    useSessionMock.mockReturnValue({ state: { status: 'sem-sessão' }, notice: null });

    await renderRoot();

    expect(await screen.findByText('Ainda não tem conta? Criar conta')).toBeTruthy();
  });

  it('"autenticado" mostra a pilha autenticada, começando pela tela inicial', async () => {
    useSessionMock.mockReturnValue({ state: { status: 'autenticado', user }, logout: jest.fn() });

    await renderRoot();

    expect(await screen.findByText('Meus baralhos')).toBeTruthy();
  });
});
