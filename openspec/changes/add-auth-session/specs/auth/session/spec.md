## Purpose

Define o ciclo de vida da sessão de quem usa o mem-words no app — como ela é
criada, onde fica guardada, como é restaurada ao reabrir o app, como se
renova sozinha e como termina — para que as telas saibam, a qualquer
momento e por uma única fonte, quem está autenticado.

## ADDED Requirements

### Requirement: Fonte única de verdade sobre a sessão

O app SHALL expor o estado da sessão por uma única fonte, acessível a
qualquer tela, contendo: se a sessão ainda está sendo determinada, o
usuário autenticado quando há sessão, e a ausência de sessão quando não há.

Nenhuma tela SHALL ler os tokens guardados diretamente para decidir se há
sessão.

#### Scenario: Estado indeterminado no início
- **WHEN** o app é aberto e ainda não se sabe se há sessão válida
- **THEN** o estado é "determinando"
- **AND** nenhuma tela conclui que o usuário está autenticado ou anônimo

#### Scenario: Estado consultado por qualquer tela
- **WHEN** uma tela precisa saber quem está autenticado
- **THEN** ela obtém o usuário pela fonte única de sessão

### Requirement: Cadastro de conta

A sessão SHALL oferecer a operação de cadastro a partir de nome, e-mail e
senha, usando `POST /auth/register` — a mesma rota usada pelo cliente web,
que não devolve token algum.

Cadastro bem-sucedido SHALL encadear automaticamente uma entrada com as
mesmas credenciais, deixando o usuário autenticado sem digitá-las de novo.

Cadastro recusado SHALL NOT alterar o estado da sessão.

#### Scenario: Cadastro bem-sucedido
- **WHEN** o cadastro é aceito pelo backend
- **THEN** a sessão passa a existir e o usuário fica autenticado
- **AND** as credenciais não são solicitadas novamente

#### Scenario: Conta criada, entrada automática falha
- **WHEN** o cadastro é aceito mas a entrada encadeada falha (backend caiu
  entre as duas chamadas)
- **THEN** a sessão permanece inexistente
- **AND** a falha é reportada de forma que deixe claro que a conta foi
  criada e que entrar é o próximo passo — nunca sugerindo repetir o
  cadastro

#### Scenario: E-mail já cadastrado
- **WHEN** o backend recusa o cadastro porque o e-mail já pertence a uma
  conta
- **THEN** a falha é reportada a quem chamou
- **AND** a sessão permanece inexistente

### Requirement: Entrada por credenciais

A sessão SHALL oferecer a operação de entrada a partir de e-mail e senha,
usando `POST /auth/mobile/login` — a variante mobile de login, que devolve
o token de acesso e o token de renovação no corpo da resposta, sem cookie
algum.

Entrada bem-sucedida SHALL registrar o usuário retornado, guardar o token
de acesso em memória e o token de renovação em armazenamento seguro do
dispositivo.

Entrada recusada SHALL NOT alterar o estado da sessão nem guardar token
algum.

#### Scenario: Credenciais corretas
- **WHEN** o backend aceita as credenciais
- **THEN** o usuário fica autenticado
- **AND** o token de acesso e o token de renovação recebidos ficam
  guardados

#### Scenario: Credenciais incorretas
- **WHEN** o backend recusa as credenciais
- **THEN** a falha é reportada com a mensagem recebida
- **AND** nenhum token é guardado

### Requirement: Token de renovação em armazenamento seguro do dispositivo

Ao contrário de um navegador, o app não tem um mecanismo próprio que guarde
e envie o token de renovação sozinho — o app SHALL persisti-lo
explicitamente, para que reabrir o app não exija login de novo.

O token de renovação SHALL ser gravado apenas em armazenamento seguro do
sistema operacional (Keychain no iOS, Keystore no Android), nunca em
armazenamento não criptografado do app.

O token de acesso SHALL existir apenas em memória, pelo tempo em que o app
estiver em execução — ele NÃO SHALL ser persistido em nenhuma forma,
inclusive no armazenamento seguro.

Toda leitura e escrita no armazenamento seguro SHALL ser tolerante a
falha: quando o sistema operacional recusa ou não tem o recurso
disponível, o app SHALL continuar funcional, tratando a sessão como
existente apenas enquanto o app estiver em execução.

#### Scenario: Token de renovação nunca em armazenamento não seguro
- **WHEN** o armazenamento do app é inspecionado a qualquer momento
  (`AsyncStorage` ou equivalente não criptografado)
- **THEN** o token de renovação não aparece nele

#### Scenario: Armazenamento seguro indisponível
- **WHEN** o dispositivo recusa ou não oferece o armazenamento seguro
- **THEN** o app continua utilizável
- **AND** a sessão vale apenas enquanto o app estiver em execução, sem
  sobreviver a fechar e reabrir

### Requirement: Restauração validada contra o backend

Ao abrir o app com um token de renovação guardado, a sessão SHALL ser
restaurada trocando-o por um token de acesso novo
(`POST /auth/mobile/refresh`) e, em seguida, confirmada consultando os
dados do usuário autenticado (`GET /users/me`) — nunca considerada válida
só por existir um token guardado.

