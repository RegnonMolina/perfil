# Perfil Comportamental — Configuração e Replicação

Sistema de avaliação de perfil comportamental **white-label**: cada colégio coloca a própria marca (nome, logo, cores) no teste, no resultado, no PDF, nos e-mails e no dashboard, editando **um único arquivo** (`config.js`).

## Estrutura do projeto

| Arquivo | O que é |
|---|---|
| `config.js` | **Identidade da organização** — nome, logo, cores, URL do Apps Script, o vocabulário (`contexto`), a privacidade e o card de clima. O único arquivo que cada organização edita. |
| `config.bni.js` | Exemplo de configuração para um grupo de networking, com outro vocabulário |
| `instrumento.js` | **O questionário e o cálculo** — banco de itens dos quatro módulos e as funções de pontuação. Não edite sem rodar `npm test`. |
| `clima.js` | **Card de clima** exibido no topo das páginas (componente reaproveitável) |
| `index.html` | O questionário que as pessoas respondem |
| `dashboard.html` | O painel com todos os resultados e gráficos |
| `apps-script/Codigo.gs` | O "servidor" (Google Apps Script): salva na planilha, gera a análise com IA (Claude) e envia os e-mails |
| `tests/` | Testes automatizados que provam as propriedades do questionário |
| `docs/` | Relatório da correção do instrumento e o convite para refazer o teste |

## O instrumento (v2.0)

São quatro módulos, 75 itens pontuados, cerca de 12 minutos:

| Módulo | Itens | Formato | O que devolve |
|---|---|---|---|
| Linguagens de Valorização | 20 pares | Escolha forçada entre duas | Principal, secundária e distribuição nas 5 linguagens |
| Temperamento | 16 afirmações | Escala 1 a 5 | Principal, secundário e percentual nos 4 temperamentos |
| Eneagrama | 10 fatores | Escolher 2 de 9 alternativas | 1º e 2º lugar entre os 9 tipos, centro de inteligência |
| DISC | 12 blocos | Tétrade MAIS/MENOS | Score dos 4 fatores, dominante, secundário e combinação |

São 58 decisões ao todo, cerca de 12 minutos. Mais um item de atenção, que não
pontua e serve para identificar quem respondeu no automático.

### Sobre o módulo de Eneagrama

Ele é a reconstrução fiel do instrumento já usado na instituição (o documento
`TESTE_ENEAGRAMA`): **10 fatores, 9 alternativas em cada, 90 fichas**, escolhendo
duas por fator — 20 escolhas no total, como manda a folha de tabulação original.

A numeração das fichas (1 a 90) bate com a grade impressa nessa folha, então um
resultado gerado aqui pode ser conferido contra um preenchido no papel. Os textos
das alternativas não foram reescritos.

O resultado traz **primeiro e segundo lugar**, e trata empate como empate — a
própria folha prevê "primeiro lugar (ou empatado em)". Não há cálculo de asa, de
propósito: o instrumento não mede isso, e o segundo colocado não é necessariamente
um tipo vizinho.

> ⚠️ As perguntas são **iguais para todas as organizações**, de propósito: mudar o
> texto dos itens por cliente tornaria os resultados incomparáveis entre si. O que
> muda por organização é o vocabulário da análise (bloco `contexto` do `config.js`).

> Este é um instrumento de autoconhecimento e desenvolvimento. Não é ferramenta de
> seleção, não constitui diagnóstico clínico e não substitui avaliação profissional.

### Se você mexer no questionário

Rode `npm test` antes de publicar. Os testes verificam, entre outras coisas, que
todas as linguagens têm as mesmas chances de pontuar, que nenhum item está
duplicado, que os nove tipos do eneagrama são todos alcançáveis, que as 90 fichas
seguem a numeração da folha original e que o DISC continua balanceado. São
exatamente as falhas que existiam na versão anterior.

---

## Parte 1 — Configurar o SEU colégio

### 1.1 Identidade visual (`config.js`)

Edite o arquivo `config.js` e preencha:

