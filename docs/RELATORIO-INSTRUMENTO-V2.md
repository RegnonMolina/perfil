# Relatório — Correção do instrumento (v1 → v2.0)

Data: 21/08/2026
Escopo autorizado: PROBLEMAS 1 a 8 do diagnóstico + DISC + vocabulário por organização.
Versão reduzida (75 itens) escolhida na etapa de autorização.

---

## 1. O que estava errado e o que mudou

### PROBLEMA 1 — Itens que não mediam nada

Na v1, três dos trinta pares de linguagem tinham as duas alternativas pertencendo
à mesma letra (`index.html:612`, `:617`, `:623`): itens 16 (A/A), 21 (D/D) e 27 (B/B).
A pontuação era idêntica independentemente da escolha — três pontos distribuídos
por decreto para todo respondente.

**Agora:** o banco de itens foi refeito em `instrumento.js`. Nenhum item tem as duas
alternativas da mesma linguagem, e o teste `Linguagem: nenhum item degenerado`
falha se alguém reintroduzir um.

### PROBLEMA 2 — Itens duplicados

Os itens 13 e 23 eram idênticos entre si, assim como os 14 e 24 — a preferência
correspondente pesava o dobro.

**Agora:** cada par aparece com conteúdo próprio. Dois testes cobrem isso: nenhum
item repetido e nenhum texto de alternativa repetido entre itens.

### PROBLEMA 3 — Escala estruturalmente viciada

Contagem das oportunidades de pontuação na v1:

| Letra | Linguagem | v1 | v2 |
|---|---|---|---|
| A | Palavras de afirmação | 12 | 8 |
| B | Tempo de qualidade | **18** | 8 |
| C | Presentes / Mimos | 12 | 8 |
| D | Atos de serviço | 12 | 8 |
| E | Presença / Acolhimento | **6** | 8 |

"Tempo de qualidade" tinha teto três vezes maior que "Presença/Acolhimento" —
o vencedor era em parte decidido pelo desenho, não pelas respostas.

**Agora:** desenho de blocos balanceados. Com 5 linguagens existem 10 pares
possíveis; cada par aparece 2 vezes, com conteúdos diferentes, totalizando 20 itens.
Cada linguagem disputa contra cada uma das outras exatamente 2 vezes e aparece em
8 itens. Os lados (esquerda/direita) também são contrabalanceados, para neutralizar
a tendência de escolher a primeira opção.

Três testes garantem a propriedade: exposição igual, todos os pares presentes na
mesma quantidade, e lados contrabalanceados.

### PROBLEMA 4 — Temperamento com base estreita e viés de aquiescência

A v1 tinha 3 afirmações por temperamento, todas positivas, somadas em bruto: quem
marcava notas altas em tudo pontuava alto nos quatro.

**Agora:** 4 afirmações por temperamento (as 12 originais foram preservadas na
íntegra; 4 novas completam o equilíbrio) e o resultado passa a ser reportado em
**percentual do total**, que neutraliza a aquiescência. O teste
`o percentual neutraliza quem marca a mesma nota alta em tudo` demonstra:
alguém que responde 5 em tudo e alguém que responde 2 em tudo produzem brutos
diferentes e o mesmo perfil relativo (25% em cada).

Passou também a haver **temperamento secundário**, porque quase ninguém é 100%
um temperamento só.

### PROBLEMA 5 — O "Eneagrama" não era um eneagrama

Os 10 blocos da v1 ofereciam sempre as mesmas duas alternativas, e o cálculo
(`posicao + 1`) só conseguia devolver "Tipo 1" ou "Tipo 2". Os tipos 3 a 9 eram
inalcançáveis — e esse rótulo ia para a planilha, o PDF, o e-mail e o prompt da IA
como se fosse um tipo eneagrámico legítimo.

**Agora:** 27 afirmações em escala 1 a 5, 3 por tipo, cobrindo os nove tipos. A saída
traz tipo principal, **asa** (o tipo vizinho mais pontuado no círculo, onde 9 e 1 são
vizinhos), **centro de inteligência** (Instintivo / Emocional / Mental) e a pontuação
dos nove tipos.

O teste `TODOS os 9 tipos são alcançáveis` percorre os nove e prova que para cada um
existe um padrão de resposta que o elege — exatamente o que a v1 não conseguia fazer.

### PROBLEMA 6 — DISC (novo)

Formato de **tétrades de escolha forçada**: 12 blocos de 4 palavras, uma de cada
fator, nos quais a pessoa marca a que MAIS e a que MENOS tem a ver com ela.
Score = (vezes como MAIS) − (vezes como MENOS), faixa de −12 a +12.

