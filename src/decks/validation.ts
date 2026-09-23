/**
 * Validação no cliente, espelhando as regras que o backend aplica a
 * baralhos — mesmo padrão de `src/auth/validation.ts`. Serve para dar
 * resposta imediata; a recusa do backend continua sendo a palavra final.
 */

export const NAME_MAX = 120;

export function validateDeckName(value: string): string | null {
  const name = value.trim();

  if (name === '') {
    return 'Informe o nome do baralho.';
  }

  if (name.length > NAME_MAX) {
    return `O nome pode ter no máximo ${NAME_MAX} caracteres.`;
  }

  return null;
}

export function validateLanguage(value: string): string | null {
  return value.trim() === '' ? 'Informe o idioma.' : null;
}
