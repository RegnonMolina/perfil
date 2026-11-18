# Handoff da sessão (18/11/2026)

## Local da sessão
- Ambiente: sessão do Claude Code na nuvem (container temporário, apagado quando fica inativo).
- Pasta de trabalho: `/home/user/perfil` (clone de `RegnonMolina/perfil`).
- Branch: `claude/telegram-connection-2a6o5g`, igual a `main` (último commit `7e39643`, merge do PR #23).
- Código do projeto: nada alterado nesta sessão.

## Assunto
Como ligar o Claude Code ao Telegram. Só pesquisa e orientação, nada foi implementado.

## Conclusões
1. **Esta sessão na nuvem não liga ao Telegram.** O recurso Channels (em prévia) funciona apenas no Claude Code local.
2. **Passos (no PC):**
   - Instalar o Bun: `powershell -c "irm bun.sh/install.ps1 | iex"`.
   - No Telegram, @BotFather > `/newbot` > copiar o token.
   - No Claude Code: `/plugin install telegram@claude-plugins-official` (escopo *user*).
   - `/telegram:configure TOKEN` (fica salvo em `~/.claude/channels/telegram/.env`).
   - Abrir com `claude --channels plugin:telegram@claude-plugins-official`.
   - Mandar uma mensagem ao bot, depois `/telegram:access pair CODIGO` e `/telegram:access policy allowlist`.
3. **Custo:** o Telegram é grátis (não precisa de Premium). O uso consome a cota do plano Claude (ou tokens da API). Para o bot responder 24 horas, é preciso uma máquina sempre ligada.
4. **Alternativa recomendada:** Remote Control (`claude remote-control` ou `/rc`), usado pelo app Claude no celular. Não precisa de bot nem de token e tem menos superfície de risco.

## Riscos registrados
- Quem está na allowlist pode aprovar ações no PC. Manter só o próprio ID e nunca usar o bot em grupo.
- Nunca usar `--dangerously-skip-permissions` junto com o Telegram.
- Não trafegar pelo Telegram dado comportamental nominal nem dado de aluno.

## Pendências
- [ ] Decidir entre Telegram (Channels) e Remote Control.
- [ ] Conferir se o plano Claude atual libera Channels. Em Team/Enterprise, um administrador precisa ativar.
- [ ] Conferir a versão mínima do Claude Code (não verificada).
- [ ] Nada foi testado ao vivo. Fonte: code.claude.com/docs/en/channels e code.claude.com/docs/en/remote-control.
