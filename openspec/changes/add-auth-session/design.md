## Context

Ver `proposal.md` para a motivação. O que importa aqui é o que já está
fixado dos dois lados:

**O contrato do backend** (`mem-words-backend`, já publicado e arquivado em
`add-mobile-refresh-auth`, `openspec/specs/user-auth/spec.md`):

| Endpoint | Corpo enviado | Resposta |
| :--- | :--- | :--- |
| `POST /auth/register` | `{ name, email, password }` | `201 { user }` — sem tokens |
| `POST /auth/mobile/login` | `{ email, password }` | `200 { user, accessToken, refreshToken, tokenType, expiresIn }` |
| `POST /auth/mobile/refresh` | `{ refreshToken }` | `200 { accessToken, refreshToken, tokenType, expiresIn }` — sem `user`, sem `Set-Cookie` |
| `POST /auth/mobile/logout` | `{ refreshToken? }` | `204`, idempotente |
| `GET /users/me` | — | `200 { user }`, exige `Authorization: Bearer` |

Mesmas três propriedades do backend que já moldaram o design web, e que
valem igual para mobile:

1. Access token é um JWT de 15 minutos, validado só pela assinatura.
2. Refresh token é opaco, de uso único e rotativo.
3. Reapresentar um refresh token já gasto revoga **todas** as sessões
   ativas do usuário — web e mobile compartilham a mesma tabela.

Erros vêm como `{ error, code, details? }`, já traduzidos pelo
`backend-integration/api-client` existente (`ApiError`) — nada muda aí.

**O que já existe no app** (`add-app-foundation`): tema (`ThemeProvider`,
`useTheme`), cliente HTTP (`src/api/client.ts`, sem envio de token ainda),
`src/api/ApiError.ts`, navegador raiz com uma pilha única
(`RootNavigator.tsx`, `Home` e `Diagnostics`).

**Diferença central em relação ao design web**
(`mem-words-frontend/openspec/changes/archive/*-add-authentication` e
`*-trust-httponly-refresh-cookie`): lá, o token de renovação é
inteiramente gerenciado pelo navegador via cookie `HttpOnly` — o frontend
nunca o vê, só guarda uma dica não sensível de que uma sessão existiu. Aqui
não há navegador: o backend devolve o refresh token no corpo, e o app é
quem precisa guardá-lo, apresentá-lo e trocá-lo — como um cliente OAuth
nativo qualquer.

## Goals / Non-Goals

**Goals:**
- Sessão com o mesmo comportamento observável do `auth/session` web:
  fonte única de verdade, restauração validada (nunca confiar em token só
  porque ele existe), renovação de disparo único, saída que sempre limpa o
  estado local.
- Nenhum token de renovação fora do Keychain/Keystore — nunca em
  `AsyncStorage`, nunca em log.
- App volta a abrir autenticado depois de fechado e reaberto, sem novo
  login — diferença deliberada do design web, que não persiste token
  algum (lá a "sessão sobrevive à recarga" é uma dica; aqui é o próprio
  refresh token).

**Non-Goals:**
- `i18n/ui-language` (dois idiomas de interface) — texto fixo em
  português nas telas desta change, como a tela de diagnóstico de
  `add-app-foundation` já faz. O próprio `mem-words-frontend` introduziu
  seletor de idioma só bem depois de várias telas existirem
  (`add-ui-language-selector`, a última change do web antes desta), não
  junto da primeira tela de autenticação — mesma ordem faz sentido aqui.
- Telas de baralhos, revisão, perfil — mudam de capability e vêm depois.
- Edição de perfil (troca de nome/e-mail/senha) — a capability
  `auth/session` do app não inclui essa operação ainda; entra junto da
  tela de perfil.
- Biometria (Face ID/Touch ID) para desbloquear a sessão guardada — melhoria
  razoável, fora do escopo desta change.
- Sincronização de sessão entre múltiplas instâncias do app (não se aplica
  a mobile do jeito que se aplica a abas web).

## Decisions

### `expo-secure-store` para o refresh token, memória para o access token