Enquanto a restauração não retorna, o estado SHALL permanecer
"determinando".

Um token de renovação guardado que o backend recusa SHALL ser tratado
exatamente como sessão inválida, não como um erro à parte.

#### Scenario: Sessão guardada ainda válida
- **WHEN** o app abre com um token de renovação guardado e o backend ainda
  o aceita
- **THEN** um token de acesso novo é obtido e o usuário retornado passa a
  ser o usuário autenticado

#### Scenario: Sessão guardada já inválida
- **WHEN** o app abre com um token de renovação guardado, mas o backend
  recusa a renovação
- **THEN** o token guardado é descartado do armazenamento seguro
- **AND** o estado passa a ser "sem sessão"

#### Scenario: Backend inacessível na abertura
- **WHEN** o app abre com um token de renovação guardado e o backend não
  responde
- **THEN** a sessão não é confirmada nem descartada
- **AND** a falha é apresentada como problema de conexão, distinguível de
  credenciais inválidas

#### Scenario: Sem token guardado
- **WHEN** o app abre sem nenhum token de renovação guardado
- **THEN** o estado é "sem sessão" imediatamente, sem tentar renovar ou
  consultar o backend

### Requirement: Renovação automática ao expirar o token de acesso

Quando uma requisição autenticada é recusada por token de acesso ausente,
inválido ou expirado, a sessão SHALL tentar renovar via
`POST /auth/mobile/refresh` usando o token de renovação guardado, e
repetir a requisição original uma vez.

A renovação bem-sucedida SHALL substituir tanto o token de acesso em
memória quanto o token de renovação no armazenamento seguro pelos novos
valores recebidos — o backend rotaciona o token de renovação a cada uso, e
o app precisa guardar o novo, ao contrário do fluxo web onde a rotação
acontece só por troca de cookie.

A requisição repetida SHALL ser transparente para a tela: ela observa
apenas o resultado final.

#### Scenario: Token de acesso expirado
- **WHEN** uma requisição autenticada é recusada por token expirado e a
  renovação é aceita
- **THEN** a requisição original é repetida com o novo token de acesso
- **AND** o novo token de renovação substitui o anterior no armazenamento
  seguro
- **AND** a tela recebe o resultado como se a primeira tentativa tivesse
  funcionado

#### Scenario: Renovação recusada
- **WHEN** a renovação é recusada pelo backend
- **THEN** a sessão é encerrada localmente, incluindo a remoção do token
  do armazenamento seguro
- **AND** a requisição original é reportada como falha de autenticação

#### Scenario: Uma única repetição
- **WHEN** a requisição repetida também é recusada por autenticação
- **THEN** nenhuma nova renovação é tentada para aquela requisição
- **AND** a sessão é encerrada localmente

### Requirement: Renovação de disparo único

O token de renovação do backend é de uso único, e reapresentar um token já
gasto é tratado como vazamento: o backend revoga todas as sessões ativas
do usuário — as emitidas para web e para mobile igualmente.

Chamadas concorrentes que precisem renovar ao mesmo tempo SHALL convergir
para uma única chamada a `POST /auth/mobile/refresh`: quem encontra uma
renovação em curso SHALL aguardar seu resultado em vez de iniciar outra.

#### Scenario: Duas requisições expiram juntas
- **WHEN** duas requisições autenticadas são recusadas por token expirado
  quase ao mesmo tempo
- **THEN** apenas uma renovação é enviada ao backend
- **AND** as duas requisições são repetidas com o mesmo par de tokens novo

#### Scenario: Restauração e requisição concorrem
- **WHEN** a restauração da sessão ao abrir o app ainda está renovando
  quando alguma outra chamada autenticada já dispara
- **THEN** no máximo uma renovação é enviada ao backend para aquele
  momento

### Requirement: Encerramento de sessão

A sessão SHALL oferecer a operação de sair, que pede ao backend para
revogar o token de renovação (`POST /auth/mobile/logout`, enviando o token
guardado no corpo) e descarta o estado, o token de acesso em memória e o
token de renovação do armazenamento seguro.

O estado local SHALL ser descartado mesmo que a chamada ao backend falhe:
sair é uma intenção do usuário, e um backend inacessível não pode manter
alguém preso em uma sessão que pediu para encerrar.

#### Scenario: Saída com backend disponível
- **WHEN** o usuário sai e o backend confirma a revogação
- **THEN** o estado passa a "sem sessão" e nenhum token permanece guardado

#### Scenario: Saída com backend indisponível
- **WHEN** o usuário sai e a chamada ao backend falha
- **THEN** o estado local passa a "sem sessão" e nenhum token permanece
  guardado, de todo modo

### Requirement: Perda de sessão é percebida pelo app

Quando a sessão é encerrada por decisão do backend — renovação recusada,
sessões revogadas por detecção de reuso, conta excluída — o app SHALL
tratar isso como sessão inexistente e conduzir o usuário à tela de
entrada, sem apresentar tela protegida vazia ou em erro.

#### Scenario: Sessões revogadas pelo backend
- **WHEN** o backend recusa a renovação porque as sessões do usuário foram
  revogadas
- **THEN** o app passa a tratar o usuário como não autenticado
- **AND** conduz à tela de entrada informando que a sessão expirou
