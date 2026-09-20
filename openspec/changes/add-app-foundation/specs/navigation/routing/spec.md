## Purpose

Define a casca de navegação do app nesta etapa inicial — antes de existir
sessão — para que haja um único navegador raiz sobre o qual as changes
seguintes (autenticação, baralhos, revisão, perfil) encaixam suas telas sem
reestruturar a navegação já construída.

## ADDED Requirements

### Requirement: Navegador único na raiz do app

O app SHALL ter um único navegador raiz, do qual toda tela alcançável
descende. Nenhuma tela SHALL ser montada fora dessa hierarquia.

#### Scenario: Abertura do app
- **WHEN** o app é aberto
- **THEN** a primeira tela exibida é renderizada pelo navegador raiz

### Requirement: Tela inicial alcançável sem sessão

Nesta etapa, sem nenhum conceito de sessão implementado ainda, o app SHALL
abrir diretamente em uma tela inicial, sem exigir nenhuma chamada ao
backend para ser exibida.

A tela inicial SHALL oferecer um caminho visível até a tela de diagnóstico
do backend.

#### Scenario: Tela inicial não depende do backend
- **WHEN** o app é aberto sem conexão com o backend
- **THEN** a tela inicial ainda assim é exibida
- **AND** o caminho até o diagnóstico continua alcançável

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