O equilíbrio é garantido pela construção: cada fator aparece uma vez em cada bloco,
portanto 12 oportunidades para cada. A saída traz os quatro scores, uma escala de
leitura de 0 a 100, fator dominante, secundário e um nome de combinação de autoria
própria (ex.: `CS — Guardião`).

### PROBLEMA 7 — Controle de qualidade da resposta

Três marcadores, gravados junto com o resultado e exibidos no dashboard:

- **Straight-lining** — a mesma nota em todas as 43 afirmações de escala.
- **Tempo** — preenchimento em menos de 4 minutos.
- **Item de atenção** — uma afirmação que pede explicitamente a nota 1. Não pontua.

Nenhum deles bloqueia ninguém: a resposta é gravada com status `OK` ou `Revisar`,
e o alerta aparece na tela de resultado, no e-mail e no dashboard.

### PROBLEMA 8 — Versionamento e histórico

A aba **"Respostas"** (v1) não é mais escrita nem alterada — o histórico fica intacto.
As respostas novas vão para a aba **"Respostas v2"**, com colunas para DISC, asa,
centro, qualidade e versão do instrumento.

O dashboard lê as duas abas, marca cada linha com um selo de versão (o `v1` vem com
tooltip explicando que não é comparável) e ganhou um filtro de versão.

---

## 2. Vocabulário por organização (CMS × BNI)

Antes, o prompt da IA dizia literalmente "colaborador de uma escola" e "ambiente
escolar" dentro do `Codigo.gs`, o que obrigava a manter uma cópia separada do
backend para o grupo de networking.

Agora esse vocabulário sai do `config.js`, no bloco `contexto`:

```js
contexto: {
  tipoOrganizacao: "uma escola",
  termoPessoa: "colaborador",
  termoLider: "gestor",
  termoGrupo: "Setor",
  descricaoAmbiente: "o dia a dia escolar",
  opcoesGrupo: [ ... ]
}
```

Ele alimenta o rótulo e as opções do campo de agrupamento na tela, os rótulos do
dashboard, o corpo do e-mail e o prompt da IA. `config.bni.js` traz o exemplo pronto
para o grupo de networking (membro / líder do capítulo / categoria profissional).

**As perguntas do teste continuam iguais para todas as organizações**, de propósito:
mudar o texto dos itens por cliente tornaria os resultados incomparáveis entre si.

---

## 3. Defeitos encontrados durante a correção

Dois problemas reais apareceram ao rodar o sistema, não na leitura do código:

**a) Empate ilegível nas linguagens.** Como o desenho agora é perfeitamente
contrabalanceado, escolher sempre a opção da esquerda empata as cinco linguagens em
4 pontos — o que prova que o equilíbrio funciona. Mas o texto saía como
"Palavras de afirmação / Tempo de qualidade / Presentes / Mimos / ...", ilegível,
ainda mais porque um dos nomes já contém barra. Agora: empate de dois é reportado
como "A e B"; empate de três ou mais vira "Perfil equilibrado — sem linguagem
dominante", que é mais honesto. Três testes cobrem isso.

**b) `undefined` vazando para o e-mail.** Um campo ausente era concatenado antes da
verificação (`dados.linguagem + ""` resulta em `"undefined"`, que é texto verdadeiro),
então uma resposta sem DISC gerava a linha "DISC: undefined" no e-mail. Corrigido
com a função `composto()`. Encontrado pelo teste `O e-mail omite as linhas de campos
que não vieram`.

**c) "Presentes / Mimos" truncado no dashboard.** Já era um defeito da v1: o código
cortava o valor no primeiro `" / "` para lidar com empates, o que transformava a
linguagem "Presentes / Mimos" em "Presentes" — sem cor no badge e agrupada errado
nos gráficos e filtros. Agora a função `principal()` confere primeiro a lista de
nomes conhecidos.

---

## 4. Tamanho do instrumento

| Módulo | v1 | v2 | Formato |
|---|---|---|---|
| Linguagem de Valorização | 30 (viesados) | 20 | Pares balanceados, 10 pares × 2 |
| Temperamento | 12 | 16 | Escala 1–5, 4 por fator |
| Eneagrama | 10 (inválido) | 27 | Escala 1–5, 3 por tipo |
| DISC | — | 12 | Tétrade MAIS/MENOS |
| **Total pontuado** | 52 | **75** | + 1 item de atenção |