Mesma divisão sensível/não sensível que o design web já estabeleceu para
`AsyncStorage` (preferência de tema) — aqui o dado sensível é o refresh
token, e o destino é o Keychain (iOS) / Keystore (Android) via
`expo-secure-store`, que tem suporte de primeira classe no Expo Go e não
exige build customizado (ver `add-app-foundation`, design.md, "Expo
managed workflow").

Alternativa descartada: guardar o refresh token em `AsyncStorage`, como o
token de acesso do web fica em memória e o de renovação em cookie
gerenciado pelo navegador. Rejeitada: `AsyncStorage` não é criptografado —
seria pior que o cookie `HttpOnly` que o web abandonou a favor de mais
segurança, na direção errada.

O access token continua só em memória, nunca persistido — mesma decisão
do web (`trust-httponly-refresh-cookie`, "Token de acesso só em memória"),
pelo mesmo motivo: vida curta (15 min) não é vida zero, e um processo que
lê o Keychain para obter o refresh token já paga o custo de uma renovação
de qualquer forma.

### Módulo único (`tokenStore`) concentra o armazenamento, como no web

Mesma arquitetura de três papéis que o web usa (`design.md` de
`add-authentication`, decisão 3), para evitar o mesmo ciclo
tela→sessão→cliente→sessão:

```
tela → SessionProvider ─┐
                        ├→ api/*.ts → api/client.ts → tokenStore
      (assina) ─────────┘                 │              ↑
                                          └──────────────┘
                                           renovação
```

`tokenStore.ts` é o único módulo que toca `expo-secure-store` e a memória
do access token. `client.ts` lê dele para montar `Authorization` e aciona
renovação num `401`; `SessionProvider` lê dele e se inscreve para saber
quando a sessão cai.

### Restauração: trocar o token guardado, depois confirmar com `/users/me`

Ao abrir o app, `tokenStore` carrega o refresh token do Keychain (chamada
assíncrona — diferente do web, que lê `localStorage` de forma síncrona).
Havendo um token, a sessão chama `POST /auth/mobile/refresh` para obter um
access token, e então `GET /users/me` para confirmar a identidade — as
mesmas duas etapas que o design web descreve em "Restauração validada
contra o backend", só que aqui a etapa de renovação é explícita (chamada
direto, não via 401 reativo), porque não há token de acesso algum em
memória para uma chamada autenticada falhar e disparar o mecanismo
reativo — a app acabou de abrir.

Sem token guardado, a sessão vai direto para "sem sessão", sem chamada
alguma — mesmo comportamento do web ("Sem dica de sessão").

### Renovação de disparo único: a mesma promessa compartilhada do web

Replica a decisão 4 do design web (`add-authentication`) quase sem
mudança: `tokenStore` guarda a **promessa** de uma renovação em curso, não
um booleano, e qualquer chamador (a restauração na abertura, ou o `401`
reativo de qualquer requisição autenticada) que a encontrar aguarda o
mesmo resultado em vez de iniciar outra. É a defesa contra o mesmo perigo
descrito lá: duas renovações concorrentes apresentando o mesmo refresh
token, e o backend interpretando a segunda como reuso e revogando tudo.

Limites idênticos aos do web: uma única repetição por requisição, e nunca
renovar para uma resposta de endpoint público (`/auth/register`,
`/auth/mobile/login` não acionam o mecanismo — só uma resposta 401 de rota
autenticada aciona).

### Cadastro seguido de entrada — mesma decisão do web, mesmo motivo

`POST /auth/register` continua sem devolver token (é a mesma rota do
cliente web, ver proposal.md - Impact). O app repete a decisão 5 do design
web: registra e, com as mesmas credenciais em mãos, chama
`POST /auth/mobile/login` em seguida. Falha na segunda chamada é
comunicada como "conta criada, entre agora" — nunca como falha de
cadastro.

### Navegação: `SessionProvider` decide entre `PublicStack` e `AppStack`

