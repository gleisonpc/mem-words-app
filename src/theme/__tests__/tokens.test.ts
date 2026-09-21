import { colors } from '../tokens';

describe('tokens de cor', () => {
  it('claro e escuro têm exatamente o mesmo conjunto de chaves', () => {
    expect(Object.keys(colors.light).sort()).toEqual(Object.keys(colors.dark).sort());
  });
});
