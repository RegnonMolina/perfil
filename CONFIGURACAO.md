# Perfil Comportamental — Configuração e Replicação

Sistema de avaliação de perfil comportamental **white-label**: cada colégio coloca a própria marca (nome, logo, cores) no teste, no resultado, no PDF, nos e-mails e no dashboard, editando **um único arquivo** (`config.js`).

## Estrutura do projeto

| Arquivo | O que é |
|---|---|
| `config.js` | **Identidade do colégio** — nome, logo, cores, URL do Apps Script. O único arquivo que cada colégio edita. |
| `clima.js` | **Card de clima** exibido no topo das páginas (componente reaproveitável) |
| `index.html` | O questionário que os colaboradores respondem |
| `dashboard.html` | O painel do gestor com todos os resultados e gráficos |
| `apps-script/Codigo.gs` | O "servidor" (Google Apps Script): salva na planilha, gera a análise com IA (Claude) e envia os e-mails |

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
rodape: "© Colégio Exemplo — Recursos Humanos"
```

Essas cores e textos se aplicam automaticamente a **tudo**: teste, tela de resultado, PDF, e-mails e dashboard.

> 💡 Também dá para ajustar pelo botão **⚙️ Personalizar** dentro das páginas — útil para testar cores ao vivo — mas esses ajustes valem só para o navegador de quem mexeu. O que vale para todo mundo é o `config.js`.

### 1.2 Card de clima no topo das páginas

O `clima.js` insere um cartãozinho com a temperatura, a condição do tempo e a mínima/máxima do dia no topo do questionário e do dashboard. Os dados vêm da [Open-Meteo](https://open-meteo.com), que é **gratuita e não exige cadastro nem chave de API**.

Para ajustar, edite o bloco `clima` do `config.js`:

```js
clima: {
  exibir: true,          // false esconde o card em todas as páginas
  cidade: "Campinas",    // cidade do colégio
  latitude: null,        // opcional: preencha lat/lon para dispensar a busca pelo nome
  longitude: null
}
```

Detalhes de funcionamento:

- As coordenadas da cidade são descobertas uma vez e guardadas no navegador por 30 dias; o tempo é reconsultado a cada 15 minutos (o dashboard, que costuma ficar aberto, se atualiza sozinho nesse intervalo).
- Se houver duas cidades com o mesmo nome e o resultado vier errado, preencha `latitude` e `longitude` — assim a busca por nome é ignorada.
- Se a internet ou a API falhar, o card simplesmente não aparece; nada mais na página é afetado.
- O card não é impresso no PDF do resultado.
- Nenhum dado dos colaboradores sai da página: a consulta leva apenas as coordenadas da cidade.

**Usar em outras páginas/apps.** Basta incluir as duas linhas abaixo no `<head>` e, opcionalmente, um `<div id="clima-topo"></div>` onde o card deve ficar (sem esse `div`, ele entra no topo do `<body>`):

```html
<script src="config.js"></script>
<script src="clima.js" defer></script>
```

Em um app hospedado em outro lugar — inclusive um App da Web do Apps Script feito com `HtmlService` — aponte para a versão publicada no GitHub Pages e defina a cidade antes:

```html
<script>window.CONFIG_ESCOLA = { clima: { cidade: "São Paulo" } };</script>
<script src="https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/clima.js" defer></script>
```

### 1.3 Planilha + Apps Script (banco de dados, IA e e-mail)

1. Crie uma planilha no Google Sheets (ou use a existente).
2. Na planilha: **Extensões → Apps Script** → apague o código e cole todo o conteúdo de `apps-script/Codigo.gs` → salve.
3. **Chave da IA**: crie uma chave em <https://console.anthropic.com> (menu API Keys). É paga por uso — cerca de **US$ 0,03 (~R$ 0,17) por teste respondido**. No Apps Script: **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar**:
   - `ANTHROPIC_API_KEY` = sua chave (`sk-ant-...`)
   - `EMAIL_GESTOR` = e-mail padrão do gestor (opcional)
4. **Implantar → Nova implantação → App da Web**:
   - Executar como: **você**
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a **URL do App da Web** e cole no campo `urlAppsScript` do `config.js`.

> 🔒 A chave da API fica guardada **só no Apps Script** — nunca aparece no site público.
> Na primeira execução o Google pedirá autorização para acessar a planilha e enviar e-mails — autorize.

### 1.4 Publicar o site

No GitHub: **Settings → Pages → Branch: main** → salvar. O site fica em `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

### 1.5 Testar

1. Responda um teste completo no `index.html`.
2. Confira: cards de análise da IA no resultado, linha nova na planilha, e-mails recebidos, botão **Baixar PDF** (escolha "Salvar como PDF" na impressão).
3. Abra o `dashboard.html` → **Atualizar**: gráficos e tabela carregam. Se configurar senha, ela é pedida ao abrir.

---

## Publicação automática do Apps Script (opcional)

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

**Quanto custa?** GitHub Pages, Google Sheets e Apps Script são gratuitos. O único custo é a API da IA: ~US$ 0,03 por teste (100 testes ≈ R$ 17). Sem a chave configurada, tudo funciona normalmente — apenas sem os cards de análise da IA e sem e-mails com análise.

**Limites de e-mail:** o `MailApp` do Google envia até 100 e-mails/dia em contas gratuitas (1.500/dia no Workspace).

**A senha do dashboard é segura?** É uma verificação no navegador: evita acesso casual, mas não é autenticação de verdade. Não divulgue o link do dashboard publicamente se os dados forem sensíveis.
