import {
  EMAIL_MAX,
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  collect,
  validateCurrentPassword,
  validateEmail,
  validateName,
  validateNewPassword,
} from '../validation';

describe('validateName', () => {
  it('recusa vazio', () => {
    expect(validateName('')).not.toBeNull();
    expect(validateName('   ')).not.toBeNull();
  });

  it('recusa abaixo do mínimo', () => {
    expect(validateName('a'.repeat(NAME_MIN - 1))).not.toBeNull();
  });

  it('recusa acima do máximo', () => {
    expect(validateName('a'.repeat(NAME_MAX + 1))).not.toBeNull();
  });

  it('aceita nome válido', () => {
    expect(validateName('Ana')).toBeNull();
  });
});

describe('validateEmail', () => {
  it('recusa vazio', () => {
    expect(validateEmail('')).not.toBeNull();
  });

  it('recusa formato inválido', () => {
    expect(validateEmail('não-é-email')).not.toBeNull();
  });

  it('recusa acima do máximo', () => {
    const long = `${'a'.repeat(EMAIL_MAX)}@example.com`;
    expect(validateEmail(long)).not.toBeNull();
  });

  it('aceita e-mail válido', () => {
    expect(validateEmail('ana@example.com')).toBeNull();
  });
});

describe('validateNewPassword', () => {
  it('recusa vazio', () => {
    expect(validateNewPassword('')).not.toBeNull();
  });

  it('recusa abaixo do mínimo', () => {
    expect(validateNewPassword('a'.repeat(PASSWORD_MIN - 1))).not.toBeNull();
  });

  it('recusa acima do máximo', () => {
    expect(validateNewPassword('a'.repeat(PASSWORD_MAX + 1))).not.toBeNull();
  });

  it('aceita senha válida', () => {
    expect(validateNewPassword('senha1234')).toBeNull();
  });
});

describe('validateCurrentPassword', () => {
  it('recusa só quando vazia', () => {
    expect(validateCurrentPassword('')).not.toBeNull();
    expect(validateCurrentPassword('qualquer coisa')).toBeNull();
  });
});

describe('collect', () => {
  it('descarta chaves sem mensagem', () => {
    expect(collect({ email: null, password: 'obrigatório' })).toEqual({ password: 'obrigatório' });
  });

  it('mapa vazio quando tudo é válido', () => {
    expect(collect({ email: null, password: null })).toEqual({});
  });
});