`RootNavigator` deixa de ter uma única pilha (`add-app-foundation`) e passa
a escolher entre duas com base no estado da sessão — o mesmo papel que a
guarda de rota (`RequireAuth`/`GuestOnly`) cumpre no web, adaptado: em vez
de um componente por rota que redireciona, aqui a escolha é estrutural,
entre dois `NativeStack.Navigator` diferentes, porque não existe URL
alguma para redirecionar — apenas qual pilha o `NavigationContainer`
monta.

```
RootNavigator
├─ estado "determinando"  → tela de carregamento (sem pilha nenhuma)
├─ estado "sem sessão"    → PublicStack (Login, Register, Diagnostics)
└─ estado "autenticado"   → AppStack (Home, Diagnostics)
```

`Diagnostics` existe nas duas pilhas (não é uma tela compartilhada entre
elas — React Navigation não permite isso diretamente —, mas duas entradas
apontando para o mesmo componente), preservando o requisito herdado de
`add-app-foundation` de que o diagnóstico nunca fica atrás de sessão.

Alternativa considerada: manter uma pilha única com guardas por tela
(mais parecido com o modelo web). Rejeitada: React Navigation modela bem
"troca de pilha inteira" para fronteiras de autorização (é o padrão
documentado da biblioteca — "Authentication flows"), e evita uma tela
autenticada aparecer brevemente montada antes de uma guarda redirecionar,
problema que o próprio design web relata ter enfrentado.

### Validação no cliente replicada à mão, como no web

Mesma decisão que o web tomou (sem biblioteca de validação, regras
espelhadas à mão em `validation.js`): as mesmas regras (nome 2–120,
e-mail, senha 8–72) replicadas em `src/auth/validation.ts`, reaproveitável
entre as duas telas. Nenhuma dependência nova só para isto.

## Risks / Trade-offs

- **Refresh token no Keychain, ainda assim alcançável por quem tem acesso
  físico e desbloqueado ao aparelho, ou por outra instância do próprio app
  comprometida** → aceito; é a mesma superfície que qualquer app nativo
  com sessão persistida tem, e é estritamente melhor que a alternativa
  (`AsyncStorage`, sem criptografia). Fora do escopo desta change:
  biometria para reautenticar antes de usar o token guardado.
- **Leitura do Keychain é assíncrona** (diferente de `localStorage`
  síncrono no web) → a tela inicial sempre passa por um estado
  "determinando" mensurável, nunca instantâneo como no web em alguns
  casos. Aceito, e é o mesmo estado que a spec de sessão já modela.
- **Sem testes automatizados de ponta a ponta** (nenhum dispositivo aqui
  para rodar o app de verdade) → a lógica de `tokenStore`, `client.ts` e
  validação é testável por unidade com `jest-expo` (mock de
  `expo-secure-store` e `fetch`), do mesmo jeito que
  `add-app-foundation` já testou `ApiError`/`client`/`health`. O
  comportamento de UI (telas, navegação, Keychain de verdade) só é
  verificável no dispositivo do usuário — `tasks.md` marca isso
  explicitamente, e não finge que passou.
- **Duas pilhas de navegação re-testam a mesma lição do web** (só uma
  navegação pode decidir para onde ir depois de uma mudança de sessão) →
  mitigado adotando o mesmo princípio do design web: só o
  `RootNavigator`, lendo o estado da sessão, decide qual pilha mostrar;
  nenhuma tela navega para "sair" ou "entrar" por conta própria.
- **Dependência nova**: `expo-secure-store` → risco baixo, é um módulo
  Expo de primeira classe (mesma categoria de `expo-constants`,
  `expo-status-bar` já em uso).

## Open Questions

Nenhuma altera as specs, a abordagem ou as tarefas:

- Biometria para desbloquear a sessão guardada ao reabrir o app — vale a
  conversa quando houver dado sensível o bastante no app para justificar
  (hoje é só progresso de memorização de palavras).
- O `register` do backend poder devolver tokens diretamente, dispensando a
  entrada em sequência — mesma questão aberta já registrada no design web,
  vale para os dois clientes igualmente.
