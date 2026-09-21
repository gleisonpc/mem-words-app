## Context

Ver `proposal.md` para motivação. O que já existe e não muda:

- `src/api/client.ts`: `request<T>(path, { method, body, auth, timeoutMs })`,
  já cuida de token, renovação e `ApiError`.
- `src/theme/ThemeProvider.tsx`: `useTheme()` devolve `colors`, `spacing`,
  `fontSize`, `fontWeight`, `radius` — nenhum valor literal deve aparecer
  fora disso.
- `src/components/TextField.tsx`: campo com rótulo e erro no
  `accessibilityLabel` (não há `<label for>` em RN).
- `src/navigation/AppStack.tsx`: hoje só `Home` e `Diagnostics`.
- `src/auth/validation.ts`: mesmo padrão de validação replicada à mão do
  backend, usado por login/cadastro.

O backend (`mem-words-backend`) já expõe tudo que esta change consome, sem
mudança nenhuma:

| Rota | Corpo/query | Resposta |
| :--- | :--- | :--- |
| `GET /decks` | — | `200 { decks: Deck[] }` |
| `POST /decks` | `{ name, sourceLanguage, targetLanguage }` | `201 { deck }` |
| `GET /decks/:id` | — | `200 { deck }` (inclui `cardCount`, `dueCount`, `newCount`, `learningCount`, `matureCount`, `suspendedCount`, `createdAt`) |
| `PATCH /decks/:id` | campos parciais | `200 { deck }` |
| `DELETE /decks/:id` | — | `204` |
| `GET /decks/:id/cards` | `?page&pageSize&q&status` | `200 { items: Card[], total, page, pageSize }` |
| `POST /decks/:id/cards` | `{ word, translation, partOfSpeech?, synonyms?, exampleSentence?, exampleTranslation?, personalNote? }` | `201 { card }` |
| `PATCH /cards/:id` | campos parciais | `200 { card }` |
| `DELETE /cards/:id` | — | `204` |
| `POST /cards/:id/suspend` | — | `200 { card }` |
| `POST /cards/:id/unsuspend` | — | `200 { card }` |

`card.status` é um dos seis valores calculados pelo backend: `new`,
`learning`, `difficult`, `mature`, `reviewing`, `suspended` — mesmo enum
que `mem-words-frontend` já consome.

## Goals / Non-Goals

**Goals:**
- Paridade de comportamento com as telas equivalentes do
  `mem-words-frontend` (`add-decks-and-cards-ui`, `improve-deck-list-
  screen`, `improve-deck-detail-screen`), adaptando o que é específico de
  navegador para o equivalente idiomático em RN.
- Um único componente de campos de card, reaproveitado entre criar e
  editar — mesmo motivo que levou o web a extrair `cardForm.jsx`.

**Non-Goals:**
- Sugestão de dicionário ao criar card — capability própria no web
  (`add-card-dictionary-lookup`), depende de um endpoint do backend
  (`/dictionary/suggest`) que esta change não usa.
- Navegar para uma sessão de revisão a partir do selo "N hoje" ou de
  qualquer card — a tela de revisão não existe neste app ainda; o selo é
  só informativo nesta change (ver "Ação de revisar adiada", abaixo).
- Painel inicial com saudação/sequência/resumo agregado
  (`add-home-dashboard` no web) — depende de `GET /reviews/today` e da
  tela de revisão.
- Deep linking direto para um baralho ou card específico — a spec
  `navigation/routing` já tem `linking` configurado (`add-app-foundation`);
  registrar as rotas novas nele é mecânico e entra nas tarefas, mas nenhum
  link externo real aponta para elas ainda.

## Decisions

### `HomeScreen.tsx` muda de conteúdo, não de rota

A proposta já registra isso (Impact): o arquivo e a rota `Home` continuam
existindo — só o que renderizam muda, do placeholder para a lista de
baralhos. Alternativa descartada: renomear a rota para `Decks`. Rejeitada
porque `navigation/routing` já usa `Home` como o nome estável do ponto de
entrada da pilha autenticada (`RootNavigator`, `add-auth-session`);
renomear obrigaria editar aquela spec por um motivo cosmético.

### Paginação por scroll (`FlatList` + "carregar mais"), não por página numerada

