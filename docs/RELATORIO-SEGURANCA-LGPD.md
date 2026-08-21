# Relatório — Proteção dos dados, LGPD e publicação

Data: 21/08/2026
Escopo: pendências deixadas em aberto pelo `RELATORIO-INSTRUMENTO-V2.md`.

---

## 1. A base de dados estava aberta

**Como estava:** `doGet ?action=read` devolvia todas as linhas — nome, e-mail,
agrupamento e a análise comportamental completa de cada pessoa — para qualquer
um que conhecesse a URL. E a URL está no `config.js`, que faz parte de um site
público: bastava abrir o código-fonte da página. A senha do dashboard não
mudava nada, porque era comparada em JavaScript no navegador, depois de os
dados já terem sido baixados.

**Como ficou:** a leitura exige a propriedade `TOKEN_GESTOR`, definida nas
Propriedades do Script e digitada uma vez pelo gestor no dashboard. A
comparação é feita em tempo constante, para não revelar o token caractere a
caractere.

O detalhe que mais importa: **falha fechada**. Se a propriedade não estiver
configurada, a leitura é recusada com uma mensagem explicando o que fazer. O
comportamento oposto — liberar quando não há token — transformaria um
esquecimento de configuração em base aberta, que é exatamente o problema que
estamos consertando.

O token **nunca** entra no `config.js`. Esse arquivo é público; qualquer segredo
ali seria a mesma encenação da senha anterior.

## 2. O formulário estava sem nenhum limite

**Como estava:** qualquer um podia enviar quantas requisições quisesse. Cada uma
gerava uma chamada paga à API da Anthropic, gravava uma linha na planilha e
fazia a conta Google da instituição disparar e-mails para endereços arbitrários
— um relé de spam com a marca da escola.

**Como ficou:**

| Trava | O que faz |
|---|---|
| Validação de entrada | Recusa envio sem nome ou com e-mail malformado |
| Campo-armadilha | Campo invisível que só um robô preencheria. Responde "ok" sem gravar, para não ensinar ao robô o que o denunciou |
| Intervalo mínimo | O mesmo e-mail não envia duas vezes em menos de 2 minutos. Guarda só o resumo criptográfico do e-mail, nunca o e-mail em claro |
| Teto diário de envios | Padrão 200/dia, configurável. Conferido **antes** da chamada à IA, que é a parte que custa |
| Teto diário de e-mails | Padrão 150/dia. Ao estourar, a resposta continua sendo gravada — só o e-mail não sai |

**O que isto não resolve, e é importante dizer:** o formulário é público por
natureza. Qualquer segredo colocado no site estático apareceria no código-fonte.
Estas travas seguram robôs simples e limitam o estrago — custo, cota de e-mail,
volume — mas **não impedem alguém determinado de inserir linhas**. Proteção real
na escrita exigiria login, o que fecharia o formulário para quem não tem conta
na organização.

## 3. Não havia consentimento nem aviso de privacidade

**Como ficou:** antes de começar, a pessoa lê um aviso montado a partir do bloco
`privacidade` do `config.js` — quem é o responsável, para quê os dados são
usados, quem vê o resultado, por quanto tempo ficam guardados e como pedir
acesso, correção ou exclusão. Precisa marcar o aceite para prosseguir.

O aceite é exigido **no servidor**, não só na tela: o Apps Script recusa
qualquer envio sem `consentimento: true`. Alterar a página no navegador não
contorna a regra. A data e a hora do aceite são gravadas na planilha.

O aviso também diz, com todas as letras, que o instrumento **não é usado para
seleção, promoção ou avaliação de desempenho** — o que é a postura correta e
também reduz risco jurídico.

## 4. A armadilha da ordem de publicação

**O risco:** o site e o Apps Script são duas metades da mesma coisa. Se o site
subisse para a v2 com o backend ainda na v1, o formulário enviaria campos que o
backend antigo não conhece: DISC, asa, centro e o controle de qualidade seriam
descartados e a resposta iria para a aba errada — sem erro nenhum aparecer,
contaminando justamente o histórico que separamos de propósito.

**Como ficou:** duas travas automáticas, para não depender de ninguém lembrar.

