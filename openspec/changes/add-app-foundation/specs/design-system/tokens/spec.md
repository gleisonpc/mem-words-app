## Purpose

Define o vocabulário visual compartilhado do app — cor, tipografia,
espaçamento, raio e transição — como tokens nomeados por papel semântico, de
modo que a aparência seja alterável em um único lugar e permaneça consistente
entre temas, com paridade de significado em relação aos tokens do
`mem-words-frontend` (web).

## ADDED Requirements

### Requirement: Tokens nomeados por papel semântico

O sistema SHALL expor os tokens de cor por papel semântico (a função que a
cor cumpre na interface), não por aparência literal.

Um token SHALL ser nomeado pelo que ele significa — superfície, texto,
borda, ação primária, estado de perigo — e NÃO pela cor que carrega.

#### Scenario: Token nomeado pela função
- **WHEN** um token representa a cor de fundo de um cartão
- **THEN** seu nome descreve o papel (superfície), não o valor
- **AND** o mesmo nome permanece correto no tema escuro, onde o valor é
  escuro

#### Scenario: Componente não referencia cor literal
- **WHEN** qualquer componente da interface precisa de uma cor
- **THEN** ele referencia um token do tema, nunca um valor de cor escrito
  diretamente no componente

### Requirement: Temas claro e escuro sobre os mesmos nomes

O sistema SHALL oferecer tema claro e tema escuro. Por padrão ("do
sistema"), o tema ativo SHALL seguir a preferência de aparência do sistema
operacional.

O sistema SHALL permitir fixar manualmente o tema claro ou o tema escuro,
substituindo a preferência do sistema operacional enquanto essa escolha
estiver ativa. A escolha manual SHALL persistir no dispositivo entre
aberturas do app.

Ambos os temas SHALL definir exatamente o mesmo conjunto de nomes de token,
variando apenas os valores.

#### Scenario: Preferência do sistema é respeitada
- **WHEN** o dispositivo está com aparência escura e nenhum tema foi fixado
  manualmente
- **THEN** o app é exibido com os valores do tema escuro

#### Scenario: Tema fixado manualmente prevalece sobre o sistema
- **WHEN** o tema escuro é fixado manualmente, mesmo com o dispositivo em
  aparência clara
- **THEN** o app é exibido com os valores do tema escuro

#### Scenario: Escolha manual persiste entre aberturas
- **WHEN** o app é reaberto depois de um tema ter sido fixado manualmente
- **THEN** o mesmo tema continua ativo, sem exigir escolher de novo

#### Scenario: Conjuntos de tokens são simétricos
- **WHEN** um token é definido em um dos temas
- **THEN** o mesmo nome está definido no outro tema

### Requirement: Contraste acessível

Toda combinação de texto sobre fundo oferecida pelos tokens SHALL atingir,
no mínimo, a razão de contraste 4.5:1 (WCAG 2.1 AA, texto normal) em ambos
os temas.

Elementos não textuais que transmitem informação (borda de campo, anel de
foco, indicador de estado) SHALL atingir no mínimo 3:1 contra o fundo
adjacente.

#### Scenario: Texto sobre superfície
- **WHEN** um texto usa o token de cor de texto sobre o token de superfície
- **THEN** o contraste entre os dois é de ao menos 4.5:1, em ambos os temas

### Requirement: Escalas para dimensões não cromáticas

O sistema SHALL expor escalas discretas e nomeadas para espaçamento, tamanho
de fonte, peso de fonte e raio de borda.

Valores fora dessas escalas NÃO SHALL ser usados pela interface.

#### Scenario: Espaçamento vem da escala
- **WHEN** um componente precisa de espaçamento interno ou externo
- **THEN** o valor usado é um degrau da escala de espaçamento

### Requirement: Movimento respeita preferência de redução

Animações e transições SHALL ser suprimidas ou reduzidas a uma duração
imperceptível quando o sistema operacional reporta preferência por redução
de movimento.

#### Scenario: Usuário pediu menos movimento
- **WHEN** o dispositivo está com redução de movimento ativa
- **THEN** transições e animações do app são desativadas ou reduzidas
- **AND** nenhuma informação é perdida pela ausência da animação
