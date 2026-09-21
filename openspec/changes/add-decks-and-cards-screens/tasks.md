## 1. API de baralhos e cards

- [ ] 1.1 Criar `src/api/decks.ts`: `listDecks()`, `createDeck(input)`,
      `getDeck(id)`, `updateDeck(id, input)`, `deleteDeck(id)`, tipos
      `Deck`/`CreateDeckInput`/`UpdateDeckInput` batendo com o contrato do
      design.md — verificar com testes unitários (mock de
      `client.request`) para cada função
- [ ] 1.2 Criar `src/api/cards.ts`: `listCards(deckId, { page, pageSize,
      q, status })`, `createCard(deckId, input)`, `updateCard(id, input)`,
      `deleteCard(id)`, `suspendCard(id)`, `unsuspendCard(id)`, tipos
      `Card`/`CardStatus` (union dos seis valores) — verificar com testes
      unitários cobrindo query string montada corretamente (com e sem
      `q`/`status`)

## 2. Validação

- [ ] 2.1 Criar `src/decks/validation.ts`: nome do baralho (presença,
      tamanho máximo) e idioma (presença), espelhando
      `mem-words-frontend/src/pages/HomePage.jsx` — verificar com testes
      unitários
- [ ] 2.2 Criar `src/cards/validation.ts`: palavra e tradução obrigatórias
      (campos opcionais não têm regra além de existir) — verificar com
      testes unitários

## 3. Campos de card compartilhados

- [ ] 3.1 Criar `src/cards/CardFields.tsx`: os sete campos de card
      (palavra, tradução, sinônimos, classe gramatical, frase de exemplo,
      tradução da frase, anotação pessoal) sobre `TextField`, reaproveitado
      por criar e editar — verificar com teste de componente que os
      valores/`onChange` de cada campo propagam corretamente
- [ ] 3.2 Criar `cardInputFromValues`/`EMPTY_CARD_VALUES` (mesmo papel de
      `mem-words-frontend/src/pages/cardForm.jsx`) — verificar com teste
      unitário que campos opcionais vazios são omitidos do corpo enviado

## 4. Lista de baralhos (`HomeScreen`)

- [ ] 4.1 Reescrever `src/screens/HomeScreen.tsx`: carrega `listDecks()`
      na montagem; estados de carregando, erro e lista vazia — verificar
      com teste de componente os três estados
- [ ] 4.2 Cada baralho na lista mostra nome, idiomas, total de cards e o
      selo de prontidão ("N hoje"/"em dia", a partir de `dueCount`) —
      verificar com teste de componente os dois casos do selo
- [ ] 4.3 Formulário de criar baralho (nome, idioma de origem, idioma de
      destino), revelado sob demanda, com validação local (tarefa 2.1) —
      verificar com teste de componente: campo vazio não envia
      requisição; sucesso insere o baralho na lista sem recarregar
- [ ] 4.4 Navegar para `DeckDetail` ao tocar em um baralho da lista —
      verificar com teste de componente/navegação

## 5. Detalhe do baralho (`DeckDetailScreen`)

- [ ] 5.1 Criar `src/screens/DeckDetailScreen.tsx`: carrega `getDeck(id)`
      na montagem; estado de indisponível (403/404 tratados como o mesmo
      caso, mensagem única) com caminho de volta à lista — verificar com
      teste de componente
- [ ] 5.2 Exibir nome, idiomas, total de cards, data de criação e os
      quatro blocos de contagem por status — verificar com teste de
      componente
- [ ] 5.3 Editar (nome/idiomas) e excluir o baralho, com confirmação antes
      de excluir — verificar com teste de componente os dois fluxos
- [ ] 5.4 Lista de cards paginada com `FlatList` (`onEndReached` carrega a
      próxima página, concatenando ao array em memória) — verificar com
      teste de componente que uma segunda página é anexada, não substitui
      a primeira
- [ ] 5.5 Busca por palavra (debounce de 300ms) e filtro por status,
      combináveis, reiniciando a paginação para a primeira página ao mudar
      — verificar com teste de componente (temporizador simulado para o
      debounce)
- [ ] 5.6 Cada card na lista mostra selo de status (mapeamento fixo
      status→cor do design.md) e, quando houver, a próxima revisão;
      ações de editar (abre `CardFields` inline ou modal — decisão de
      implementação, sem exigência de spec), excluir (com confirmação) e
      suspender/reativar — verificar com teste de componente cada ação
      atualizando a lista e as contagens do baralho sem recarregar a tela
      inteira
- [ ] 5.7 Estado de "nenhum card encontrado" para busca/filtro sem
      resultado, distinto do estado de baralho sem nenhum card ainda —
      verificar com teste de componente os dois casos

## 6. Adicionar card (`AddCardScreen`)

- [ ] 6.1 Criar `src/screens/AddCardScreen.tsx`, recebendo o `deckId` por
      parâmetro de rota, usando `CardFields` (tarefa 3.1) e a validação da
      tarefa 2.2 — verificar com teste de componente que campos
      obrigatórios vazios impedem o envio
- [ ] 6.2 Ao salvar com sucesso, volta para `DeckDetail` com o card novo
      já refletido na lista — verificar com teste de componente/navegação

## 7. Navegação (`navigation/routing`, delta)

- [ ] 7.1 Adicionar `DeckDetail` (parâmetro `deckId`) e `AddCard`
      (parâmetro `deckId`) a `AppStackParamList`/`AppStack.tsx` —
      verificar `npx tsc --noEmit` sem erros
- [ ] 7.2 Registrar as duas rotas novas em `linking` (`RootNavigator.tsx`,
      esquema `memwords://`), mesmo sem link externo real apontando para
      elas ainda — verificar com teste unitário que o schema resolve os
      caminhos esperados

## 8. Verificação final

- [ ] 8.1 `npx tsc --noEmit` passa sem erros
- [ ] 8.2 `npm run lint` passa sem erros
- [ ] 8.3 `npm test` passa, cobrindo `api/decks`, `api/cards`,
      `decks/validation`, `cards/validation`, `CardFields` e as três telas
      novas
- [ ] 8.4 Verificar no dispositivo físico via Expo Go: criar um baralho,
      abrir seu detalhe, adicionar um card, editar e excluir um card,
      suspender e reativar um card, buscar e filtrar a lista, editar e
      excluir o baralho — **requer dispositivo físico do usuário**
- [ ] 8.5 `openspec validate add-decks-and-cards-screens --type change
      --strict` passa