- **No formulário:** ao abrir a página, ele pergunta a versão ao servidor
  (`?action=versao`, rota pública que não expõe dado nenhum). Divergindo, mostra
  um aviso e desabilita o botão de avançar — a pessoa é impedida de responder 75
  itens para depois perder o resultado. A conferência é refeita no envio.
- **Na publicação:** depois do `clasp deploy`, o GitHub Actions consulta o
  endereço público e confere se a versão no ar é a do código. Se não for, falha
  em vermelho em vez de dar por publicado.

## 5. O deploy do backend nunca funcionou

**Descoberta:** a única execução do fluxo "Publicar Apps Script", de 18/08/2026,
falhou com `Segredo CLASPRC_JSON não configurado`. Ou seja: o backend em
produção é o que foi colado à mão no editor, e nenhuma alteração da pasta
`apps-script/` jamais chegou lá sozinha.

**O que dá para fazer daqui:** o segredo depende de credenciais da conta Google
do dono da planilha — não é algo que eu consiga criar. O que foi feito:

- A mensagem de erro agora explica a consequência ("o backend NÃO foi publicado
  e continua na versão antiga"), em vez de só apontar o segredo faltante.
- Um passo novo confere se o `DEPLOYMENT_ID` do fluxo aparece na `urlAppsScript`
  do `config.js`. Sem isso, um ID divergente publicaria numa URL que o site não
  usa: o deploy "passaria" e o backend em produção seguiria antigo.
- Outro passo lê a `VERSAO_BACKEND` do código e confere, depois da publicação,
  se é essa a versão que responde no endereço público — com algumas tentativas,
  porque a propagação leva alguns segundos.
- O `CONFIGURACAO.md` ganhou a alternativa manual, com o detalhe que costuma
  passar batido: **editar a implantação existente**, e não criar uma nova, é o
  que preserva a URL.

---

## 6. Testes

`npm test` — **55 testes**, todos passando.

Os 16 novos rodam o `Codigo.gs` de verdade dentro de um simulador dos serviços
do Google (`tests/apoio/apps-script-falso.js`), exercitando `doGet` e `doPost`
como o navegador faria. Cobrem, entre outros:

- leitura recusada sem token, com token errado, com token parcial e — o mais
  importante — **quando a propriedade não está configurada**;
- que a mensagem de erro não vaza nenhuma linha junto;
- que a rota de versão é pública mas não expõe dado pessoal;
- envio sem consentimento recusado, e consentimento ausente tratado como recusa;
- campo-armadilha descartando sem gravar e sem denunciar a trava;
- teto de envios cortando **antes** da chamada à API paga;
- teto de e-mails parando o envio mas preservando a resposta da pessoa;
- que nenhum envio novo escreve na aba do instrumento antigo.

Além deles, três baterias em navegador real (Chromium):

- **Formulário** (13 verificações): consentimento obrigatório, aviso montado a
  partir do `config.js`, campo-armadilha invisível, bloqueio por backend
  desatualizado e payload levando consentimento e data do aceite.
- **Dashboard** (6 verificações): sem token não chega a chamar o servidor, com
  token o token vai na chamada e os dados aparecem, token recusado mostra o
  motivo e nenhum dado.
- **Instrumento** (10 verificações): os quatro módulos até a tela de resultado.

---

## 7. O que ainda fica em aberto

1. **`CLASPRC_JSON`** continua sem existir — depende de você. Até lá, o backend
   precisa ser publicado manualmente.
2. **Escrita no formulário** segue limitada, não impedida (ver item 2).
3. **O token é compartilhado**, não individual: não dá para saber qual gestor
   leu o quê, e trocá-lo obriga todos a redigitar. A alternativa mais forte
   (login Google restrito ao domínio) está documentada no `CONFIGURACAO.md`.
4. **O token viaja na URL** da requisição, então pode aparecer em históricos e
   logs intermediários. Cabeçalho seria melhor, mas o Apps Script não aceita
   cabeçalho personalizado sem transformar a chamada num *preflight* CORS que
   ele não responde.
5. **Modelo da IA** segue `claude-opus-4-8`. Trocar por um modelo menor reduziria
   bastante o custo por teste — é decisão sua, não fiz.
6. **Textos de privacidade** são informativos e foram preenchidos com dados da
   escola. Não são peça jurídica; vale uma revisão de quem cuida do jurídico
   antes de convidar todo mundo.
