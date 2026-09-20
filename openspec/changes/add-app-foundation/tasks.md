## 1. Projeto Expo

- [ ] 1.1 Criar o projeto com `npx create-expo-app@latest . --template
      expo-template-blank-typescript` na raiz do repositório (mantendo o
      `README.md` existente) — verificar que `npx expo start` sobe o
      servidor de desenvolvimento sem erro
- [ ] 1.2 Configurar `app.json`/`app.config.ts`: nome do app, `slug`,
      `scheme: "memwords"` (para deep linking), `ios.bundleIdentifier`
      (reservado, ex.: `com.gleisonpc.memwords`) — verificar
      `npx expo config` sem erro de validação
- [ ] 1.3 Adicionar `eas.json` com os perfis `development` (dev client,
      `distribution: internal`), `preview` e `production` (sem submissão
      configurada ainda) — verificar `npx eas build:configure` ou a
      validação manual do JSON
- [ ] 1.4 Habilitar TypeScript estrito em `tsconfig.json`
      (`"strict": true"`) — verificar `npx tsc --noEmit` sem erros no
      projeto gerado
- [ ] 1.5 Configurar lint (oxlint, mesma ferramenta do
      `mem-words-frontend`) com script `lint` no `package.json` — verificar
      `npm run lint` roda sem erro de configuração
- [ ] 1.6 Criar a estrutura de pastas `src/{api,theme,navigation,screens}`
      e mover `App.tsx` para importar de `src/` — verificar que o app
      ainda sobe depois da reorganização

## 2. Tokens de design (`design-system/tokens`)

- [ ] 2.1 Portar os tokens de cor do `mem-words-frontend`
      (`src/styles/tokens.css`) para `src/theme/tokens.ts`, com os mesmos
      nomes semânticos, separados em `light` e `dark` — verificar que os
      dois objetos têm exatamente o mesmo conjunto de chaves (teste
      unitário simples ou script comparando `Object.keys`)
- [ ] 2.2 Verificar manualmente o contraste de cada par
      texto/superfície e texto de estado/fundo de estado contra os
      mínimos 4.5:1 (texto) e 3:1 (não textual) — registrar o resultado em
      comentário no arquivo de tokens
- [ ] 2.3 Criar `src/theme/ThemeProvider.tsx`: lê `useColorScheme()`,
      permite fixar `light`/`dark`/`system`, persiste a escolha com
      `@react-native-async-storage/async-storage`, expõe o tema ativo via
      contexto/hook (`useTheme()`) — verificar que trocar a escolha muda o
      tema retornado imediatamente, sem recarregar
- [ ] 2.4 Verificar que a escolha persiste: fechar e reabrir o app (no
      Expo Go) com um tema fixado mantém o mesmo tema
- [ ] 2.5 Adicionar escalas de espaçamento, tamanho de fonte, peso de
      fonte e raio de borda em `src/theme/tokens.ts`, com os mesmos
      degraus (ou equivalentes) do `mem-words-frontend`
- [ ] 2.6 Ler `AccessibilityInfo.isReduceMotionEnabled()` e o evento
      `reduceMotionChanged` no `ThemeProvider`, expondo uma flag
      `reduceMotion` para qualquer animação futura suprimir/pular

## 3. Cliente HTTP (`backend-integration/api-client`)

- [ ] 3.1 Definir a URL base por variante de ambiente (`app.config.ts`
      `extra.apiUrl`, lida via `expo-constants`) — verificar que
      `Constants.expoConfig.extra.apiUrl` resolve em dev e em um build
      `preview` do EAS
- [ ] 3.2 Criar `src/api/ApiError.ts`, adaptando
      `mem-words-frontend/src/api/ApiError.js` (mensagem, `status`,
      `code`, `details`, `fieldErrors`, `isConnectionFailure`) —
      verificar com um teste unitário para `fromResponse`, `network` e
      `timeout`
- [ ] 3.3 Criar `src/api/client.ts` com `request(path, { method, body,
      timeoutMs })`: `fetch` com `AbortController` para o timeout, cabeçalhos
      `Accept`/`Content-Type: application/json`, leitura de corpo tolerante
      a `204`/vazio, tradução de erro via `ApiError` — sem `auth` nem
      `credentials` nesta change — verificar com testes unitários
      (mock de `fetch`) cobrindo sucesso, erro do backend, timeout e falha
      de rede
- [ ] 3.4 Criar `src/api/health.ts` com `checkHealth()`, replicando o
      contrato de `mem-words-frontend/src/api/health.js` (`{ ok, detail }`)
      — verificar com teste unitário

## 4. Navegação (`navigation/routing`)

- [ ] 4.1 Instalar `@react-navigation/native`,
      `@react-navigation/native-stack` e as dependências nativas exigidas
      (`react-native-screens`, `react-native-safe-area-context`) via
      `npx expo install` (garante versões compatíveis com a versão do
      Expo SDK do projeto)
- [ ] 4.2 Criar `src/navigation/RootNavigator.tsx` com um
      `NativeStack.Navigator` contendo as telas `Home` e `Diagnostics` —
      verificar navegação manual entre as duas no Expo Go
- [ ] 4.3 Configurar `linking` no `NavigationContainer` com
      `prefixes: ["memwords://"]` e as duas rotas mapeadas — verificar
      abrindo `memwords://diagnostics` no dispositivo (via `npx uri-scheme
      open` ou o próprio Expo Go) e chegando na tela correta
- [ ] 4.4 Adicionar uma tela de fallback (`NotFoundScreen`) para rota não
      mapeada, com caminho de volta à Home — verificar abrindo um deep
      link para uma rota inexistente

## 5. Tela de diagnóstico (`diagnostics/health-check`)

- [ ] 5.1 Criar `src/screens/DiagnosticsScreen.tsx`: chama `checkHealth()`
      ao montar, exibe estado de carregando/ok/erro (usando os tokens do
      tema), o endereço do backend configurado, e um botão "Verificar
      novamente" — verificar visualmente nos temas claro e escuro
- [ ] 5.2 Criar `src/screens/HomeScreen.tsx` provisória, com um link para
      a tela de diagnóstico — verificar navegação
- [ ] 5.3 Testar os três cenários no dispositivo físico via Expo Go:
      backend acessível, backend fora do ar (desligar o backend local ou
      apontar para uma URL inválida), e tempo limite (backend hospedado
      hibernado, se aplicável) — confirmar que os três estados da tela são
      visualmente distintos

## 6. Verificação final

- [ ] 6.1 `npx tsc --noEmit` passa sem erros
- [ ] 6.2 `npm run lint` passa sem erros
- [ ] 6.3 `npx eas build --profile development --platform ios` conclui
      com sucesso (build na nuvem da Expo, sem Mac) e o `.ipa`/link de
      instalação resultante é instalado e abre em um iPhone físico
- [ ] 6.4 `openspec validate --specs` passa para as quatro capabilities
      desta change
