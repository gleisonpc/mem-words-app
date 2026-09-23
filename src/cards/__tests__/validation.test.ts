import { validateTranslation, validateWord } from '../validation';

describe('validateWord', () => {
  it('recusa palavra vazia', () => {
    expect(validateWord('')).not.toBeNull();
    expect(validateWord('   ')).not.toBeNull();
  });

  it('aceita palavra presente', () => {
    expect(validateWord('casa')).toBeNull();
  });
});

describe('validateTranslation', () => {
  it('recusa tradução vazia', () => {
    expect(validateTranslation('')).not.toBeNull();
    expect(validateTranslation('   ')).not.toBeNull();
  });

  it('aceita tradução presente', () => {
    expect(validateTranslation('house')).toBeNull();
  });
});
