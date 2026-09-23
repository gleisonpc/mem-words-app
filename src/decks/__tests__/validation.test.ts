import { NAME_MAX, validateDeckName, validateLanguage } from '../validation';

describe('validateDeckName', () => {
  it('recusa nome vazio', () => {
    expect(validateDeckName('')).not.toBeNull();
    expect(validateDeckName('   ')).not.toBeNull();
  });

  it('recusa nome acima do máximo', () => {
    expect(validateDeckName('a'.repeat(NAME_MAX + 1))).not.toBeNull();
  });

  it('aceita nome válido', () => {
    expect(validateDeckName('Inglês')).toBeNull();
    expect(validateDeckName('a'.repeat(NAME_MAX))).toBeNull();
  });
});

describe('validateLanguage', () => {
  it('recusa idioma vazio', () => {
    expect(validateLanguage('')).not.toBeNull();
    expect(validateLanguage('  ')).not.toBeNull();
  });

  it('aceita idioma presente', () => {
    expect(validateLanguage('pt')).toBeNull();
  });
});
