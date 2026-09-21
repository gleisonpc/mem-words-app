import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import * as authApi from '../api/auth';
import type { LoginInput, RegisterInput } from '../api/auth';
import * as usersApi from '../api/users';
import { ApiError } from '../api/ApiError';
import { renewTokens } from '../api/client';
import {
  AccountCreatedError,
  SessionContext,
  type SessionNotice,
  type SessionState,
  type SessionValue,
} from './session';
import * as tokenStore from './tokenStore';

const SESSION_EXPIRED_NOTICE: SessionNotice = {
  variant: 'warning',
  message: 'Sua sessão expirou. Entre novamente.',
};

function connectionNotice(message: string): SessionNotice {
  return { variant: 'danger', message: `Não foi possível confirmar sua sessão: ${message}` };
}

/**
 * Provedor da sessão do app — a única fonte de verdade, para as telas,
 * sobre quem está autenticado (ver spec `auth/session`).
 *
 * Nenhuma tela lê os tokens guardados para decidir se há sessão; elas
 * leem daqui, por `useSession()`.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: 'determinando' });
  const [notice, setNotice] = useState<SessionNotice | null>(null);

  // A sessão pode morrer longe de qualquer tela, dentro de uma renovação
  // recusada (ver client.ts, `performRenewal`). Esta é a única forma da
  // aplicação perceber isso.
  useEffect(
    () =>
      tokenStore.onSessionEnded((reason) => {
        setState({ status: 'sem-sessão' });
        setNotice(reason === 'session-expired' ? SESSION_EXPIRED_NOTICE : null);
      }),
    [],
  );

  // Restauração ao abrir o app: um token guardado não prova sessão válida
  // — ele é trocado por um novo access token e confirmado com
  // `GET /users/me` antes de qualquer tela ser tratada como autenticada
  // (ver design.md, "Restauração: trocar o token guardado, depois
  // confirmar").
  useEffect(() => {
    let active = true;

    async function restore() {
      const hasRefreshToken = (await tokenStore.getRefreshToken()) !== null;

      if (!hasRefreshToken) {
        if (active) {
          setState({ status: 'sem-sessão' });
        }
        return;
      }

      try {
        await renewTokens();
        const { user } = await usersApi.getMe();

        if (active) {
          setState({ status: 'autenticado', user });
        }
      } catch (error) {
        if (!active) {
          return;
        }

        // Backend fora do ar não é sessão inválida: o token guardado
        // permanece no Keychain/Keystore, e a próxima abertura tenta de
        // novo — só dizemos que a confirmação falhou por conexão.
        if (error instanceof ApiError && error.isConnectionFailure) {
          setState({ status: 'sem-sessão' });
          setNotice(connectionNotice(error.message));
          return;
        }

        // Sessão realmente inválida: `renewTokens()`/`getMe()` já
        // dispararam `tokenStore.clearSession`, cujo aviso (acima) já
        // atualiza o estado — nada mais a fazer aqui.
      }
    }

    restore();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const { user, accessToken, refreshToken } = await authApi.login({ email, password });

    tokenStore.setAccessToken(accessToken);
    await tokenStore.setRefreshToken(refreshToken);
    setState({ status: 'autenticado', user });
    setNotice(null);
  }, []);

  /**
   * Cadastra e entra em seguida — o backend não emite token no cadastro
   * (ver design.md, "Cadastro seguido de entrada"). Se a entrada falhar,
   * a conta já existe: a falha vira `AccountCreatedError`, para a tela
   * nunca sugerir repetir o cadastro.
   */
  const register = useCallback(
    async ({ name, email, password }: RegisterInput) => {
      await authApi.register({ name, email, password });

      try {
        await login({ email, password });
      } catch (error) {
        throw new AccountCreatedError(error);
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    const refreshToken = await tokenStore.getRefreshToken();

    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // Sair é uma intenção do usuário: um backend inacessível não pode
      // mantê-lo preso numa sessão que ele pediu para encerrar.
    }

    await tokenStore.clearSession('logout');
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<SessionValue>(
    () => ({ state, notice, dismissNotice, register, login, logout }),
    [state, notice, dismissNotice, register, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
