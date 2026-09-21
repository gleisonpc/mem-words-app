import { ApiError, NETWORK_ERROR, TIMEOUT } from '../ApiError';

describe('ApiError.fromResponse', () => {
  it('carrega mensagem, código e campos recusados do corpo do backend', () => {
    const error = ApiError.fromResponse(422, {
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: [
        { field: 'body.email', message: 'E-mail inválido.' },
        { field: 'body.password', message: 'Senha muito curta.' },
      ],
    });

    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Dados inválidos.');
    expect(error.fieldErrors).toEqual({
      email: 'E-mail inválido.',
      password: 'Senha muito curta.',
    });
  });

  it('usa mensagem genérica e o status HTTP quando o corpo não é reconhecível', () => {
    const error = ApiError.fromResponse(500, null);

    expect(error.status).toBe(500);
    expect(error.code).toBe('HTTP_500');
    expect(error.message).toBe('Falha na requisição (HTTP 500).');
    expect(error.fieldErrors).toEqual({});
  });

  it('nunca é reportada como sucesso', () => {
    const error = ApiError.fromResponse(400, 'não é json');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isConnectionFailure).toBe(false);
  });
});

describe('ApiError.network', () => {
  it('marca a falha como problema de conexão', () => {
    const error = ApiError.network(new TypeError('Failed to fetch'));

    expect(error.code).toBe(NETWORK_ERROR);
    expect(error.isConnectionFailure).toBe(true);
    expect(error.message).toBe('Não foi possível conectar ao backend.');
  });
});

describe('ApiError.timeout', () => {
  it('marca a falha como tempo limite excedido, com o limite na mensagem', () => {
    const error = ApiError.timeout(5000);

    expect(error.code).toBe(TIMEOUT);
    expect(error.isConnectionFailure).toBe(true);
    expect(error.message).toBe('Tempo limite de 5s excedido.');
  });
});

describe('ApiError.isUnauthorized', () => {
  it('é verdadeiro só para status 401', () => {
    expect(ApiError.fromResponse(401, null).isUnauthorized).toBe(true);
    expect(ApiError.fromResponse(403, null).isUnauthorized).toBe(false);
  });
});
