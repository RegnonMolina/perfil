# Perfil Comportamental

Responda sempre em português do Brasil.

## Objetivo

Sistema de avaliação de perfil comportamental **white-label**: cada organização (colégio, grupo de networking etc.) coloca a própria marca (nome, logo, cores, vocabulário) editando **um único arquivo** (`config.js`), sem duplicar código. Instrumento v2.0: quatro módulos, 75 itens pontuados, ~12 minutos — Linguagens de Valorização, Temperamento, Eneagrama, DISC.

Documentação completa e detalhada já existe em `CONFIGURACAO.md` — **ler esse arquivo antes de mexer em qualquer configuração, publicação ou replicação para outra organização**. Este `CLAUDE.md` é o resumo operacional; `CONFIGURACAO.md` é a referência completa.

## Repositório e infraestrutura

- **GitHub:** `RegnonMolina/perfil`, publicado via GitHub Pages (branch `main`).
- **Apps Script:** `scriptId` `1LfooPF38fIs65DpnqacDiRkyllNU11eC_t95HlFRUCH5ineGk0Gx4_Zl`, `rootDir: apps-script` no `.clasp.json` — o projeto Apps Script real fica em `apps-script/Codigo.gs`.
- **Publicação automática opcional** via GitHub Actions (`.github/workflows/deploy-apps-script.yml`) usando `clasp` — depende do secret `CLASPRC_JSON` no repositório. Sem esse secret, o backend precisa ser colado manualmente no editor do Apps Script.
- Instância usada pelo CMS tem vocabulário próprio; `config.bni.js` é o exemplo de configuração para o BNI Imperador (outro vocabulário, mesmo motor).

## Estrutura de arquivos

| Arquivo | O que é |
|---|---|
| `config.js` | Identidade da organização (nome, logo, cores, URL do Apps Script, vocabulário `contexto`, privacidade, card de clima) — único arquivo que cada organização edita |
| `config.bni.js` | Exemplo de config para o BNI (outro vocabulário) |
| `instrumento.js` | Banco de itens dos 4 módulos e funções de pontuação — **não editar sem rodar `npm test`** |
| `clima.js` | Card de clima reaproveitável (Open-Meteo, sem chave de API) |
| `index.html` | Questionário |
| `dashboard.html` | Painel de resultados e gráficos |
| `apps-script/Codigo.gs` | Backend: salva na planilha, gera análise com IA (Claude) via `ANTHROPIC_API_KEY`, envia e-mails |
| `menubar.js`, `relogio.js` | Componentes de UI compartilhados (barra superior com clima/relógio flip) |
| `tests/` | Testes automatizados que provam propriedades do questionário (linguagens balanceadas, sem itens duplicados, 9 tipos de eneagrama alcançáveis, numeração das 90 fichas do eneagrama bate com a folha original, DISC balanceado) |
| `docs/` | `RELATORIO-INSTRUMENTO-V2.md`, `RELATORIO-ENEAGRAMA-V21.md`, `CONVITE-REFAZER-TESTE.md`, `RELATORIO-SEGURANCA-LGPD.md` |

## Regras críticas — não violar

- **As perguntas do instrumento são iguais para todas as organizações**, de propósito — mudar o texto dos itens por cliente tornaria os resultados incomparáveis entre si. Só o vocabulário (bloco `contexto` do `config.js`) muda por organização.
- **Módulo de Eneagrama é reconstrução fiel de um instrumento em papel** (`TESTE_ENEAGRAMA`): 10 fatores, 9 alternativas cada, 90 fichas numeradas batendo com a folha impressa original. Não renumerar nem reescrever os textos das alternativas.
- **`npm test` é obrigatório antes de publicar qualquer mudança em `instrumento.js`** — os testes existem justamente pra pegar as falhas que existiam na versão anterior.
- **Ordem de atualização obrigatória: Apps Script primeiro, site depois.** Se o site subir pra v2 com o Apps Script ainda na v1, campos novos (DISC, asa, centro, controle de qualidade) são descartados silenciosamente — sem erro aparente. Duas travas automáticas existem pra isso (checagem de versão no formulário via `?action=versao`, e conferência pós-`clasp deploy` no GitHub Actions) — não remover essas travas. Ao mudar o formato de dados, subir `VERSAO_BACKEND` em `Codigo.gs` junto com `VERSAO` em `instrumento.js`.
- **Nunca colocar `TOKEN_GESTOR` nem `ANTHROPIC_API_KEY` no `config.js`** — esse arquivo é público (parte do site no GitHub Pages). Segredos ficam só nas Propriedades do Script do Apps Script.
- **Consentimento LGPD é validado no servidor**, não só na tela — o Apps Script recusa envio sem `consentimento: true`. Não remover essa validação do backend.
- **Editar `.clasp.json` (scriptId) e `DEPLOYMENT_ID` do workflow ao replicar para outra organização** — cada cópia aponta pro próprio projeto Apps Script, planilha e chave de IA.

## Dados sensíveis

Resultados incluem nome, e-mail e perfil comportamental — dados pessoais reais de colaboradores/membros. Ver `docs/RELATORIO-SEGURANCA-LGPD.md` antes de qualquer mudança que toque coleta, armazenamento ou exclusão de dados. Pedido de exclusão de um respondente = apagar a linha dele na aba `Respostas v2` (e `Respostas`, se houver registro antigo da v1).

## Regras gerais

Seguem os padrões globais em `.claude/rules/coding-standards.md` e `.claude/rules/security.md`. Modo preservação total ao alterar código existente.
