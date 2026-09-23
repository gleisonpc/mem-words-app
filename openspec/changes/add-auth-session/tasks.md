## 1. Dependências e armazenamento seguro

- [x] 1.1 Instalar `expo-secure-store` via `npx expo install` — verificar
      que a versão instalada é compatível com o SDK do projeto (`npx expo
      config` sem aviso de incompatibilidade)
- [x] 1.2 Criar `src/auth/tokenStore.ts`: `getAccessToken()`/
      `setAccessToken()` em memória; `getRefreshToken()`/
      `setRefreshToken()`/`clearRefreshToken()` sobre
      `expo-secure-store`, com leitura/escrita envolvidas em `try/catch`
      (armazenamento seguro indisponível não deve lançar) — verificar com
      teste unitário (mock de `expo-secure-store`) cobrindo leitura,
      escrita, limpeza e falha do armazenamento
- [x] 1.3 Implementar o disparo único de renovação em `tokenStore.ts`:
      `getOrCreateRefreshPromise(factory)` guarda a promessa em curso e a
      reutiliza para quem chamar durante a renovação — verificar com
      teste unitário que duas chamadas concorrentes resultam em uma só
      invocação de `factory`

## 2. Cliente HTTP autenticado (`backend-integration/api-client`, sem mudança de spec)

- [x] 2.1 Estender `src/api/client.ts`: aceitar uma opção `auth: boolean`
      por chamada; quando verdadeira, ler o access token de `tokenStore` e
      enviar `Authorization: Bearer` — verificar com teste unitário que o
      cabeçalho aparece só quando `auth: true`
- [x] 2.2 Implementar a renovação reativa: uma resposta `401` de chamada
      com `auth: true` aciona `POST /auth/mobile/refresh` (via
      `tokenStore`, reaproveitando o disparo único da tarefa 1.3), repete
      a requisição original uma única vez com o novo access token, e
      propaga o `401` original se a renovação falhar — verificar com
      testes unitários (mock de `fetch`) cobrindo: renovação bem-sucedida
      e repetição, renovação recusada, e nenhuma segunda renovação numa
      segunda recusa
- [x] 2.3 Garantir que endpoints públicos (`register`, `mobile/login`)
      nunca acionam a renovação reativa mesmo recebendo um `401` — verificar
      com teste unitário

## 3. API de autenticação

- [x] 3.1 Criar `src/api/auth.ts`: `register(input)`, `login(input)`
      (chama `/auth/mobile/login`), `refresh(refreshToken)`,
      `logout(refreshToken?)` — tipos de entrada/saída batendo com o
      contrato documentado em design.md — verificar com testes unitários
      (mock de `client.request`) para cada função
- [x] 3.2 Criar `src/api/users.ts`: `getMe()` (`GET /users/me`, `auth:
      true`) — verificar com teste unitário

## 4. Sessão (`auth/session`)

- [x] 4.1 Criar `src/auth/validation.ts`: regras de nome (2–120), e-mail
      (formato, até 255, normalizado para minúsculas/sem espaços nas
      pontas) e senha (8–72), espelhando
      `mem-words-frontend/src/auth/validation.js` — verificar com testes
      unitários cobrindo cada regra e seus limites
- [x] 4.2 Criar `src/auth/session.ts`: tipos do estado
      (`determinando`/`sem-sessão`/`autenticado`) e o contexto React —
      verificar que os três estados são mutuamente exclusivos por tipo
      (TypeScript, sem `as`)
