## Purpose

Define as telas de baralhos e cards do app mobile — lista de baralhos,
detalhe de um baralho e adicionar card — quais campos existem, o que é
validado antes de chamar o backend, como cada recusa é comunicada, e o
que cada tela garante a quem usa VoiceOver ou TalkBack.

## ADDED Requirements

### Requirement: Lista dos próprios baralhos

A tela inicial da pilha autenticada SHALL exibir a lista de baralhos do
usuário autenticado: nome, par de idiomas (origem → destino), total de
cards, e um selo informando quantos cards estão prontos para revisão
agora ("N hoje") ou, sem nenhum pronto, que o baralho está "em dia".

Sem nenhum baralho, a tela SHALL informar isso e oferecer a ação de criar
o primeiro.

#### Scenario: Lista com baralhos
- **WHEN** o usuário autenticado tem ao menos um baralho
- **THEN** a tela exibe cada baralho com nome, idiomas, total de cards e
  o selo de prontidão

#### Scenario: Nenhum baralho ainda
- **WHEN** o usuário autenticado não tem nenhum baralho
- **THEN** a tela informa isso, sem tratar como erro
- **AND** oferece a ação de criar o primeiro baralho

#### Scenario: Selo de prontidão com cards prontos
- **WHEN** um baralho tem ao menos um card pronto para revisão agora
- **THEN** o selo mostra quantos estão prontos

#### Scenario: Selo de prontidão sem cards prontos
- **WHEN** um baralho não tem nenhum card pronto para revisão agora
- **THEN** o selo indica que o baralho está em dia

### Requirement: Criação de baralho

A tela de lista SHALL oferecer a ação de criar um baralho, com nome,
idioma de origem e idioma de destino, todos obrigatórios.

Antes de enviar, a tela SHALL validar os três campos localmente,
espelhando as regras do backend — presença e tamanho máximo do nome —, e
NÃO SHALL enviar a requisição quando a validação local recusar.

Criado com sucesso, o baralho novo SHALL aparecer na lista imediatamente,
sem exigir recarregar a tela.

#### Scenario: Criação com dados válidos
- **WHEN** nome, idioma de origem e idioma de destino são informados e
  aceitos
- **THEN** o baralho é criado e passa a aparecer na lista

#### Scenario: Campo obrigatório vazio
- **WHEN** a criação é acionada com nome ou algum dos idiomas vazio
- **THEN** o campo correspondente é marcado como inválido e nenhuma
  requisição é enviada

#### Scenario: Backend recusa o que passou na validação local
- **WHEN** os dados passam pela validação local e o backend os recusa
- **THEN** a recusa do backend é exibida, atribuída ao campo
  correspondente quando o backend indicar qual campo falhou

### Requirement: Detalhe de um baralho

A tela de detalhe de um baralho SHALL exibir seu nome, par de idiomas,
total de cards, a data de criação, e um resumo de quatro contagens por
status de card: Novos, Aprendendo, Maduros e Suspensos.

A tela SHALL oferecer editar (nome e/ou par de idiomas) e excluir o
próprio baralho.

Um baralho que não pertence ao usuário autenticado (403) ou que não
existe mais (404) SHALL ser tratado como indisponível, com uma mensagem
única para os dois casos e um caminho de volta à lista — sem distinguir
qual dos dois ocorreu.

#### Scenario: Detalhe carregado
- **WHEN** o baralho existe e pertence ao usuário autenticado
- **THEN** a tela exibe nome, idiomas, total de cards, data de criação e
  as quatro contagens por status

#### Scenario: Editar o baralho
- **WHEN** a edição é acionada e os novos valores são aceitos pelo
  backend
- **THEN** a tela passa a exibir os novos valores

#### Scenario: Excluir o baralho
- **WHEN** a exclusão é confirmada e aceita pelo backend
- **THEN** o usuário é levado de volta à lista, sem o baralho excluído