O backend pagina por `page`/`pageSize` (mesmo contrato do web), mas RN não
tem URL para refletir a página atual como o web faz. A lista de cards usa
`FlatList` com `onEndReached` carregando a próxima página e concatenando
ao array em memória — padrão idiomático de lista mobile, equivalente
observável ao "ver mais resultados" que a paginação numerada do web já
oferece (spec não exige nenhum mecanismo específico, só que a lista longa
seja alcançável).

Alternativa descartada: replicar a paginação numerada do web (botões
anterior/próxima). Rejeitada — não há convenção de UI mobile para isso, e
scroll contínuo é o padrão que toda lista nativa do app vai seguir.

### Busca com debounce local, filtro imediato — mesmo timing do web

Mesma decisão do `mem-words-frontend` (`improve-deck-detail-screen`):
busca por texto espera uma pausa na digitação antes de chamar o backend
(300ms, mesmo valor); o filtro por status, por ser uma escolha discreta
(um toque em um chip/botão, não digitação), dispara na hora. Os dois
reiniciam a lista para a primeira página ao mudar — trocar de filtro no
meio de um scroll longo com resultados antigos seria confuso.

### Componente único de campos de card, com slot para o formulário de baralho

Mesma decisão do web (`cardForm.jsx`, ver `mem-words-frontend/design.md`
do `add-card-dictionary-lookup`): um componente `CardFields` (campos +
validação + `cardInputFromValues`) compartilhado entre `AddCardScreen` e a
edição de card dentro de `DeckDetailScreen` — evita duas cópias da mesma
regra de validação (espelha o backend: palavra e tradução obrigatórias).

Diferente do web, não há um componente de campos de baralho compartilhado
ainda: criar e editar baralho têm os mesmos três campos, mas só dois
lugares os usam (lista e detalhe) — extrair antes do terceiro uso seria
abstração prematura.

### Selo de status do card: mapeamento fixo status → variante de cor

Mesmo mapeamento do web (`DeckDetailPage.jsx`, `STATUS_VARIANTS`): `new`→
`info`, `learning`→`warning`, `difficult`→`danger`, `mature`→`success`,
`reviewing`/`suspended`→cor neutra (usa `colors.textMuted`/`colors.border`
do tema, já que `tokens.ts` não define uma cor "neutral" própria — o RN
badge não precisa de token novo, só reaproveita os dois que já existem
para esse papel visual). Vive na tela (`DeckDetailScreen`), não em um
componente de design system — mesma decisão do web, "mapeamento de status
para variante de selo fica na tela, não no componente".

### Ação de revisar adiada — selo é informativo, sem navegação

O web tem um link "Revisar" ao lado do selo de prontidão, que leva à
sessão de revisão. Essa tela não existe neste app ainda (Non-Goals). O
selo "N hoje"/"em dia" aqui é só leitura — nenhum toque nele navega para
lugar nenhum nesta change. Quando `ReviewSessionScreen` for construída
(change futura), ela ganha essa navegação sem precisar tocar em
`decks/screens` de novo, do mesmo jeito que o próprio web introduziu
"Revisar" numa change posterior (`add-review-session-ui`) à que criou a
lista de baralhos.

### Validação replicada em `src/decks/validation.ts` e `src/cards/validation.ts`

Mesmo padrão de `src/auth/validation.ts`: funções puras espelhando as
regras do backend (nome do baralho, presença dos dois idiomas, palavra e
tradução do card), sem biblioteca de validação nova.

## Risks / Trade-offs

- [Lista em memória cresce sem limite ao carregar muitas páginas em uma
  sessão longa de scroll] → aceito; o volume esperado de cards por
  baralho não justifica paginação virtualizada além do que `FlatList` já
  oferece nativamente (ela recicla views fora da tela, só o array de dados
  cresce).
- [Sem dispositivo físico neste ambiente para validar gestos, VoiceOver/
  TalkBack de verdade, ou o comportamento de `FlatList`/teclado em tela
  pequena] → mesma mitigação de `add-auth-session`: lógica pura (validação,
  parsing de resposta, `api/decks.ts`/`cards.ts`) testável por unidade com
  `jest-expo`; `tasks.md` marca a verificação em dispositivo separada,
  delegada ao usuário (`gleisonpc`) via Expo Go.
- [Selo "N hoje" sem ação (Decisão acima) pode parecer incompleto para
  quem já viu a versão web, que navega dali] → aceito como consequência
  visível e temporária de excluir a tela de revisão desta change; a
  spec documenta que é informativo de propósito, não um selo quebrado.