```js
nome: "Colégio Exemplo",
subtitulo: "Avaliação de Perfil Comportamental",
logoUrl: "https://exemplo.com/logo.png",   // ou "" para sem logo
corPrimaria: "#1f4788",     // cor institucional (cabeçalho, títulos)
corSecundaria: "#667eea",   // cor de destaque (botões, seleções)
urlAppsScript: "https://script.google.com/macros/s/SEU_ID/exec",
emailGestor: "gestor@colegioexemplo.com.br",
rodape: "© Colégio Exemplo — Recursos Humanos",

// Vocabulário usado na tela, no e-mail e na análise da IA
contexto: {
  tipoOrganizacao: "uma escola",       // "um grupo de networking", "uma clínica"...
  termoPessoa: "colaborador",          // "membro", "profissional"...
  termoLider: "gestor",                // "líder do capítulo", "coordenador"...
  termoGrupo: "Setor",                 // rótulo do campo de agrupamento
  descricaoAmbiente: "o dia a dia escolar",
  opcoesGrupo: ["Administrativo", "Coordenação", "Professor(a)"]
}
```

O bloco `contexto` é o que permite um único backend atender o colégio e o grupo de
networking sem manter duas cópias do `Codigo.gs`. Veja `config.bni.js` para um
exemplo completo com outro vocabulário.

Essas cores e textos se aplicam automaticamente a **tudo**: teste, tela de resultado, PDF, e-mails e dashboard.

> 💡 Também dá para ajustar pelo botão **⚙️ Personalizar** dentro das páginas — útil para testar cores ao vivo — mas esses ajustes valem só para o navegador de quem mexeu. O que vale para todo mundo é o `config.js`.

### 1.2 Card de clima no topo das páginas

