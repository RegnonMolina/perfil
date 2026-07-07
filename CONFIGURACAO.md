# Configuração do Perfil Comportamental

Este projeto tem três partes:

| Arquivo | O que é |
|---|---|
| `index.html` | O questionário que os colaboradores respondem |
| `dashboard.html` | O painel do gestor com todos os resultados |
| `apps-script/Codigo.gs` | O "servidor" (Google Apps Script): salva na planilha, gera a análise com IA e envia os e-mails |

## Passo 1 — Atualizar o Apps Script

1. Abra a sua planilha do Google que recebe as respostas.
2. Vá em **Extensões → Apps Script**.
3. Apague o código antigo e cole todo o conteúdo de `apps-script/Codigo.gs`.
4. Salve (ícone de disquete).

## Passo 2 — Configurar a chave da IA (Claude)

1. Crie uma chave de API em <https://console.anthropic.com> (menu **API Keys**).
   É um serviço pago por uso — cada teste respondido custa cerca de **US$ 0,03** (uns R$ 0,17).
2. No Apps Script, vá em **Configurações do projeto** (ícone de engrenagem) → **Propriedades do script** → **Adicionar propriedade**:
   - Propriedade: `ANTHROPIC_API_KEY`
   - Valor: sua chave (`sk-ant-...`)
3. (Opcional) Adicione também `EMAIL_GESTOR` com o e-mail que deve receber cópia de todos os resultados.

> A chave fica guardada **só no Apps Script** — ela nunca aparece na página pública, então ninguém consegue roubá-la.

## Passo 3 — Reimplantar o App da Web

1. No Apps Script, clique em **Implantar → Gerenciar implantações**.
2. Clique no lápis (editar) da implantação existente → em **Versão**, escolha **Nova versão** → **Implantar**.
   - Executar como: **você**
   - Quem pode acessar: **Qualquer pessoa**
3. Se a URL da implantação **mudou**, atualize a constante `URL_APPS_SCRIPT` no `index.html` e o campo "URL do Apps Script" no dashboard.

> Na primeira execução o Google vai pedir autorização para o script acessar a planilha e enviar e-mails — autorize com a sua conta.

## Passo 4 — Testar

1. Abra o `index.html` e responda um teste completo.
2. Verifique:
   - A tela de resultado mostra os cards de análise da IA ("Quem é você", "Pontos Fortes"...)
   - Chegou uma linha nova na aba **Respostas** da planilha
   - O colaborador e o gestor receberam o e-mail
   - O botão **Baixar PDF** abre a janela de impressão (escolha "Salvar como PDF")
3. Abra o `dashboard.html` e clique em **Atualizar** — os gráficos e a tabela devem carregar.

## O que mudou nesta versão

- **Análise por IA de verdade**: o Apps Script chama o Claude (modelo `claude-opus-4-8`) e devolve os 6 cards de análise personalizados. Antes, as funções eram apenas esqueletos.
- **E-mail automático**: o resultado é enviado por e-mail ao colaborador e ao gestor via `MailApp` (o e-mail sai da sua conta Google — sem precisar de EmailJS).
- **PDF**: o botão "Baixar PDF" gera uma página formatada e abre a impressão do navegador (salvar como PDF).
- **Empates no perfil**: em caso de empate (ex.: mesma pontuação em Colérico e Sanguíneo), o resultado mostra o perfil combinado ("Colérico / Sanguíneo") em vez de escolher um silenciosamente.
- **Correção de bug**: mudar de resposta no Temperamento ou no Eneagrama não infla mais a pontuação (antes, cada clique somava de novo).
- **Dashboard**: gráficos de distribuição (linguagens, temperamentos, setores) e senha do gestor agora funcional.

## Avisos

- A **senha do dashboard** é verificada no navegador: serve para evitar acesso casual, mas não é uma autenticação de verdade. Não publique o dashboard em local público se os dados forem sensíveis.
- O `MailApp` do Google tem limite diário de envio (100 e-mails/dia em contas gratuitas, 1.500/dia no Workspace) — mais que suficiente para o uso normal.
