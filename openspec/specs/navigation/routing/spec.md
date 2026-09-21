# navigation/routing Specification

## Purpose

Define a casca de navegação do app — um único navegador raiz, do qual toda
tela alcançável descende, e a escolha entre pilha pública e autenticada
conforme o estado da sessão — para que as telas de produto encaixem sem
reestruturar a navegação já construída.

## Requirements

### Requirement: Navegador único na raiz do app

O app SHALL ter um único navegador raiz, do qual toda tela alcançável
descende. Nenhuma tela SHALL ser montada fora dessa hierarquia.

#### Scenario: Abertura do app
- **WHEN** o app é aberto
- **THEN** a primeira tela exibida é renderizada pelo navegador raiz

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

### Requirement: Rota desconhecida

Ao receber um link profundo (deep link) para um destino que não corresponde
a nenhuma tela registrada, o app SHALL exibir um estado informando que o
destino não existe, com um caminho de volta à tela inicial, em vez de
travar ou exibir uma tela em branco.

#### Scenario: Link profundo para destino inexistente
- **WHEN** o app é aberto por um link profundo que não corresponde a
  nenhuma tela registrada
- **THEN** o app exibe que o destino não foi encontrado
- **AND** oferece um caminho de volta à tela inicial
