# perfil - Perfil Comportamental (Perfil Expresso v3.0)

Preferências gerais em `~/.claude/CLAUDE.md` (não repetir aqui). Guia completo de configuração e replicação: `CONFIGURACAO.md`.

## O que é
Sistema white-label de perfil comportamental: 21 perguntas (até 23 com desempates), ~4 min. Devolve Linguagens de Valorização, DISC, Temperamento (derivado do DISC) e Eneagrama (hipótese inicial, nunca veredito). Não é ferramenta de seleção, promoção ou avaliação de desempenho, e não foi validado cientificamente.

## Arquitetura
- Front estático em GitHub Pages (repo `RegnonMolina/perfil`, branch `main`). Este é o sistema real de perfil comportamental (o `13_PERFIL_COMPORTAMENTAL_WEBAPP` é legado).
- Back em Apps Script (`apps-script/Codigo.gs`, ~1.000+ linhas): grava na planilha, gera análise com IA (Claude) e envia e-mails.
- `.clasp.json` na raiz (scriptId, `rootDir: apps-script`). Deploy no deployment fixo pelo workflow `.github/workflows/deploy-apps-script.yml` (ID no próprio arquivo; é o mesmo da URL pública, nunca criar deployment novo).

## Arquivos-chave
- `config.js`: única edição por organização (nome, logo, cores, `urlAppsScript`, bloco `contexto`). `config.bni.js`: exemplo BNI.
- `expresso.js` (roteiro e cálculo) e `instrumento.js` (banco de itens, cálculo v2.1 arquivado): só editar rodando `npm test`.
- `index.html` (questionário), `dashboard.html` (painel), `clima.js`, `menubar.js`, `relogio.js`.
- `arquivo/teste-completo-v2.1.html`: arquivado, não recebe respostas (trava de versão no backend).
- `docs/`: relatórios do instrumento, segurança/LGPD e convite para refazer o teste.

## Comandos
- Testes: `npm test` (node --test em `tests/*.test.js`). Rodar antes de publicar qualquer mudança em questionário, cálculo ou backend. CI: `.github/workflows/testes.yml`.
- Push em `main` que toque `apps-script/**`, `.clasp.json` ou `config.js` publica o Apps Script sozinho.

## Regras do projeto
- Perguntas iguais para todas as organizações, de propósito (senão os resultados deixam de ser comparáveis). O que muda por organização é o vocabulário (`contexto` no `config.js`).
- Front e backend precisam estar na mesma versão; divergência grava resposta incompleta em silêncio.
- E-mail (`enviarEmails`, `Codigo.gs`): resultado vai para `dados.email` (a pessoa) e cópia completa para `email_gestor` ou propriedade `EMAIL_GESTOR`. Há teto diário (`LIMITE_EMAILS_DIA`); estourado, a resposta é gravada sem envio. Não foi conferida a validação do campo e-mail no `index.html`.
- Dado comportamental nominal: acesso restrito a `regnon@`/`diretoria@` por padrão. Segredos só em Script Properties, nunca no repo.
- Preservação total no Apps Script (`rules/apps-script-preservacao.md`): nada removido ou renomeado sem pedido. Bug: skill `diagnostico`.
- Personagem do cinema: a IA escolhe no envio (`personagem`, `personagem_obra`, `personagem_motivo`; 3 colunas no fim da aba "Respostas v3"). Aparece no resultado, PDF, e-mail e na ficha do dashboard. Respostas antigas e análise sem IA ficam sem personagem.
- Dashboard: clicar numa linha/card abre a ficha; `paraGestor()` troca "você" pelo primeiro nome nos textos "Quem é/Pontos fortes/A desenvolver" (possessivos seu/sua ficam como estão).
- Documentação (`CONFIGURACAO.md`, este arquivo) atualizada no mesmo turno em que o código muda.

## Estado
- Sem `SESSION_HANDOFF.md` (criado em 29/09/2026 apenas este CLAUDE.md). Git em `main`, em dia com a origem; `desktop.ini` não rastreados são ruído do Drive.
