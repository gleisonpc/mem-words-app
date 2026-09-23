## REMOVED Requirements

### Requirement: Tela inicial alcançável sem sessão

**Reason**: esta change introduz sessão; a tela inicial passa a viver na
pilha autenticada (ver "Duas pilhas de navegação, escolhidas pela sessão",
abaixo) e deixa de ser alcançável sem login.

**Migration**: quem chega sem sessão vê a tela de entrada, não mais a
inicial. O caminho até o diagnóstico continua existindo, mas a partir da
pilha pública — ver "Diagnóstico alcançável nas duas pilhas".

## ADDED Requirements

### Requirement: Duas pilhas de navegação, escolhidas pela sessão

O navegador raiz SHALL escolher entre duas pilhas de acordo com o estado
da sessão: uma pilha pública (entrada, cadastro, diagnóstico) para quem
não está autenticado, e uma pilha autenticada (hoje só a tela inicial,
ponto de encaixe para as telas de produto das changes seguintes) para
quem está.

Enquanto a sessão está sendo determinada, nenhuma das duas pilhas SHALL
ser exibida — a spec `auth/session` define esse estado; aqui só interessa
que a navegação não decide entre pública e autenticada até ele resolver.

#### Scenario: Sem sessão
- **WHEN** a sessão é "sem sessão"
- **THEN** o navegador raiz exibe a pilha pública, começando pela tela de
  entrada

#### Scenario: Com sessão
- **WHEN** a sessão tem um usuário autenticado
- **THEN** o navegador raiz exibe a pilha autenticada, começando pela tela
  inicial

#### Scenario: Sessão encerrada durante o uso
- **WHEN** a sessão passa de autenticada para "sem sessão" (saída, ou
  perda de sessão detectada pelo backend)
- **THEN** o navegador raiz troca da pilha autenticada para a pública,
  começando pela tela de entrada

### Requirement: Diagnóstico alcançável nas duas pilhas

A tela de diagnóstico SHALL continuar pública e alcançável tanto com
quanto sem sessão — é a ferramenta para descobrir que o backend está fora
do ar, inclusive quando isso impede a própria entrada, e reduzir seu
alcance a só uma das pilhas a tornaria inútil no momento em que mais
importa.

#### Scenario: Diagnóstico sem sessão
- **WHEN** a sessão é "sem sessão"
- **THEN** a tela de diagnóstico continua alcançável a partir da pilha
  pública

#### Scenario: Diagnóstico com sessão
- **WHEN** a sessão tem um usuário autenticado
- **THEN** a tela de diagnóstico continua alcançável a partir da pilha
  autenticada
