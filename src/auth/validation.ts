/**
 * Validação no cliente, espelhando as regras que o backend aplica.
 *
 * Serve para dar resposta imediata e evitar uma ida ao servidor por um
 * campo vazio — não é a garantia. A recusa do backend continua sendo a
 * palavra final. Texto fixo em português (ver design.md, i18n é
 * Non-Goal desta change).
 */

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const EMAIL_MAX = 255;
export const PASSWORD_MIN = 8;
/** O bcrypt trunca em 72 bytes, então o backend recusa acima disso. */
export const PASSWORD_MAX = 72;

export function validateName(value: string): string | null {
  const name = value.trim();

  if (name === '') {
    return 'Informe seu nome.';
  }

  if (name.length < NAME_MIN) {
    return `O nome precisa ter pelo menos ${NAME_MIN} caracteres.`;
  }

  if (name.length > NAME_MAX) {
    return `O nome pode ter no máximo ${NAME_MAX} caracteres.`;
  }

  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();

  if (email === '') {
    return 'Informe seu e-mail.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Informe um e-mail válido.';
  }

  if (email.length > EMAIL_MAX) {
    return `O e-mail pode ter no máximo ${EMAIL_MAX} caracteres.`;
  }

  return null;
}

/** Senha do cadastro: regras de tamanho do backend. */
export function validateNewPassword(value: string): string | null {
  if (value === '') {
    return 'Informe uma senha.';
  }

  if (value.length < PASSWORD_MIN) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  }

  if (value.length > PASSWORD_MAX) {
    return `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`;
  }

  return null;
}

/**
 * Senha da entrada: só presença.
 *
 * Validar tamanho aqui não ajudaria em nada e daria uma pista sobre a
 * senha real — mesmo motivo pelo qual o backend também não valida força
 * no login.
 */
export function validateCurrentPassword(value: string): string | null {
  return value === '' ? 'Informe sua senha.' : null;
}

/** Descarta chaves sem mensagem, para que o mapa vazio signifique "válido". */
export function collect(candidates: Record<string, string | null>): Record<string, string> {
  return Object.fromEntries(Object.entries(candidates).filter((entry): entry is [string, string] => entry[1] !== null));
}