#### Scenario: Baralho indisponível
- **WHEN** o baralho não existe mais, ou pertence a outro usuário
- **THEN** a tela informa que o baralho não está disponível
- **AND** oferece um caminho de volta à lista

### Requirement: Lista de cards com busca e filtro

A tela de detalhe SHALL listar os cards do baralho, paginados, com
palavra, tradução, um selo do status calculado do card (novo, aprendendo,
difícil, maduro, em revisão, suspenso) e, quando houver, a data da
próxima revisão.

A tela SHALL oferecer buscar cards por palavra e filtrar por status,
combináveis entre si; os dois SHALL reiniciar a paginação para a primeira
página ao mudar.

#### Scenario: Lista paginada
- **WHEN** o baralho tem mais cards do que cabem em uma página
- **THEN** a tela oferece um jeito de avançar para as próximas páginas

#### Scenario: Buscar por palavra
- **WHEN** um termo de busca é informado
- **THEN** a lista mostra somente cards cuja palavra corresponde ao termo

#### Scenario: Filtrar por status
- **WHEN** um status é escolhido no filtro
- **THEN** a lista mostra somente cards com aquele status

#### Scenario: Busca ou filtro sem resultado
- **WHEN** a busca e/ou o filtro aplicados não correspondem a nenhum card
- **THEN** a tela informa que nenhum card foi encontrado, sem tratar como
  erro

### Requirement: Criar, editar e excluir card

O app SHALL oferecer uma tela para adicionar um card a um baralho, com
palavra e tradução obrigatórias, e classe gramatical, sinônimos, frase de
exemplo, tradução da frase e anotação pessoal opcionais.

A tela de detalhe SHALL oferecer editar e excluir cada card existente,
com os mesmos campos e a mesma validação local da criação.

#### Scenario: Criação com campos obrigatórios
- **WHEN** palavra e tradução são informadas e aceitas
- **THEN** o card é criado no baralho e passa a aparecer na lista

#### Scenario: Palavra ou tradução vazia
- **WHEN** a criação ou edição é acionada sem palavra ou sem tradução
- **THEN** o campo correspondente é marcado como inválido e nenhuma
  requisição é enviada

#### Scenario: Edição bem-sucedida
- **WHEN** os novos valores de um card são aceitos pelo backend
- **THEN** a lista passa a exibir os novos valores, sem recarregar a tela
  inteira

#### Scenario: Exclusão de card
- **WHEN** a exclusão de um card é confirmada e aceita pelo backend
- **THEN** o card some da lista

### Requirement: Suspender e reativar card

Cada card na lista SHALL oferecer suspender (quando ativo) ou reativar
(quando suspenso), atualizando seu selo de status e as contagens do
baralho ao concluir.

#### Scenario: Suspender um card ativo
- **WHEN** a suspensão de um card não suspenso é acionada e aceita pelo
  backend
- **THEN** o selo do card passa a "suspenso" e as contagens do baralho são
  atualizadas

#### Scenario: Reativar um card suspenso
- **WHEN** a reativação de um card suspenso é acionada e aceita pelo
  backend
- **THEN** o card volta a mostrar seu status calculado, e as contagens do
  baralho são atualizadas

### Requirement: Telas acessíveis por leitor de tela

Cada campo de formulário destas telas SHALL ter um rótulo acessível, e
cada erro de campo SHALL estar incluído nesse rótulo — VoiceOver e
TalkBack não têm o equivalente de `<label for>` do HTML, então a
associação visual não basta.

#### Scenario: Rótulo alcançável por leitor de tela
- **WHEN** um leitor de tela está ativo e o foco chega a um campo destas
  telas
- **THEN** o rótulo do campo é anunciado

#### Scenario: Erro incluído no rótulo acessível
- **WHEN** um campo é marcado como inválido
- **THEN** o rótulo acessível do campo passa a incluir a mensagem de erro
