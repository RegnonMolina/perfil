# Relatório — Eneagrama reconstruído a partir do instrumento da instituição (v2.1)

Data: 22/08/2026
Origem: o documento `TESTE_ENEAGRAMA` enviado pelo Regnon, com o instrumento completo.

---

## 1. O que o documento revelou

O instrumento em uso na instituição tem **10 fatores, 9 alternativas em cada um,
90 fichas no total**. A instrução é escolher **duas afirmativas por fator** — 20
escolhas ao final —, e a folha de tabulação mapeia as fichas 1 a 90 numa grade de
fator × tipo.

A v1 do sistema pegou esse instrumento e manteve **2 das 9 alternativas** de cada
fator. Comparando bloco a bloco com o original:

| Bloco na v1 | Tipos que ela exibia | Tipos que ela contava |
|---|---|---|
| Mundo Ideal | 1 e 3 | 1 e 2 |
| Relacionamento Profissional | paráfrases que não existem no original | 1 e 2 |
| Auto-imagem | opções do bloco *Relacionamento* (1 e 3) | 1 e 2 |
| Participação e Influência | opções do bloco *Auto-imagem* (1 e 3) | 1 e 2 |
| Grupos | 5 e 7 | 1 e 2 |
| Sensibilidade | 1 e 2 | 1 e 2 |
| Conduta | 5 e 6 | 1 e 2 |
| Sucesso Pessoal | 5 e 3 | 1 e 2 |
| Busca Pessoal | 1 e 2 | 1 e 2 |
| Imagem Pública | 1 e 8 | 1 e 2 |

**Em 8 dos 10 blocos o tipo contado não era o tipo exibido**, e em dois deles as
frases apareciam sob o título de outro fator, deslocadas uma posição.

Isso corrige o diagnóstico anterior, que falava apenas em contradomínio limitado
a Tipo 1 e Tipo 2. O problema era mais grave: **o rótulo estava trocado**. Quem
respondia recebia um tipo que não correspondia sequer às frases que tinha lido.

## 2. O que passou a valer

O módulo foi reconstruído a partir do documento, sem reescrever nenhuma frase.
Os dados foram extraídos por script direto do arquivo, não transcritos à mão.

- **10 fatores × 9 alternativas**, na ordem dos tipos 1 a 9.
- **Escolher 2 por fator**, 20 escolhas no total.
- **Numeração das fichas de 1 a 90** conferindo com a grade da folha, o que
  permite cruzar um resultado digital com um preenchido no papel.
- **Primeiro e segundo lugar**, com empate reportado como empate.
- **Sem cálculo de asa**: o instrumento não mede isso, e o segundo colocado não
  é necessariamente um tipo vizinho. Inventar uma asa daria ao resultado uma
  precisão que o dado não tem — foi justamente o erro que estávamos corrigindo.

Escolher 2 entre 9 é escolha forçada, o que elimina de saída o viés de quem
concorda com tudo — problema de qualquer escala de concordância, e que afetava
a versão intermediária de 27 afirmações que chegou a ser testada.

## 3. Efeitos no resto do sistema

- **O questionário encurtou**: de 75 itens para **58 decisões**, porque 27
  afirmações em escala viraram 10 fatores. E ficou mais preciso.
- **Item de atenção** migrou para o módulo de temperamento, o único que ainda
  usa escala de concordância.
- **Controle de qualidade**: a detecção de "mesma nota em tudo" agora olha só o
  temperamento — no eneagrama de escolha forçada isso não existe.
- **Planilha**: a coluna `Asa` deu lugar a `Eneagrama 2º lugar`, e entrou
  `Fichas escolhidas`, que guarda as 20 fichas para conferência com o papel.
- **Prompt da IA**: passa a receber primeiro e segundo lugar, e recebeu instrução
  explícita para **não** mencionar asa.
- **Versão**: instrumento e backend foram para **v2.1**. A guarda de versão
  passou a comparar a versão inteira, e não só o número maior — o formato dos
  dados mudou entre v2.0 e v2.1, e gravar com o backend antigo perderia campos.

## 4. Testes

`npm test` — **68 testes**, todos passando.

Os do eneagrama travam as propriedades do instrumento reconstruído:

- 10 fatores com 9 alternativas cada, na ordem dos tipos 1 a 9;
- as 90 fichas numeradas de 1 a 90, sem repetição;
- a numeração seguindo a grade da folha (`fator × 9 + tipo`);
- nenhum texto de alternativa repetido;
- **os nove tipos todos alcançáveis** — o defeito da v1;
- a tabulação fechando em 20 escolhas;
- empate no topo reportado como empate;
- o centro correspondendo ao primeiro colocado;
- as fichas escolhidas devolvidas para conferência.

Em navegador real, uma bateria percorre o questionário inteiro pela interface —
identificação, linguagens, temperamento, os cinco telas de eneagrama e o DISC —
e confere que o tipo escolhido é o que sai, que o envio leva o segundo lugar e as
fichas, e que a palavra "asa" não aparece em lugar nenhum.

## 5. Observações sobre o documento de origem

Encontrei o que parecem erros de digitação no original. **Nada foi alterado** — é
o instrumento da instituição, e mexer nele por conta própria seria indevido:

- "Previr problemas" (Busca Pessoal, tipo 6) — provavelmente "Prevenir".
- "Desprendido" aparece nos tipos 2 e 3 de Imagem Pública.
- "Não-conformista" no tipo 6 de Imagem Pública destoa do restante do perfil.

Vale conferir na fonte antes de apresentar à equipe.
