## Context

Ver proposal.md para motivação. `mem-words-app` está vazio (só
`README.md`). Este design cobre como montar o projeto e as quatro
capabilities da proposta, com uma restrição que atravessa toda decisão
técnica: quem constrói e testa este app não tem um Mac. Todo passo que
normalmente pediria Xcode precisa de um equivalente em nuvem ou no próprio
dispositivo do usuário.

## Goals / Non-Goals

**Goals:**
- Deixar o projeto buildável e executável em um iPhone físico sem Mac
  algum, do primeiro commit em diante.
- Definir a estrutura de pastas e as convenções (nomes, camadas) que as
  changes seguintes (auth, decks, revisão, perfil) vão seguir.
- Definir o tema (tokens) e o cliente HTTP de um jeito que a auth (próxima
  change) só precise plugar o envio de token, sem redesenhar nenhum dos
  dois.

**Non-Goals:**
- Qualquer tela de produto (login, baralhos, revisão, perfil) — vem nas
  changes seguintes.
- Configuração de submissão à App Store (certificados, provisioning
  profile, EAS Submit, metadados da loja) — fica para uma change própria de
  distribuição, quando o Apple Developer Program estiver ativo.
- Sessão/autenticação e a mudança correspondente no backend
  (`mem-words-backend`) — change própria, por depender de um endpoint que
  ainda não existe lá.
- Notificações push, deep linking completo (universal links assinados) —
  fora do escopo desta fundação.

## Decisions

### Expo managed workflow, não bare React Native

Alternativa descartada: React Native CLI puro. Builda iOS localmente só via
Xcode/macOS, ou exigiria montar CI próprio em runner macOS — custo e
complexidade desproporcionais para quem não tem Mac. O Expo managed
workflow builda iOS inteiramente na nuvem via **EAS Build**, e o app roda
em um iPhone físico durante o desenvolvimento via **Expo Go** (para
JavaScript puro) ou um **dev client** gerado pelo EAS (quando alguma
dependência tiver código nativo que o Expo Go não inclui). Nenhum dos dois
caminhos toca um Mac.

Trade-off aceito: algumas bibliotecas nativas de terceiros não têm suporte
Expo (config plugin) e exigiriam "ejetar" para bare workflow — decisão a
revisitar change a change, preferindo sempre a alternativa com suporte
Expo quando existir.

### TypeScript estrito, mesma disciplina do backend

`mem-words-backend` já usa TypeScript strict; `mem-words-frontend` é
JavaScript puro. Para o app, TypeScript estrito prevalece: um app mobile
tem superfícies de erro (navegação, formatos de payload nativo) que
tipagem ajuda a pegar em build, e o time já está confortável com TS pelo
backend.

### Estrutura de pastas espelhando o frontend web

```
src/
  api/       — client.ts, ApiError.ts (este change); um arquivo por
               recurso do backend, adicionado change a change (decks.ts,
               cards.ts, reviews.ts, users.ts...)
  theme/     — tokens.ts, ThemeProvider.tsx
  navigation/— RootNavigator.tsx (este change); PublicStack, AppStack
               adicionados pela change de auth
  screens/   — uma pasta por tela; DiagnosticsScreen nesta change
  i18n/      — adiado: sem nenhum texto de produto ainda, a tela de
               diagnóstico desta change usa texto fixo em português. A
               capability `i18n/ui-language` (dois idiomas) entra quando a
               primeira tela de produto existir.
```

Reaproveita os nomes de capability do `mem-words-frontend`
(`design-system/tokens`, `backend-integration/api-client`,
`navigation/routing`) para manter os dois specs comparáveis lado a lado,
mesmo com implementações diferentes (StyleSheet/tema em vez de CSS, React
Navigation em vez de React Router).

### Tema: `useColorScheme` do React Native + override persistido

RN expõe `useColorScheme()` para a preferência de aparência do sistema.
Para a escolha manual (claro/escuro/do sistema) sobreviver a reabrir o
app, ela é persistida com `@react-native-async-storage/async-storage` — um
valor não sensível (uma string entre três), diferente do token de sessão,
que a change de auth vai guardar em `expo-secure-store` (Keychain/Keystore)
por ser sensível. O contraste mínimo (4.5:1 texto, 3:1 não-textual) é
verificado manualmente nesta change, comparando os valores portados do
design system web — que já passam nesse critério — com uma calculadora de
contraste, e a decisão exata de cada valor de cor fica registrada nos
comentários do arquivo de tokens.

`AccessibilityInfo.isReduceMotionEnabled()` (com o evento
`reduceMotionChanged`) decide se transições são suprimidas.

### Cliente HTTP: `fetch` nativo do RN, sem `credentials: 'include'`

O `fetch` do RN não tem o mesmo controle de cookie que o de um navegador, e
esta capability não lida com cookie algum — o transporte é só URL base +
JSON + timeout + tradução de erro, replicando a lógica de
`mem-words-frontend/src/api/client.js` (`attempt`, `readBody`, `ApiError`)
sem a parte de `credentials`/renovação (que pertence à change de
`auth/session`, porque depende do endpoint mobile ainda não criado no
backend). `AbortController` (disponível no RN) cobre o timeout do mesmo
jeito que no navegador.

### Navegação: React Navigation, pilha única por enquanto

`@react-navigation/native` + `@react-navigation/native-stack` (usa
`UIViewController`/`Fragment` nativos, mais barato que o stack em JS puro).
Nesta change, um único `NativeStack.Navigator` com duas telas (Home
provisória, Diagnóstico) — sem separar pilha pública/autenticada ainda,
porque não há o que proteger sem sessão. A change de `auth/session` é quem
introduz a guarda e reestrutura para pública vs. autenticada, modificando
esta capability via delta.

Deep linking configurado desde já (`linking` config do
`NavigationContainer`, esquema `memwords://`) mesmo sem nenhum link
profundo real ainda a receber — existir a configuração é o que torna
"rota desconhecida" (spec desta change) testável.

### Como testar sem Mac

- **Expo Go** no iPhone do usuário, apontando para o servidor de
  desenvolvimento (`npx expo start`) — cobre esta change inteira, que não
  usa nenhuma API nativa fora do Expo Go.
- Quando uma change futura precisar de um módulo nativo fora do Expo Go
  (por exemplo `expo-secure-store` já entra no Expo Go, então isso só se
  aplicaria a algo mais exótico), o caminho é `eas build --profile
  development` gerando um dev client instalável por link/QR code — sem
  Xcode.
- Terceira pessoa como par de testes: como o autor não tem Mac para nada
  além do dev, toda validação em dispositivo é delegada ao usuário
  (`gleisonpc`), que roda o app no próprio iPhone e reporta o resultado.

## Risks / Trade-offs

- [Expo managed workflow limita quais módulos nativos são usáveis sem
  build customizado] → aceito porque toda dependência prevista até a
  distribuição (SecureStore, AsyncStorage, React Navigation) tem suporte
  Expo de primeira classe; reavaliar se uma change futura precisar de algo
  fora dessa lista.
- [Sem Mac, nenhuma validação de build iOS acontece localmente — só depois
  de enviar para o EAS] → aceito; mitigado rodando `npx tsc --noEmit` e o
  lint localmente antes de cada build, para pegar o que não depende do
  toolchain nativo.
- [Tokens de cor portados manualmente do CSS do web para o tema RN, sem
  ferramenta compartilhada entre os dois repositórios] → aceito pela
  simplicidade de um único conjunto pequeno de tokens; se os dois projetos
  divergirem no visual ao longo do tempo, é custo aceito de não terem um
  design system compartilhado formal.
