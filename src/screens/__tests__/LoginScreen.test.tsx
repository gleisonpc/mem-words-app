jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../auth/session', () => ({
  ...jest.requireActual('../../auth/session'),
  useSession: jest.fn(),
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiError } from '../../api/ApiError';
import { useSession } from '../../auth/session';
import type { PublicStackParamList } from '../../navigation/PublicStack';
import { ThemeProvider } from '../../theme/ThemeProvider';
import LoginScreen from '../LoginScreen';

const useSessionMock = useSession as jest.Mock;
const navigation = { navigate: jest.fn() } as unknown as NativeStackScreenProps<PublicStackParamList, 'Login'>['navigation'];
const route = { key: 'login', name: 'Login' as const, params: undefined };

async function renderScreen() {
  return render(
    <ThemeProvider>
      <LoginScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useSessionMock.mockReset();
});

it('não envia quando os campos estão vazios, e marca os erros', async () => {
  const login = jest.fn();
  useSessionMock.mockReturnValue({ login });
  await renderScreen();

  await fireEvent.press(screen.getAllByText('Entrar')[1]);

  expect(login).not.toHaveBeenCalled();
});

it('exibe o erro de campo devolvido pelo backend no campo correspondente', async () => {
  const login = jest.fn().mockRejectedValue(
    new ApiError('Dados inválidos.', {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ field: 'body.email', message: 'E-mail inválido.' }],
    }),
  );
  useSessionMock.mockReturnValue({ login });
  await renderScreen();

  await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@example.com');
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'senha1234');
  await fireEvent.press(screen.getAllByText('Entrar')[1]);

  expect(await screen.findByLabelText('E-mail. E-mail inválido.')).toBeTruthy();
});

it('navega para o cadastro', async () => {
  useSessionMock.mockReturnValue({ login: jest.fn() });
  await renderScreen();

  await fireEvent.press(screen.getByText('Ainda não tem conta? Criar conta'));

  expect(navigation.navigate).toHaveBeenCalledWith('Register');
});
