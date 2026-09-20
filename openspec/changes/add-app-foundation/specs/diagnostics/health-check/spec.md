## Purpose

Define a tela de diagnóstico do backend — o mesmo papel que a
`DiagnosticsPage` cumpre no `mem-words-frontend`: permitir descobrir que o
backend está inacessível, inclusive quando isso impede o próprio login,
sem exigir sessão para ser usada.

## ADDED Requirements

### Requirement: Tela de diagnóstico pública

A tela de diagnóstico SHALL ser alcançável sem nenhuma sessão, e SHALL
consultar o endpoint de saúde do backend (`GET /health`) ao ser aberta.

#### Scenario: Backend acessível
- **WHEN** a tela de diagnóstico é aberta e o backend responde com sucesso
- **THEN** a tela indica que o backend está acessível

#### Scenario: Backend inacessível
- **WHEN** a tela de diagnóstico é aberta e a chamada falha (rede, tempo
  limite ou erro do backend)
- **THEN** a tela indica que o backend está inacessível, com o motivo da
  falha

#### Scenario: Verificação em curso
- **WHEN** a chamada ao endpoint de saúde ainda não retornou
- **THEN** a tela indica que a verificação está em andamento, distinto dos
  estados de sucesso e falha

### Requirement: Repetir a verificação

A tela SHALL oferecer uma ação para repetir a verificação de saúde a
qualquer momento, sem precisar reabrir a tela.

#### Scenario: Repetir depois de uma falha
- **WHEN** a ação de verificar novamente é acionada depois de uma falha
- **THEN** o estado volta a "verificando" e o resultado da nova tentativa
  substitui o anterior

### Requirement: Informação da configuração exibida

A tela SHALL exibir, para diagnóstico, o endereço do backend configurado
para a variante em execução do app.

#### Scenario: Endereço visível
- **WHEN** a tela de diagnóstico é exibida
- **THEN** o endereço do backend configurado aparece na tela