O `clima.js` insere um cartãozinho com a temperatura e a condição do tempo no topo do questionário e do dashboard. Os dados vêm da [Open-Meteo](https://open-meteo.com), que é **gratuita e não exige cadastro nem chave de API**.

Por padrão o card usa a **localização atual do dispositivo** de quem está acessando (o navegador pede permissão na primeira vez). Se a permissão for negada, ignorada ou indisponível, ele cai sozinho para a cidade definida no `config.js` — o card sempre aparece.

Cada pessoa pode ajustar o card pelo botão **⚙** dentro dele: fonte da localização (dispositivo ou cidade fixa), qual cidade e a unidade (°C ou °F). Essa escolha vale só para o navegador dela; o padrão de todo mundo é o do `config.js`:

```js
clima: {
  exibir: true,             // false esconde o card em todas as páginas
  fonte: "dispositivo",     // "dispositivo" = posição atual de quem acessa; "cidade" = a cidade abaixo
  cidade: "Ribeirão Preto", // usada quando fonte é "cidade" e quando o dispositivo não informa a posição
  latitude: null,           // opcional: preencha lat/lon para dispensar a busca pelo nome
  longitude: null,
  unidade: "C",             // "C" (Celsius) ou "F" (Fahrenheit)
  mostrarConfiguracoes: true // false esconde o botão ⚙ do card
}
```

Detalhes de funcionamento:

- **Localização do dispositivo** exige HTTPS (o GitHub Pages já é) e permissão. Se ninguém responder ao aviso do navegador, o card espera 9 segundos e segue com a cidade configurada — se a autorização vier depois, a próxima atualização já usa a posição real.
- **Dentro de um App da Web do Apps Script** (`HtmlService`), a página roda num iframe do Google que costuma bloquear a geolocalização. Nesse caso o card simplesmente usa a cidade do `config.js`.
- O nome do lugar, quando a posição vem do dispositivo, é obtido no serviço gratuito [BigDataCloud](https://www.bigdatacloud.com) (sem cadastro). Se ele não responder, o card mostra "Sua localização" e o resto continua igual.
- **Cache**: posição do dispositivo por 10 minutos, coordenadas de cidade e nome do lugar por 30 dias, tempo por 15 minutos. O dashboard, que costuma ficar aberto, se atualiza sozinho a cada 15 minutos.
- Se houver duas cidades com o mesmo nome e o resultado vier errado, preencha `latitude` e `longitude` — assim a busca por nome é ignorada.
- Se a internet ou a API falhar, o card não aparece; nada mais na página é afetado. O card também não sai na impressão/PDF do resultado.
- Nenhum dado dos colaboradores sai da página: as consultas levam apenas coordenadas.

**Usar em outras páginas/apps.** Basta incluir as duas linhas abaixo no `<head>` e, opcionalmente, um `<div id="clima-topo"></div>` onde o card deve ficar (sem esse `div`, ele entra no topo do `<body>`):

```html
<script src="config.js"></script>
<script src="clima.js" defer></script>
```

Em um app hospedado em outro lugar — inclusive um App da Web do Apps Script feito com `HtmlService` — aponte para a versão publicada no GitHub Pages e defina os padrões antes:

```html
<script>window.CONFIG_ESCOLA = { clima: { fonte: "dispositivo", cidade: "Ribeirão Preto" } };</script>
<script src="https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/clima.js" defer></script>
```

### 1.3 Planilha + Apps Script (banco de dados, IA e e-mail)

1. Crie uma planilha no Google Sheets (ou use a existente).
2. Na planilha: **Extensões → Apps Script** → apague o código e cole todo o conteúdo de `apps-script/Codigo.gs` → salve.
3. **Propriedades do script**: em **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar**:

   | Propriedade | Obrigatória? | Para que serve |
   |---|---|---|
   | `TOKEN_GESTOR` | **Sim** | Senha que autoriza o dashboard a ler os dados. Sem ela, **a leitura fica bloqueada**. |
   | `ANTHROPIC_API_KEY` | Não | Chave da IA (`sk-ant-...`), de <https://console.anthropic.com>. Paga por uso, cerca de **US$ 0,03 (~R$ 0,17) por teste**. Sem ela a análise escrita sai de um banco de textos por perfil embutido no código (gratuito); com ela, a IA gera uma análise personalizada que cruza os quatro módulos. |
   | `EMAIL_GESTOR` | Não | E-mail que recebe cópia de todos os resultados. |
   | `LIMITE_ENVIOS_DIA` | Não | Teto diário de envios (padrão 200). |
   | `LIMITE_EMAILS_DIA` | Não | Teto diário de e-mails (padrão 150). |
   | `PLANILHA_ID` | Não* | ID da planilha de respostas (o trecho entre `/d/` e `/edit` na URL dela). *Obrigatória apenas se o projeto Apps Script for **independente** (criado em script.google.com) em vez de vinculado à planilha (criado por **Extensões → Apps Script**). No CMS há um padrão embutido no código. |

   Para o `TOKEN_GESTOR`, use um valor longo e aleatório — 20 caracteres ou mais.
   Um jeito rápido de gerar: no navegador, aperte F12, cole
   `crypto.randomUUID()` no console e use o resultado.

4. **Implantar → Nova implantação → App da Web**:
   - Executar como: **você**
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a **URL do App da Web** e cole no campo `urlAppsScript` do `config.js`.

> 🔒 A chave da API e o token ficam guardados **só no Apps Script** — nunca aparecem no site público.
> Na primeira execução o Google pedirá autorização para acessar a planilha e enviar e-mails — autorize.

### 1.3.1 Proteção dos dados

Os resultados são dados pessoais: nome, e-mail e um perfil comportamental.
O que protege cada coisa:

| O quê | Como está protegido | Alcance real |
|---|---|---|
| **Ler os resultados** (`?action=read`) | Exige o `TOKEN_GESTOR`, que vive só nas Propriedades do Script | **Protegido.** Sem o token, o servidor não devolve nada. Se a propriedade não estiver configurada, a leitura é recusada — falha fechada. |
| **Enviar respostas** (o formulário) | Consentimento obrigatório, campo-armadilha, teto diário de envios, intervalo mínimo por e-mail e teto diário de e-mails | **Limitado, não impedido.** O formulário é público por natureza. As travas seguram robôs simples e limitam custo, cota de e-mail e volume — não impedem alguém determinado de inserir linhas. |
| **Abrir o dashboard** | Trava de tela opcional, verificada no navegador | **Conveniência apenas.** Serve contra olhares por cima do ombro. Quem realmente protege os dados é o token. |

O token é digitado **uma vez** no dashboard (⚙ Configurar → Token do gestor) e
fica guardado só naquele navegador. **Nunca coloque o token no `config.js`**: esse
arquivo faz parte do site público e qualquer pessoa consegue lê-lo.

Se o token vazar (alguém compartilhou por engano, um computador foi perdido),
troque o valor da propriedade `TOKEN_GESTOR` no Apps Script: todos os dashboards
param de carregar até que o novo valor seja digitado.

> **Proteção mais forte, se você tiver Google Workspace:** implante o app como
> *"Executar como: usuário que acessa"* com acesso restrito ao domínio. Aí a
> leitura passa a exigir login Google da instituição, em vez de um token
> compartilhado. O custo é que o formulário deixa de aceitar quem está fora do
> domínio — o que não serve para o grupo de networking, mas pode servir para o
> colégio.

### 1.3.2 Privacidade e LGPD

Antes de começar o teste, a pessoa lê um aviso e precisa marcar o aceite. O
texto é montado a partir do bloco `privacidade` do `config.js`:

```js
privacidade: {
  controlador: "Colégio Mundo do Saber",
  finalidade: "conhecer melhor o perfil de cada pessoa da equipe e apoiar o desenvolvimento profissional",
  quemAcessa: "a própria pessoa e a coordenação responsável",
  retencao: "enquanto durar o vínculo com a instituição, ou até que a pessoa peça a exclusão",
  contato: "regnon@colegiomundodosaber.com.br",
  urlPolitica: ""
}
```

O aceite é exigido **no servidor**, e não só na tela: o Apps Script recusa
qualquer envio sem `consentimento: true`, então alterar a página no navegador
não contorna a regra. A data e a hora do aceite ficam gravadas na planilha, na
coluna **Consentimento**.

Ao receber um pedido de exclusão pelo canal informado, apague a linha da pessoa
na aba `Respostas v2` (e na `Respostas`, se houver registro antigo).

> Os textos são informativos e devem ser preenchidos com dados reais da sua
> organização. Não são peça jurídica pronta — se houver dúvida sobre a base
> legal aplicável, vale passar por quem cuida do jurídico antes de publicar.

### 1.4 Publicar o site

No GitHub: **Settings → Pages → Branch: main** → salvar. O site fica em `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

### 1.5 Testar

1. Responda um teste completo no `index.html`.
2. Confira: cards de análise da IA no resultado, linha nova na planilha, e-mails recebidos, botão **Baixar PDF** (escolha "Salvar como PDF" na impressão).
3. Abra o `dashboard.html` → **Atualizar**: gráficos e tabela carregam. Se configurar senha, ela é pedida ao abrir.
4. Confira que a planilha ganhou a aba **"Respostas v2"** com o cabeçalho novo, e que a aba **"Respostas"** (histórico da versão anterior) continua intocada.

> As respostas da versão antiga do questionário aparecem no dashboard com o selo
> `v1` e podem ser separadas pelo filtro de versões. Não misture `v1` e `v2` em
> médias ou comparações: os questionários são diferentes. O relatório completo do
> que mudou está em `docs/RELATORIO-INSTRUMENTO-V2.md`, e há um convite pronto para
> pedir que as pessoas refaçam o teste em `docs/CONVITE-REFAZER-TESTE.md`.

---

## Ordem de atualização (importante)

O site e o Apps Script são duas metades da mesma coisa e precisam estar na
mesma versão. **Atualize sempre o Apps Script primeiro, o site depois.**

Se o site subir para a v2 com o Apps Script ainda na v1, o formulário envia
campos que o backend antigo não conhece: DISC, asa, centro e o controle de
qualidade são descartados e a resposta vai para a aba errada — sem erro
nenhum aparecer.

Para que isso não dependa de ninguém lembrar, existem duas travas automáticas:

- **No formulário:** ao abrir a página, ele pergunta a versão ao servidor
  (`?action=versao`). Se as versões não baterem, aparece um aviso vermelho e o
  botão de avançar é desabilitado — a pessoa é impedida de responder 75 itens
  para depois perder o resultado. A conferência é refeita no envio.
- **No fluxo de publicação:** depois do `clasp deploy`, o GitHub Actions
  consulta o endereço público e confere se a versão no ar é a mesma do código.
  Se não for, o fluxo falha em vermelho em vez de dar por publicado.

Ao mudar o formato dos dados, suba o `VERSAO_BACKEND` no `apps-script/Codigo.gs`
junto com a `VERSAO` do `instrumento.js`.

---

## Publicação automática do Apps Script (opcional)

> Enquanto o segredo `CLASPRC_JSON` não existir, este fluxo **falha e o backend
> não é publicado** — o Apps Script continua com o que foi colado à mão no
> editor. Nesse caso, atualize o backend manualmente: **Extensões → Apps
> Script**, cole o conteúdo de `apps-script/Codigo.gs`, e então
> **Implantar → Gerenciar implantações → editar a implantação existente → Nova
> versão** (editar a existente preserva a URL; criar uma nova geraria outro
> endereço e o `config.js` deixaria de apontar para o lugar certo).

Com esta automação, **toda alteração na pasta `apps-script/` que entrar na branch `main` é publicada sozinha** no seu projeto Apps Script — sem copiar e colar. Ela usa o GitHub Actions (arquivo `.github/workflows/deploy-apps-script.yml`) e a ferramenta oficial `clasp` do Google.

### Configuração única (precisa de um computador, ~10 minutos)

1. **Ativar a API do Apps Script** na sua conta Google: abra <https://script.google.com/home/usersettings> e ligue a chave **"API Google Apps Script"**.
2. **Instalar o clasp e fazer login** (no terminal do computador — requer [Node.js](https://nodejs.org) instalado):
   ```bash
   npm install -g @google/clasp@2.4.2
   clasp login
   ```
   O navegador abrirá para você autorizar com a sua conta Google (a mesma dona da planilha).
3. **Copiar a credencial gerada**: abra o arquivo `.clasprc.json` que ficou na sua pasta de usuário
   (Windows: `C:\Users\SEU_USUARIO\.clasprc.json` · Mac/Linux: `~/.clasprc.json`) e copie **todo** o conteúdo.
4. **Criar o segredo no GitHub**: no repositório → **Settings → Secrets and variables → Actions → New repository secret**:
   - Nome: `CLASPRC_JSON`
   - Valor: o conteúdo copiado no passo 3
5. Pronto. Para testar sem esperar um merge: aba **Actions → Publicar Apps Script → Run workflow**.

> ⚠️ Essa credencial dá acesso aos seus projetos Apps Script — guarde-a **somente** como segredo do GitHub (nunca em arquivo do repositório). Se suspeitar de vazamento, revogue em <https://myaccount.google.com/permissions> e faça `clasp login` de novo.

### Em colégios replicados

Cada cópia do projeto aponta para o próprio script. No repositório do outro colégio, ajustar:

- `.clasp.json` → `scriptId` do projeto Apps Script **dele** (na URL do editor: `script.google.com/d/SCRIPT_ID/edit`);
- `.github/workflows/deploy-apps-script.yml` → `DEPLOYMENT_ID` com o ID da implantação **dele** (o trecho `AKfycb...` da URL `/exec`);
- o segredo `CLASPRC_JSON` com o login **dele**.

---

## Parte 2 — Replicar para OUTRO colégio

Cada colégio tem a sua própria cópia independente: site, planilha, chave de IA e custos separados. Passo a passo para o seu amigo:

1. **Copiar o projeto**: no GitHub, abrir o seu repositório → botão **Fork** (ou **Use this template**, se configurado) → agora ele tem a cópia dele.
2. **Personalizar**: editar o `config.js` com nome, logo, cores e (depois do passo 3) a URL do Apps Script **dele**.
3. **Criar o backend próprio**: seguir a Parte 1.3 acima com a planilha e a conta Google **dele** — inclusive a chave da API da Anthropic dele (assim cada colégio paga o próprio consumo).
4. **Publicar**: ativar o GitHub Pages no repositório dele (Parte 1.4).
5. **Testar** (Parte 1.5).

Pronto: o teste dele terá a cara do colégio dele, salvando na planilha dele, sem misturar dados entre colégios.

---

## Perguntas frequentes

**Posso mudar as perguntas?** As perguntas do instrumento ficam em `index.html` (constantes `PERGUNTAS_LINGUAGEM`, `AFIRMACOES_TEMP` e `BLOCOS_ENEAGRAMA`). Recomendamos não alterar, para manter a validade do teste e a comparabilidade entre resultados.

**O card de clima tem custo ou precisa de chave?** Não. Ele usa a API pública da Open-Meteo, sem cadastro e sem chave. Para desligar, coloque `exibir: false` no bloco `clima` do `config.js`.

**Por que o card mostra a cidade do `config.js` em vez de onde estou?** A localização do dispositivo depende de permissão do navegador e de HTTPS, e é bloqueada dentro do iframe do Apps Script. Nesses casos o card usa a cidade configurada. Pelo botão ⚙ dá para fixar outra cidade a qualquer momento.

**Quanto custa?** GitHub Pages, Google Sheets e Apps Script são gratuitos. O único custo é a API da IA: ~US$ 0,03 por teste (100 testes ≈ R$ 17). Sem a chave configurada, tudo funciona normalmente — apenas sem os cards de análise da IA e sem e-mails com análise.

**Limites de e-mail:** o `MailApp` do Google envia até 100 e-mails/dia em contas gratuitas (1.500/dia no Workspace).

**A senha do dashboard é segura?** É uma verificação no navegador: evita acesso casual, mas não é autenticação de verdade. Não divulgue o link do dashboard publicamente se os dados forem sensíveis.
