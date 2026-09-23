import { createContext, useContext } from 'react';

import type { LoginInput, PublicUser, RegisterInput } from '../api/auth';

export type SessionState =
  | { status: 'determinando' }
  | { status: 'sem-sessão' }
  | { status: 'autenticado'; user: PublicUser };

/**
 * Aviso sobre algo que aconteceu fora de uma tela — sessão expirada,
 * restauração não confirmada por falta de backend. Ortogonal ao estado:
 * pode acompanhar "sem-sessão" sem que a causa seja credenciais erradas.
 */
export interface SessionNotice {
  variant: 'warning' | 'danger';
  message: string;
}

/**
 * Erro do cadastro cuja conta **foi** criada, mas cuja entrada seguinte
 * falhou. Repetir o cadastro devolveria `409` e deixaria a pessoa sem
 * entender por quê — a tela precisa diferenciar este caso.
 */
export class AccountCreatedError extends Error {
  constructor(cause: unknown) {
    super('Conta criada. Entre com suas credenciais.');
    this.name = 'AccountCreatedError';
    this.cause = cause;
  }
}

export interface SessionValue {
  state: SessionState;
  notice: SessionNotice | null;
  dismissNotice: () => void;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error('useSession deve ser usado dentro de <SessionProvider>.');
  }

  return context;
}