- [x] 4.3 Criar `src/auth/SessionProvider.tsx`: na montagem, lê o refresh
      token guardado; havendo um, chama `refresh()` e depois `getMe()`
      para confirmar, seguindo design.md ("Restauração: trocar o token
      guardado, depois confirmar"); sem token guardado, vai direto para
      "sem sessão" sem chamada alguma — verificar com teste unitário
      (mock das chamadas de API) os quatro cenários da spec: sessão
      válida, sessão inválida (token descartado), backend inacessível
      (nem confirma nem descarta), sem token guardado
- [x] 4.4 Implementar `register()` no `SessionProvider`: chama
      `authApi.register`, depois `login()` com as mesmas credenciais;
      falha na segunda chamada é reportada como "conta criada, entre
      agora", nunca como falha de cadastro — verificar com teste unitário
      cobrindo sucesso, falha no registro, e falha na entrada encadeada
- [x] 4.5 Implementar `login()`: chama `authApi.login`, guarda o par de
      tokens via `tokenStore`, atualiza o estado para autenticado com o
      usuário retornado — verificar com teste unitário
- [x] 4.6 Implementar `logout()`: chama `authApi.logout` com o refresh
      token guardado, e descarta estado + tokens independentemente do
      resultado da chamada — verificar com teste unitário cobrindo
      backend disponível e indisponível
- [x] 4.7 Conectar a renovação reativa (tarefa 2.2) à queda de sessão: uma
      renovação recusada encerra a sessão local (mesmo caminho de
      `logout()`, sem chamar o backend de novo) — verificar com teste
      unitário
- [x] 4.8 Criar `useSession()` expondo o contexto — verificar que uma
      tela fora do `SessionProvider` recebe erro claro ao chamá-lo (mesmo
      padrão de `useTheme()` em `add-app-foundation`)

## 5. Telas (`auth/screens`)

- [ ] 5.1 Criar `src/screens/LoginScreen.tsx`: campos de e-mail/senha,
      validação local (tarefa 4.1) antes de chamar `login()`, estado de
      envio em curso, erro geral anunciado a tecnologia assistiva,
      `textContentType`/`autoComplete` nos campos, campo de senha com
      `secureTextEntry` e `returnKeyType="go"` submetendo o formulário —
      verificar visualmente nos dois temas — **código e testes de
      componente prontos; verificação visual em dispositivo pendente**
- [ ] 5.2 Criar `src/screens/RegisterScreen.tsx`: campos de nome/e-mail/
      senha, mesma disciplina de validação e erro de `LoginScreen` —
      verificar visualmente nos dois temas — **código pronto; verificação
      visual em dispositivo pendente**
- [x] 5.3 Ligar os erros por campo (`fieldErrors` de `ApiError`) aos
      campos correspondentes nas duas telas — verificar com teste unitário
      (biblioteca de teste de componente) que um `fieldErrors.email`
      aparece associado ao campo de e-mail
- [ ] 5.4 Adicionar navegação entre as duas telas (link de "já tenho
      conta" / "criar conta") — verificar navegação manual no Expo Go
      — **navegação testada por componente (`LoginScreen.test.tsx`);
      verificação manual no Expo Go pendente — requer dispositivo físico
      do usuário**

## 6. Navegação (`navigation/routing`, delta)

- [x] 6.1 Criar `src/navigation/PublicStack.tsx` (Login, Register,
      Diagnostics) e `src/navigation/AppStack.tsx` (Home, Diagnostics) —
      verificar `npx tsc --noEmit` sem erros
- [x] 6.2 Reescrever `RootNavigator.tsx` para escolher entre
      `PublicStack`, `AppStack` e uma tela de carregamento conforme
      `useSession()` (design.md, "Navegação") — verificar com teste
      unitário (mock de `useSession`) que cada um dos três estados
      renderiza a pilha/tela esperada
- [x] 6.3 Envolver `App.tsx` com `SessionProvider`, entre `ThemeProvider`
      e `RootNavigator` — verificar que o app sobe sem erro
- [ ] 6.4 Verificar no dispositivo físico via Expo Go: abrir o app sem
      sessão mostra a tela de entrada; cadastrar uma conta nova leva à
      tela inicial autenticada; fechar e reabrir o app mantém a sessão
      (token no Keychain); sair leva de volta à entrada — **requer
      dispositivo físico do usuário**

## 7. Verificação final

- [x] 7.1 `npx tsc --noEmit` passa sem erros
- [x] 7.2 `npm run lint` passa sem erros
- [x] 7.3 `npm test` passa, cobrindo `tokenStore`, `client` (auth +
      renovação), `api/auth`, `api/users`, `validation` e
      `SessionProvider` (70 testes, incluindo `RootNavigator` e
      `LoginScreen`)
- [ ] 7.4 Inspecionar manualmente, no dispositivo, que nenhum token
      aparece fora do Keychain (nenhuma chave nova em `AsyncStorage` além
      da preferência de tema já existente) — **requer dispositivo físico
      do usuário**
- [x] 7.5 `openspec validate add-auth-session --type change --strict`
      passa