Tempo estimado: 11 a 13 minutos. A opção autorizada foi a versão reduzida; 75 é o
piso que mantém as propriedades de validade dos quatro módulos — abaixo disso o
eneagrama cairia para menos de 3 afirmações por tipo e o DISC perderia resolução
a ponto de empatar com frequência.

Como o questionário ficou mais longo que o de antes em número de decisões, as
respostas passam a ser salvas automaticamente neste navegador, com opção de retomar
de onde parou. O rascunho só é descartado depois da confirmação de que o servidor
gravou — se o envio falhar, as respostas continuam disponíveis.

---

## 5. Testes

`npm test` — 39 testes, todos passando. Rodam também no CI
(`.github/workflows/testes.yml`) a cada push e pull request.

Os testes não conferem apenas digitação: eles **provam as propriedades de validade**
do desenho. Se alguém alterar o banco de itens e quebrar o equilíbrio entre fatores,
duplicar um item ou tornar um tipo do eneagrama inalcançável, o CI acusa antes de a
alteração chegar em produção.

Além deles, foram feitos dois testes de fumaça em navegador real (Chromium):
percorrer as 9 telas respondendo os 75 itens pela interface até o resultado, e
renderizar o dashboard com linhas v1 e v2 convivendo.

---

## 6. Como testar manualmente

1. **Questionário completo:** abra o `index.html`, responda os quatro blocos e confira
   na tela de resultado se aparecem os quatro módulos, com asa e centro no eneagrama
   e os quatro scores do DISC.
2. **Retomada:** responda metade, feche a aba, abra de novo — deve aparecer a faixa
   verde "Continuar de onde parei".
3. **Controle de qualidade:** responda tudo com a mesma nota, ou muito rápido, e
   confira o aviso amarelo na tela de resultado.
4. **Item de atenção:** na segunda tela do eneagrama, a última afirmação pede a nota 1.
   Marque outra nota e confira o alerta.
5. **Planilha:** confira que a aba "Respostas v2" foi criada com o cabeçalho novo e
   que a aba "Respostas" original continua intocada.
6. **E-mail:** confira as quatro linhas de resultado e o aviso de uso no rodapé.
7. **Dashboard:** clique em Atualizar e confira o gráfico de DISC, o de Eneagrama, a
   coluna DISC, o selo de versão e o filtro de versões.
8. **BNI:** troque o `config.js` pelo `config.bni.js` e confira que o campo de
   agrupamento passa a se chamar "Categoria profissional" com as opções do grupo, e
   que a análise da IA fala em "membro" e "líder do capítulo".

---

## 7. Pendências e achados fora do escopo

> **Atualização (21/08/2026):** os itens 1 a 4 desta lista foram resolvidos numa
> segunda rodada. Veja `RELATORIO-SEGURANCA-LGPD.md`. Os demais seguem abertos.
>
> **Atualização (22/08/2026):** o módulo de eneagrama descrito no PROBLEMA 5 foi
> substituído pela reconstrução fiel do instrumento da instituição — e o
> diagnóstico daquele problema ficou incompleto: o defeito não era só o
> contradomínio limitado a dois tipos, era **rótulo trocado** em 8 dos 10 blocos.
> Veja `RELATORIO-ENEAGRAMA-V21.md`.

Nenhum destes foi alterado nesta rodada — todos aguardavam decisão.

1. **A base de dados continua pública.** `doGet ?action=read` devolve todas as linhas
   (nome, e-mail, agrupamento e análise completa) sem autenticação, e a URL está no
   `config.js` de um site público. A v2 acrescentou colunas, então há mais dado
   exposto do que antes. Era o PROBLEMA 1 do Nível 1 do diagnóstico anterior e
   continua aberto.
2. **A senha do dashboard segue sendo apenas visual** (comparada em JavaScript,
   guardada no navegador).
3. **O `doPost` continua aberto:** qualquer um pode injetar linhas, gastar créditos da
   API e fazer a conta Google enviar e-mails para endereços arbitrários.
4. **Sem consentimento nem aviso de privacidade** no início do teste (LGPD).
5. **Modelo da IA inalterado** (`claude-opus-4-8`), por não estar no escopo
   autorizado. Para uma saída de esquema fixo como esta, um modelo menor reduziria
   bastante o custo por teste, mantendo a qualidade.
6. **A `escola` continua sendo enviada no payload** junto com `organizacao`, para não
   quebrar um site que ainda esteja publicado com o front antigo. Pode ser removida
   depois que as duas organizações estiverem na v2.
7. **Convite para refazer o teste:** o texto está em `docs/CONVITE-REFAZER-TESTE.md`,
   pronto para envio, mas nenhum e-mail foi disparado.
