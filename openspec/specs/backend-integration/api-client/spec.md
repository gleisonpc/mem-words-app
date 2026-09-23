# backend-integration/api-client Specification

## Purpose

Define como o app conversa com o `mem-words-backend` — o endereço usado, o
formato das requisições e respostas, o limite de espera e a tradução de
qualquer falha (do backend, da rede ou do tempo limite) em um resultado
único que as telas sabem exibir. Esta capability cobre apenas o transporte;
o envio de token de sessão e a renovação automática pertencem a
`auth/session`.

## Requirements

### Requirement: URL base única e configurável

Toda requisição ao backend SHALL ser construída a partir de uma URL base
resolvida pela configuração do app em tempo de build, por variante de
ambiente (desenvolvimento, preview, produção). Nenhum ponto do app SHALL
conter endereço de backend literal fora dessa configuração.

Trocar o backend de destino SHALL exigir apenas mudar essa configuração, sem
tocar em nenhuma tela ou chamada.

#### Scenario: Chamada usa a URL configurada
- **WHEN** qualquer parte do app chama um endpoint do backend
- **THEN** a requisição parte da URL base configurada para a variante em
  execução
- **AND** o caminho do endpoint é concatenado sem barra duplicada

#### Scenario: Endereço não aparece nas telas
- **WHEN** o código do app é inspecionado fora da configuração
- **THEN** nenhum endereço de backend literal é encontrado

### Requirement: Formato de requisição e resposta

O cliente SHALL enviar e aceitar JSON, declarando o tipo de conteúdo quando
há corpo e o tipo aceito em toda requisição.

Respostas sem corpo SHALL ser tratadas como sucesso sem dados, e não como
falha de leitura.

#### Scenario: Requisição com corpo
- **WHEN** uma operação envia dados ao backend
- **THEN** o corpo é serializado como JSON
- **AND** o tipo de conteúdo é declarado como JSON

#### Scenario: Resposta sem corpo
- **WHEN** o backend responde com sucesso e sem corpo
- **THEN** a operação é considerada bem-sucedida
- **AND** nenhum erro de leitura é reportado

### Requirement: Tempo limite em toda requisição

Toda requisição SHALL ter um limite de espera, configurável por chamada com
um padrão razoável. Uma requisição que exceda esse limite SHALL ser
abortada e reportada como falha de conexão, com o motivo explicitando que o
tempo limite foi atingido.

#### Scenario: Backend não responde
- **WHEN** o backend não responde dentro do limite de espera
- **THEN** a requisição é abortada
- **AND** a falha informa que o tempo limite foi excedido

### Requirement: Tradução do formato de erro do backend

O backend responde a erros com um corpo que traz uma mensagem, um código
estável e, para dados inválidos, uma lista de campos com o motivo de cada
recusa (`{ error, code, details }`).

O cliente SHALL traduzir essa resposta em uma falha única que preserve os
três elementos, de modo que a tela possa exibir a mensagem geral e marcar
cada campo recusado.

Uma resposta de erro sem corpo reconhecível SHALL resultar em falha com
mensagem genérica, nunca em sucesso.

#### Scenario: Dados inválidos
- **WHEN** o backend recusa a requisição por dados inválidos
- **THEN** a falha carrega a mensagem geral, o código do erro e a lista de
  campos recusados com seus motivos

#### Scenario: Erro sem corpo reconhecível
- **WHEN** o backend responde com código de erro e corpo vazio ou ilegível
- **THEN** a falha carrega uma mensagem genérica e o código HTTP da resposta
- **AND** a operação não é reportada como sucesso

### Requirement: Falha de rede é indistinguível de erro de aplicação para a tela

Falha de rede (sem conectividade, DNS, backend fora do ar) e tempo limite
SHALL ser reportadas com a mesma forma de falha usada para erros do
backend, para que nenhuma tela precise distinguir a origem do problema para
exibi-lo.

A falha SHALL, ainda assim, carregar informação suficiente para
diagnóstico — o motivo original quando disponível.

#### Scenario: Sem conectividade
- **WHEN** o dispositivo está sem conexão de rede ao chamar o backend
- **THEN** a falha é reportada como problema de conexão
- **AND** a tela a exibe pelo mesmo caminho de qualquer outra falha
