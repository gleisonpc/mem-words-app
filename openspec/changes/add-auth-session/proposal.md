## Why

O app hoje (`add-app-foundation`) abre direto em uma tela sem sessão, sem
cadastro nem entrada — toda tela de produto real (baralhos, revisão, perfil)
depende de saber quem está usando o app. O backend (`mem-words-backend`) já
oferece um fluxo de autenticação dedicado a cliente mobile
(`POST /auth/mobile/login`, `/refresh`, `/logout`, arquivado em
`add-mobile-refresh-auth`) que devolve o token de renovação no corpo da
resposta em vez de cookie — exatamente o que faltava para portar a sessão do
`mem-words-frontend` para React Native.

## What Changes

- Telas de cadastro e entrada, réplica mobile de `auth/screens` do
  `mem-words-frontend`, usando os tokens de tema já existentes.
- Sessão como fonte única de verdade (`auth/session`): cadastro, entrada,
  restauração ao abrir o app validada contra o backend, renovação automática
  por `401` com uma única renovação em curso por vez, e saída — a mesma
  disciplina do `auth/session` web, adaptada para onde o app difere de um
  navegador:
  - Sem cookie `HttpOnly`: o app fala com `POST /auth/mobile/login`,
    `/auth/mobile/refresh` e `/auth/mobile/logout`, que devolvem o token de
    renovação no corpo.
  - O token de renovação é persistido pelo próprio app (não há navegador
    gerenciando cookie) em `expo-secure-store` (Keychain no iOS, Keystore no
    Android) — nunca em `AsyncStorage`, que já guarda a preferência de tema
    (não sensível) nesta base de código.
  - Ao contrário do cookie do navegador, que expira sozinho quando o
    dispositivo desliga a sessão, o token guardado no Keychain sobrevive a
    fechar e reabrir o app — por isso ele precisa ser persistido, e não só
    mantido em memória como o token de acesso.
- Reestruturação da navegação em duas pilhas — pública (entrada, cadastro,
  diagnóstico) e autenticada (hoje só um placeholder de início, ponto de
  encaixe para baralhos/revisão/perfil nas changes seguintes) — delta sobre
  `navigation/routing`, capability introduzida por `add-app-foundation`.
- Nenhuma tela de baralhos, revisão ou perfil nesta change — só a área
  autenticada existir como destino e a sessão que a protege.

## Capabilities

### New Capabilities
- `auth/session`: ciclo de vida da sessão no app — cadastro, entrada,
  restauração validada ao abrir, renovação automática de disparo único,
  saída, armazenamento seguro do token de renovação. Paridade de
  comportamento com `auth/session` do `mem-words-frontend`, adaptada para
  onde o transporte muda (corpo em vez de cookie) e para onde a persistência
  precisa existir (Keychain/Keystore, porque não há navegador).
- `auth/screens`: telas de entrada e cadastro do app — campos, validação
  espelhando as regras do backend, exibição de erro por campo, estado de
  envio em curso, acessibilidade por VoiceOver/TalkBack. Paridade de
  comportamento com `auth/screens` do `mem-words-frontend`, adaptada para
  componentes React Native em vez de HTML (rótulo por `accessibilityLabel`,
  não `<label>`; envio por teclado não se aplica do mesmo jeito em mobile).

### Modified Capabilities
- `navigation/routing`: adiciona a distinção entre pilha pública e pilha
  autenticada que `add-app-foundation` deixou de fora de propósito (não
  havia sessão para proteger nada ainda) — a tela `Home` provisória dessa
  change passa a exigir sessão, e `Diagnostics` continua pública.

## Impact

- `src/screens/`: `LoginScreen.tsx`, `RegisterScreen.tsx` (novas);
  `HomeScreen.tsx` passa a viver na pilha autenticada.
- `src/auth/`: `tokenStore.ts` (expo-secure-store para o token de renovação,
  memória para o de acesso), `session.ts`/`SessionProvider.tsx` (estado e
  operações), `useSession.ts`, validação espelhando as regras do backend
  (nome 2–120, e-mail válido até 255, senha 8–72).
- `src/api/`: `auth.ts` (register, mobile login/refresh/logout), `users.ts`
  (`GET /users/me`, usado na restauração).
- `src/api/client.ts`: passa a aceitar um cabeçalho `Authorization` por
  chamada e a acionar renovação em uma resposta `401` — muda de assinatura,
  mas a capability `backend-integration/api-client` em si (transporte, erro,
  tempo limite) não muda de comportamento; por isso não entra como
  capability modificada.
- `src/navigation/RootNavigator.tsx`: dois navegadores aninhados
  (`PublicStack`, `AppStack`) escolhidos pelo estado da sessão, no lugar do
  navegador único atual.
- Nenhuma mudança no `mem-words-backend` — o contrato mobile já existe e já
  foi verificado nesta sessão (`openspec/specs/user-auth/spec.md`,
  requirements "...mobile...").
