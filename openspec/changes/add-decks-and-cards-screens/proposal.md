## Why

O app hoje autentica (`add-auth-session`), mas a pilha autenticada só tem
uma `HomeScreen` provisória, sem nenhuma tela de produto. O backend já
expõe baralhos e cards por completo (`mem-words-backend`, `add-decks-and-
cards`, `add-deck-list-stats`, `add-card-suspension-and-difficulty`, todos
mergeados e estáveis) — falta o app mobile consumir isso. Sem essas telas,
quem entra no app não tem nada para fazer além de sair.

## What Changes

- `HomeScreen` provisória é substituída pela lista de baralhos do usuário:
  nome, par de idiomas, total de cards, um selo informativo de quantos
  cards estão prontos para revisão agora ("N hoje"/"em dia"), e a ação de
  criar um baralho (nome, idioma de origem, idioma de destino).
- Nova tela de detalhe de um baralho: editar/excluir o baralho, um resumo
  de quatro contagens por status (Novos/Aprendendo/Maduros/Suspensos),
  lista paginada de cards com busca por palavra e filtro por status,
  criar/editar/excluir card, e suspender/reativar um card.
- Nova tela de adicionar card, em rota própria (mesmo padrão do
  `mem-words-frontend`): palavra e tradução obrigatórias; classe
  gramatical, sinônimos, frase de exemplo, tradução da frase e anotação
  pessoal opcionais.
- Novos módulos `src/api/decks.ts` e `src/api/cards.ts`, reaproveitando
  `src/api/client.ts` (`request(path, { auth: true, ... })`) — sem cliente
  HTTP novo.
- **Fora de escopo, fica para changes futuras** (mesma ordem em que o
  `mem-words-frontend` implementou): sessão de revisão (a ação "Revisar"
  do selo/lista não navega a lugar nenhum ainda — ver design.md), sugestão
  de dicionário ao criar card, tela de perfil, painel inicial com saudação/
  sequência de dias/resumo agregado de revisão (`add-home-dashboard` no
  web — depende de `GET /reviews/today` e de uma tela de revisão que ainda
  não existe aqui).

## Capabilities

### New Capabilities

- `decks/screens`: as telas de lista de baralhos, detalhe de um baralho e
  adicionar card — campos, validação no cliente, paginação, busca/filtro,
  estados de carregamento e erro, e o que cada uma garante a quem usa
  VoiceOver/TalkBack. Mesmo nome de capability do `mem-words-frontend`
  (`decks/screens`), para manter os specs comparáveis lado a lado, com
  escopo adaptado a mobile (sem o painel inicial nem a ação de revisar,
  que não existem aqui ainda).

### Modified Capabilities

- `navigation/routing`: a pilha autenticada (`AppStack`) ganha as telas de
  detalhe de baralho e adicionar card, além da lista de baralhos
  substituindo a tela inicial provisória.

## Impact

- `src/screens/HomeScreen.tsx`: conteúdo trocado do placeholder para a
  lista de baralhos (mesmo arquivo, papel novo — sem renomear a rota
  `Home`, que a spec de navegação já usa como ponto de entrada da pilha
  autenticada).
- `src/screens/`: novas `DeckDetailScreen.tsx` e `AddCardScreen.tsx`.
- `src/api/decks.ts`, `src/api/cards.ts`: novos módulos, espelhando
  `mem-words-frontend/src/api/decks.js` e `cards.js`.
- `src/navigation/AppStack.tsx`: rotas novas (`DeckDetail`, `AddCard`),
  parâmetros tipados.
- `src/components/`: possível componente de campo/formulário
  compartilhado entre criar baralho, editar baralho e os campos de card
  (ver design.md) — decisão de design, não de proposta.
- Nenhuma dependência nova; nenhuma mudança no backend (todos os
  endpoints usados já existem e estão em produção).
