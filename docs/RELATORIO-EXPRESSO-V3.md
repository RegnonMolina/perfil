# Relatório: Perfil Expresso (v3.0) vira o teste fixo

Data: 24/09/2026
Pedido: arquivar o questionário completo, colocar o teste curto como teste
permanente, com resultados coletivos no dashboard e o resultado individual
enviado por e-mail a quem responde.

---

## 1. O que mudou para quem responde

| | Antes (v2.1) | Agora (v3.0) |
|---|---|---|
| Perguntas | 58 decisões em 9 telas | 21 a 23, uma por tela |
| Tempo | ~12 minutos | ~4 minutos |
| Resultados | Linguagem, temperamento, eneagrama, DISC | Os mesmos quatro |
| E-mail com o resultado | Sim | Sim, e a tela final confirma o envio |

A tela avança sozinha a cada resposta, com "Anterior" para corrigir. Na última
pergunta ela **não** avança sozinha: o envio fica no botão "Enviar", para um
toque acidental não mandar o teste antes da hora.

## 2. Como cada resultado é calculado

- **Linguagens de valorização:** 10 pares, cada par de linguagens uma vez. Os
  itens são os da primeira rodada da v2.1, com os lados alternados para cada
  linguagem aparecer duas vezes à esquerda e duas à direita. Empate de duas é
  resolvido pelo confronto direto; empate maior abre uma tela de desempate.
  A secundária só aparece quando se destaca das demais.
- **DISC:** os 8 primeiros blocos MAIS/MENOS da v2.1. Score de −8 a +8. O
  secundário só aparece quando se distingue do terceiro colocado; do contrário
  o resultado diz "sem definição clara", em vez de apresentar ruído como traço.
- **Temperamento:** derivado do DISC (Colérico = D, Sanguíneo = I,
  Fleumático = S, Melancólico = C). Os dois modelos medem os mesmos eixos:
  perguntar os dois seria medir a mesma coisa duas vezes.
- **Eneagrama:** triagem em duas vias. Estilo (jeito no convívio × reação a
  problema) e motivação (escolha entre 9 frases). Se concordam, confiança alta.
  Se divergem, uma pergunta sobre o que mais incomoda decide entre os dois
  candidatos, e a confiança fica média. Nas rodadas de teste, essa regra
  acertou o tipo que a via de motivação sozinha errava.

## 3. O que mudou nos dados

- **Aba nova "Respostas v3"**, com as mesmas colunas da v2, na mesma ordem, mais
  duas no fim: **Confiança eneagrama** e **Respostas item a item**. A segunda
  guarda cada resposta, o que permite validar o teste depois com dados reais
  (a v2.1 só guardava totais).
- Na v3, três colunas herdadas mudam de sentido: "Eneagrama 2º lugar" guarda o
  tipo alternativo, "Fichas escolhidas" guarda as respostas da triagem e
  "Scores eneagrama" o tipo apontado por cada via. "Percentual temperamento"
  fica vazio.
- As abas "Respostas v2" e "Respostas" não foram tocadas. Um envio com versão
  antiga ainda cai na aba da v2.

## 4. E-mail, análise e dashboard

- **E-mail do respondente:** mostra o eneagrama como triagem, com a confiança e
  o tipo alternativo, indica que o temperamento é derivado do DISC e traz o
  aviso de que o teste curto não foi validado cientificamente.
- **Análise por IA:** o prompt da v3 informa a faixa real do DISC (−8 a +8),
  pede para tratar o eneagrama como hipótese e para não usar o temperamento
  como confirmação independente do DISC.
- **Análise sem IA** (banco de textos): funciona igual e menciona o tipo
  alternativo da triagem quando há.
- **Dashboard:** lê as três abas. Na tabela, o eneagrama da v3 mostra
  "triagem · confiança" e o tipo alternativo; o CSV ganhou as duas colunas
  novas. Os nomes dos resultados seguem o mesmo formato da v2.1, então os
  gráficos de distribuição somam as duas versões na mesma barra quando o
  filtro está em "Todas as versões".

## 5. O teste antigo

Arquivado em `arquivo/teste-completo-v2.1.html`, com um aviso de versão
arquivada no topo. Como o backend passa a responder v3.0, a trava de versão
bloqueia qualquer envio a partir dele. O `instrumento.js` continua no projeto:
é de onde o teste novo lê os itens, e os testes da v2.1 seguem valendo.

## 6. Testes

`npm test`: **113 testes**, todos passando (78 anteriores, atualizados onde a
versão do backend mudou, e 35 novos).

Os novos provam, entre outras coisas:

- **Linguagens:** cada par de linguagens aparece uma vez; cada linguagem fica
  duas vezes de cada lado; as cinco podem sair como principal.
- **Eneagrama:** os nove tipos são alcançáveis.
- **Desempates:** só aparecem quando precisam.
- **Secundários:** nem o DISC nem a linguagem inventam secundário em empate.
- **Backend:** o envio v3 vai para a aba certa com as colunas novas, e a
  leitura junta as três versões.
- **E-mail e IA:** o e-mail do respondente explica a triagem, e o prompt da IA
  não descreve a tabulação da v2.

Em navegador real (Chromium, tela de celular), com o servidor simulado:

- **Percurso:** o questionário completo, com os dois desempates, o "Anterior"
  e o botão "Enviar" na última pergunta.
- **Envio e resultado:** o conteúdo enviado e a tela de resultado.
- **Arquivo:** a página arquivada bloqueada.

## 7. Limites que continuam valendo

- O teste curto **não foi validado cientificamente**. A coluna "Respostas item a
  item" existe para permitir essa validação com o tempo.
- O eneagrama por triagem é hipótese. Quem quiser aprofundar pode fazer o
  instrumento completo da instituição com mediação.
- Resultados da v2.1 e da v3.0 têm os mesmos nomes, mas vêm de perguntas
  diferentes. Para comparar pessoas, prefira o filtro por versão.
