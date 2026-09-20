## Why

O repositório `mem-words-app` hoje só tem um `README.md` — não existe projeto
algum. Antes de replicar qualquer tela do `mem-words-frontend` (web) em React
Native, é preciso um esqueleto de app que já resolva, de uma vez, o que toda
tela futura vai depender: como o projeto builda e roda sem Mac (Expo + EAS),
de onde vem cor/espaçamento/tipografia, como o app fala com o backend, e como
as telas são organizadas em navegação. Sem essa fundação, cada change
seguinte (autenticação, baralhos, revisão, perfil) reinventaria essas
decisões de forma inconsistente.

## What Changes

- Criação do projeto Expo (managed workflow) com TypeScript estrito,
  reproduzindo a estrutura de pastas do `mem-words-frontend` onde fizer
  sentido (`src/api`, `src/theme`, `src/i18n`), adaptada para React Native.
- Configuração mínima do EAS (`eas.json`, `app.json`/`app.config.ts` com
  `expo.extra.eas.projectId` reservado) suficiente para gerar builds de
  desenvolvimento (`expo-dev-client`) pela nuvem da Expo — nenhum passo desta
  change exige Xcode, simulador iOS ou um Mac.
- Tokens de design (cor, tipografia, espaçamento, raio) portados do design
  system web para um tema React Native (light/dark), sem CSS.
- Cliente HTTP para o backend: URL base configurável por ambiente, JSON,
  tempo limite, tradução do formato de erro do backend (`{ error, code,
  details }`) — sem envio de token ainda, porque a sessão é a próxima change.
- Casca de navegação (React Navigation): um stack raiz distinguindo uma área
  pública de uma área autenticada (esta última, por ora, inacessível — sem
  sessão implementada nesta change, todo o app se comporta como deslogado).
- Tela de diagnóstico do backend, pública, replicando o papel da
  `DiagnosticsPage` do frontend web: mostra se o backend está acessível, sem
  exigir sessão — inclusive para funcionar quando a própria autenticação
  estiver fora do ar.
- Nenhuma tela de produto (baralhos, revisão, perfil) nesta change — só a
  fundação sobre a qual elas serão construídas nas changes seguintes.

## Capabilities

### New Capabilities
- `design-system/tokens`: vocabulário visual do app (cor por papel
  semântico, tipografia, espaçamento, raio) como tema React Native, com
  claro/escuro e paridade com `mem-words-frontend`'s
  `design-system/tokens`.
- `backend-integration/api-client`: como o app monta requisições ao backend
  (`mem-words-backend`), formato de erro traduzido, tempo limite — a base
  mobile do que `mem-words-frontend`'s `backend-integration/api-client`
  define para a web, sem a parte de cookie (que não se aplica a
  React Native) e sem o envio de token (adiado para `auth/session`).
- `navigation/routing`: casca de navegação do app — pilha raiz, distinção
  entre área pública e área autenticada, tela de destino desconhecida — base
  mobile do que `mem-words-frontend`'s `navigation/routing` define para a
  web, sem a parte específica de URL/navegador.
- `diagnostics/health-check`: tela pública de diagnóstico do backend.

### Modified Capabilities

(nenhuma — projeto novo, não há capabilities existentes no `mem-words-app`)

## Impact

- Novo projeto Expo em `mem-words-app` (`package.json`, `app.json`,
  `tsconfig.json`, `eas.json`, `babel.config.js`).
- `src/theme/`: tokens e provedor de tema (claro/escuro/do sistema).
- `src/api/client.ts`, `src/api/ApiError.ts`: cliente HTTP e tipo de erro,
  adaptados de `mem-words-frontend/src/api/client.js` e `ApiError.js`.
- `src/navigation/`: navegador raiz e as duas pilhas (pública/autenticada,
  esta última vazia por enquanto).
- `src/screens/DiagnosticsScreen.tsx`.
- Nenhuma dependência do `mem-words-backend` é modificada por esta change —
  ela só consome o endpoint de saúde já existente.
