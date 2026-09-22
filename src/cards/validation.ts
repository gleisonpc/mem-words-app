/**
 * Validação no cliente, espelhando as regras que o backend aplica a
 * cards: palavra e tradução obrigatórias, os demais campos são livres
 * (sem regra além de existirem ou não).
 */

export function validateRequiredText(value: string, label: string): string | null {
  return value.trim() === '' ? `Informe ${label}.` : null;
}

export function validateWord(value: string): string | null {
  return validateRequiredText(value, 'a palavra');
}

export function validateTranslation(value: string): string | null {
  return validateRequiredText(value, 'a tradução');
}
