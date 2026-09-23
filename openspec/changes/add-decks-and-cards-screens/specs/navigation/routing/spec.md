## MODIFIED Requirements

### Requirement: Duas pilhas de navegação, escolhidas pela sessão

O navegador raiz SHALL escolher entre duas pilhas de acordo com o estado
da sessão: uma pilha pública (entrada, cadastro, diagnóstico) para quem
não está autenticado, e uma pilha autenticada (lista de baralhos, detalhe
de um baralho, adicionar card) para quem está.

Enquanto a sessão está sendo determinada, nenhuma das duas pilhas SHALL
ser exibida — a spec `auth/session` define esse estado; aqui só interessa
que a navegação não decide entre pública e autenticada até ele resolver.

#### Scenario: Sem sessão
- **WHEN** a sessão é "sem sessão"
- **THEN** o navegador raiz exibe a pilha pública, começando pela tela de
  entrada

#### Scenario: Com sessão
- **WHEN** a sessão tem um usuário autenticado
- **THEN** o navegador raiz exibe a pilha autenticada, começando pela
  lista de baralhos

#### Scenario: Sessão encerrada durante o uso
- **WHEN** a sessão passa de autenticada para "sem sessão" (saída, ou
  perda de sessão detectada pelo backend)
- **THEN** o navegador raiz troca da pilha autenticada para a pública,
  começando pela tela de entrada

#### Scenario: Navegar da lista para o detalhe de um baralho
- **WHEN** um baralho é selecionado na lista
- **THEN** a pilha autenticada navega para a tela de detalhe daquele
  baralho

#### Scenario: Navegar para adicionar card
- **WHEN** a ação de adicionar card é acionada a partir do detalhe de um
  baralho
- **THEN** a pilha autenticada navega para a tela de adicionar card,
  associada àquele baralho
