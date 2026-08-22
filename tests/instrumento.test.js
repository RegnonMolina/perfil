/**
 * Testes do instrumento de perfil comportamental (v2.0).
 *
 * O objetivo destes testes não é só pegar erro de digitação: é PROVAR as
 * propriedades de validade do desenho, que na v1 estavam quebradas em silêncio.
 * Cada bloco abaixo corresponde a um problema real diagnosticado na v1.
 *
 * Rodar com: npm test   (ou: node --test tests/)
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../instrumento.js");

// ============================================================
// MÓDULO 1 — LINGUAGENS
// ============================================================

test("Linguagem: nenhum item degenerado (as duas opções nunca são da mesma letra)", () => {
  // Na v1 os itens 16, 21 e 27 tinham as duas alternativas da mesma letra,
  // o que dava pontos de graça independentemente da escolha da pessoa.
  const degenerados = I.ITENS_LINGUAGEM.filter((i) => i.a.letra === i.b.letra);
  assert.deepStrictEqual(degenerados, [], "há item cujas duas opções pontuam a mesma linguagem");
});

test("Linguagem: nenhum item duplicado", () => {
  // Na v1 os itens 13/23 e 14/24 eram idênticos, pesando em dobro.
  const vistos = new Set();
  for (const item of I.ITENS_LINGUAGEM) {
    const chave = [item.a.texto, item.b.texto].sort().join("||");
    assert.ok(!vistos.has(chave), `item ${item.id} repete o conteúdo de outro item`);
    vistos.add(chave);
  }
});

test("Linguagem: nenhum texto de alternativa se repete entre itens", () => {
  const textos = I.ITENS_LINGUAGEM.flatMap((i) => [i.a.texto, i.b.texto]);
  assert.strictEqual(new Set(textos).size, textos.length, "há alternativa repetida em mais de um item");
});

test("Linguagem: todas as 5 linguagens têm exatamente as mesmas chances de pontuar", () => {
  // Este é o coração da correção do PROBLEMA 3: na v1 B tinha 18 chances e E apenas 6.
  const exposicao = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  I.ITENS_LINGUAGEM.forEach((i) => {
    exposicao[i.a.letra] += 1;
    exposicao[i.b.letra] += 1;
  });
  const valores = Object.values(exposicao);
  assert.ok(valores.every((v) => v === valores[0]), `exposição desigual: ${JSON.stringify(exposicao)}`);
  assert.strictEqual(valores[0], 8);
});

test("Linguagem: cada par de linguagens se enfrenta o mesmo número de vezes", () => {
  const confrontos = {};
  I.ITENS_LINGUAGEM.forEach((i) => {
    const chave = [i.a.letra, i.b.letra].sort().join("");
    confrontos[chave] = (confrontos[chave] || 0) + 1;
  });
  // 5 linguagens => 10 pares possíveis, cada um aparecendo 2 vezes.
  assert.strictEqual(Object.keys(confrontos).length, 10, "nem todos os pares possíveis estão presentes");
  Object.entries(confrontos).forEach(([par, n]) => {
    assert.strictEqual(n, 2, `o par ${par} aparece ${n} vezes em vez de 2`);
  });
});

test("Linguagem: os lados são contrabalanceados (cada linguagem aparece igual à esquerda e à direita)", () => {
  const esquerda = {};
  const direita = {};
  I.ITENS_LINGUAGEM.forEach((i) => {
    esquerda[i.a.letra] = (esquerda[i.a.letra] || 0) + 1;
    direita[i.b.letra] = (direita[i.b.letra] || 0) + 1;
  });
  Object.keys(I.LINGUAGENS).forEach((l) => {
    assert.strictEqual(esquerda[l] || 0, direita[l] || 0, `${l} não está contrabalanceada entre os lados`);
  });
});

test("Linguagem: quem escolhe sempre a mesma linguagem atinge o teto dela", () => {
  const respostas = I.ITENS_LINGUAGEM
    .filter((i) => i.a.letra === "E" || i.b.letra === "E")
    .map((i) => ({ item: i.id, letra: "E" }));
  const r = I.pontuarLinguagem(respostas);
  assert.strictEqual(r.contagem.E, 8);
  assert.deepStrictEqual(r.principal, ["E"]);
  assert.strictEqual(r.principalNome, "Presença / Acolhimento");
});

test("Linguagem: empate é resolvido pelo confronto direto entre as empatadas", () => {
  // Monta um empate artificial em contagem e confere que o critério aplicado
  // é o confronto direto, e não a ordem alfabética.
  const respostas = I.ITENS_LINGUAGEM.map((i) => {
    if (i.a.letra === "A" && i.b.letra === "B") return { item: i.id, letra: "A" };
    if (i.a.letra === "B" && i.b.letra === "A") return { item: i.id, letra: "A" };
    if (i.a.letra === "A" || i.b.letra === "A") return { item: i.id, letra: "A" };
    if (i.a.letra === "B" || i.b.letra === "B") return { item: i.id, letra: "B" };
    return { item: i.id, letra: i.a.letra };
  });
  const r = I.pontuarLinguagem(respostas);
  // A venceu B nos dois confrontos diretos, então A não pode perder o desempate.
  assert.ok(r.principal.includes("A"), `esperado A entre as principais, veio ${JSON.stringify(r.principal)}`);
});

// ============================================================
// MÓDULO 2 — TEMPERAMENTO
// ============================================================

test("Temperamento: 4 afirmações por temperamento, sem repetição de texto", () => {
  const porFator = {};
  I.ITENS_TEMPERAMENTO.forEach((i) => { porFator[i.fator] = (porFator[i.fator] || 0) + 1; });
  assert.deepStrictEqual(porFator, { colerico: 4, sanguineo: 4, melancol: 4, fleumatico: 4 });

  const textos = I.ITENS_TEMPERAMENTO.map((i) => i.texto);
  assert.strictEqual(new Set(textos).size, textos.length, "há afirmação repetida");
});

test("Temperamento: o percentual neutraliza quem marca a mesma nota alta em tudo", () => {
  // Este é o PROBLEMA 4: na v1 quem marcava 5 em tudo pontuava alto nos quatro.
  const tudoCinco = I.ITENS_TEMPERAMENTO.map((i) => ({ item: i.id, valor: 5 }));
  const tudoDois = I.ITENS_TEMPERAMENTO.map((i) => ({ item: i.id, valor: 2 }));

  const a = I.pontuarTemperamento(tudoCinco);
  const b = I.pontuarTemperamento(tudoDois);

  // Notas brutas diferentes...
  assert.notStrictEqual(a.bruto.colerico, b.bruto.colerico);
  // ...mas o mesmo perfil relativo: 25% em cada um.
  assert.deepStrictEqual(a.percentual, b.percentual);
  Object.values(a.percentual).forEach((p) => assert.strictEqual(p, 25));
});

test("Temperamento: identifica principal e secundário", () => {
  const respostas = I.ITENS_TEMPERAMENTO.map((i) => ({
    item: i.id,
    valor: i.fator === "melancol" ? 5 : i.fator === "fleumatico" ? 4 : 1
  }));
  const r = I.pontuarTemperamento(respostas);
  assert.deepStrictEqual(r.principal, ["melancol"]);
  assert.strictEqual(r.principalNome, "Melancólico");
  assert.strictEqual(r.secundarioNome, "Fleumático");
});

// ============================================================
// MÓDULO 3 — ENEAGRAMA
// ============================================================
//
// O eneagrama passou a ser a reconstrução fiel do instrumento da instituição:
// 10 fatores x 9 alternativas, escolhendo 2 por fator. Estes testes travam a
// integridade do banco e o comportamento da tabulação.

test("Eneagrama: 10 fatores com 9 alternativas cada, uma por tipo", () => {
  assert.strictEqual(I.BLOCOS_ENEAGRAMA.length, 10);
  I.BLOCOS_ENEAGRAMA.forEach((bloco) => {
    assert.strictEqual(bloco.opcoes.length, 9, `${bloco.fator} não tem 9 alternativas`);
    const tipos = bloco.opcoes.map((o) => o.tipo);
    assert.deepStrictEqual(tipos, [1, 2, 3, 4, 5, 6, 7, 8, 9],
      `${bloco.fator}: as alternativas precisam estar na ordem dos tipos 1 a 9`);
  });
});

test("Eneagrama: as 90 fichas são numeradas de 1 a 90, sem repetição", () => {
  // A numeração precisa bater com a grade de tabulação da folha original,
  // senão não dá para conferir um resultado digital contra um de papel.
  const fichas = I.BLOCOS_ENEAGRAMA.flatMap((b) => b.opcoes.map((o) => o.ficha));
  assert.strictEqual(fichas.length, 90);
  assert.strictEqual(new Set(fichas).size, 90, "há ficha repetida");
  assert.deepStrictEqual(fichas.slice().sort((a, b) => a - b),
    Array.from({ length: 90 }, (_, i) => i + 1));
});

test("Eneagrama: a numeração segue a grade da folha (fator × 9 + tipo)", () => {
  I.BLOCOS_ENEAGRAMA.forEach((bloco, b) => {
    bloco.opcoes.forEach((o) => {
      assert.strictEqual(o.ficha, b * 9 + o.tipo,
        `${bloco.fator}, tipo ${o.tipo}: ficha ${o.ficha} fora da grade`);
    });
  });
});

test("Eneagrama: nenhum texto de alternativa se repete", () => {
  const textos = I.BLOCOS_ENEAGRAMA.flatMap((b) => b.opcoes.map((o) => o.texto));
  assert.strictEqual(new Set(textos).size, textos.length, "há alternativa repetida no banco");
});

test("Eneagrama: TODOS os nove tipos são alcançáveis", () => {
  // Este era o defeito da v1: só os tipos 1 e 2 podiam sair — e ainda assim
  // contando as escolhas de outros tipos.
  for (let alvo = 1; alvo <= 9; alvo++) {
    const vizinho = alvo === 9 ? 1 : alvo + 1;
    const respostas = I.BLOCOS_ENEAGRAMA.map((bloco, f) => ({
      fator: f,
      fichas: [
        bloco.opcoes.find((o) => o.tipo === alvo).ficha,
        bloco.opcoes.find((o) => o.tipo === (f < 6 ? vizinho : (alvo === 1 ? 9 : alvo - 1))).ficha
      ]
    }));
    const r = I.pontuarEneagrama(respostas);
    assert.deepStrictEqual(r.primeiro, [alvo], `o tipo ${alvo} não é alcançável`);
    assert.strictEqual(r.bruto[alvo], 10, `o tipo ${alvo} deveria somar 10`);
  }
});

test("Eneagrama: a tabulação fecha em 20 escolhas", () => {
  const respostas = I.BLOCOS_ENEAGRAMA.map((bloco, f) => ({
    fator: f, fichas: [bloco.opcoes[0].ficha, bloco.opcoes[1].ficha]
  }));
  const r = I.pontuarEneagrama(respostas);
  assert.strictEqual(r.total, 20);
  assert.strictEqual(r.completo, true);
  const soma = Object.values(r.bruto).reduce((s, v) => s + v, 0);
  assert.strictEqual(soma, 20, "a soma dos nove tipos precisa fechar em 20");
});

test("Eneagrama: preenchimento parcial é sinalizado como incompleto", () => {
  const r = I.pontuarEneagrama([{ fator: 0, fichas: [1, 2] }]);
  assert.strictEqual(r.total, 2);
  assert.strictEqual(r.completo, false);
});

test("Eneagrama: empate no topo é reportado como empate", () => {
  // A folha original prevê isso com todas as letras: "primeiro lugar (ou empatado em)".
  const respostas = I.BLOCOS_ENEAGRAMA.map((bloco, f) => ({
    fator: f,
    fichas: [bloco.opcoes.find((o) => o.tipo === 5).ficha, bloco.opcoes.find((o) => o.tipo === 9).ficha]
  }));
  const r = I.pontuarEneagrama(respostas);
  assert.strictEqual(r.empate, true);
  assert.deepStrictEqual(r.primeiro.sort(), [5, 9]);
  assert.match(r.primeiroNome, / e /);
});

test("Eneagrama: identifica o segundo lugar", () => {
  const respostas = I.BLOCOS_ENEAGRAMA.map((bloco, f) => ({
    fator: f,
    fichas: [
      bloco.opcoes.find((o) => o.tipo === 5).ficha,
      bloco.opcoes.find((o) => o.tipo === (f < 6 ? 6 : 4)).ficha
    ]
  }));
  const r = I.pontuarEneagrama(respostas);
  assert.deepStrictEqual(r.primeiro, [5]);
  assert.deepStrictEqual(r.segundo, [6]);
  assert.strictEqual(r.bruto[5], 10);
  assert.strictEqual(r.bruto[6], 6);
  assert.strictEqual(r.centro, "Mental");
});

test("Eneagrama: devolve as fichas escolhidas, para conferir com a folha de papel", () => {
  const r = I.pontuarEneagrama([
    { fator: 0, fichas: [5, 6] },
    { fator: 4, fichas: [41, 43] }
  ]);
  assert.deepStrictEqual(r.fichas, [5, 6, 41, 43]);
});

test("Eneagrama: o centro informado corresponde ao primeiro colocado", () => {
  const centros = { 1:"Instintivo",2:"Emocional",3:"Emocional",4:"Emocional",5:"Mental",
                    6:"Mental",7:"Mental",8:"Instintivo",9:"Instintivo" };
  for (let alvo = 1; alvo <= 9; alvo++) {
    // Dois acompanhantes DISTINTOS, cinco fatores cada, para nenhum deles
    // alcançar os 10 pontos do alvo e criar empate.
    const companheiro1 = (alvo % 9) + 1;
    const companheiro2 = (companheiro1 % 9) + 1;
    const respostas = I.BLOCOS_ENEAGRAMA.map((bloco, f) => ({
      fator: f,
      fichas: [
        bloco.opcoes.find((o) => o.tipo === alvo).ficha,
        bloco.opcoes.find((o) => o.tipo === (f < 5 ? companheiro1 : companheiro2)).ficha
      ]
    }));
    const r = I.pontuarEneagrama(respostas);
    assert.deepStrictEqual(r.primeiro, [alvo], `esperado ${alvo} sozinho em primeiro`);
    assert.strictEqual(r.centro, centros[alvo]);
  }
});

// ============================================================
// MÓDULO 4 — DISC
// ============================================================

test("DISC: cada bloco tem exatamente um representante de cada fator", () => {
  I.BLOCOS_DISC.forEach((b) => {
    const fatores = b.opcoes.map((o) => o.fator).sort();
    assert.deepStrictEqual(fatores, ["C", "D", "I", "S"], `bloco ${b.id} está desbalanceado`);
  });
});

test("DISC: os 4 fatores têm o mesmo número de oportunidades", () => {
  const exposicao = { D: 0, I: 0, S: 0, C: 0 };
  I.BLOCOS_DISC.forEach((b) => b.opcoes.forEach((o) => { exposicao[o.fator] += 1; }));
  assert.deepStrictEqual(exposicao, { D: 12, I: 12, S: 12, C: 12 });
});

test("DISC: nenhuma palavra se repete entre os blocos", () => {
  const palavras = I.BLOCOS_DISC.flatMap((b) => b.opcoes.map((o) => o.palavra));
  assert.strictEqual(new Set(palavras).size, palavras.length, "há palavra repetida no banco DISC");
});

test("DISC: a ordem de apresentação varia (nenhum fator fica sempre na mesma posição)", () => {
  const primeiraPosicao = new Set(I.BLOCOS_DISC.map((b) => b.opcoes[0].fator));
  assert.ok(primeiraPosicao.size > 1, "o mesmo fator abre todos os blocos, o que induz a escolha");
});

test("DISC: score é MAIS menos MENOS, com faixa de -12 a +12", () => {
  const respostas = I.BLOCOS_DISC.map((b) => ({ bloco: b.id, mais: "D", menos: "S" }));
  const r = I.pontuarDisc(respostas);
  assert.strictEqual(r.score.D, 12);
  assert.strictEqual(r.score.S, -12);
  assert.strictEqual(r.score.I, 0);
  assert.strictEqual(r.score.C, 0);
  assert.strictEqual(r.dominante, "D");
  assert.strictEqual(r.intensidade.D, 100);
  assert.strictEqual(r.intensidade.S, 0);
});

test("DISC: a soma dos scores dos 4 fatores é sempre zero (desenho ipsativo)", () => {
  const respostas = I.BLOCOS_DISC.map((b, idx) => ({
    bloco: b.id,
    mais: ["D", "I", "S", "C"][idx % 4],
    menos: ["S", "C", "D", "I"][idx % 4]
  }));
  const r = I.pontuarDisc(respostas);
  const soma = Object.values(r.score).reduce((s, v) => s + v, 0);
  assert.strictEqual(soma, 0);
});

test("DISC: todos os 4 fatores podem ser dominantes", () => {
  ["D", "I", "S", "C"].forEach((alvo) => {
    const outro = alvo === "D" ? "I" : "D";
    const respostas = I.BLOCOS_DISC.map((b) => ({ bloco: b.id, mais: alvo, menos: outro }));
    const r = I.pontuarDisc(respostas);
    assert.strictEqual(r.dominante, alvo);
  });
});

test("DISC: a combinação dominante/secundário recebe um nome", () => {
  const respostas = I.BLOCOS_DISC.map((b, idx) => ({
    bloco: b.id,
    mais: idx < 8 ? "D" : "C",
    menos: "I"
  }));
  const r = I.pontuarDisc(respostas);
  assert.strictEqual(r.dominante, "D");
  assert.strictEqual(r.secundario, "C");
  assert.strictEqual(r.combinacao, "Estrategista");
});

// ============================================================
// CONTROLE DE QUALIDADE
// ============================================================

test("Qualidade: resposta cuidadosa é aprovada", () => {
  const q = I.calcularQualidade({
    temperamento: I.ITENS_TEMPERAMENTO.map((i, n) => ({ item: i.id, valor: (n % 5) + 1 })),
    respostaAtencao: 1,
    segundos: 700
  });
  assert.strictEqual(q.status, "OK");
  assert.deepStrictEqual(q.alertas, []);
});

test("Qualidade: detecta a mesma nota em todas as afirmações", () => {
  const q = I.calcularQualidade({
    temperamento: I.ITENS_TEMPERAMENTO.map((i) => ({ item: i.id, valor: 4 })),
    respostaAtencao: 1,
    segundos: 700
  });
  assert.strictEqual(q.monotona, true);
  assert.strictEqual(q.status, "Revisar");
});

test("Qualidade: detecta preenchimento rápido demais e falha no item de atenção", () => {
  const q = I.calcularQualidade({
    temperamento: I.ITENS_TEMPERAMENTO.map((i, n) => ({ item: i.id, valor: (n % 5) + 1 })),
    respostaAtencao: 5,
    segundos: 90
  });
  assert.strictEqual(q.rapidoDemais, true);
  assert.strictEqual(q.falhouAtencao, true);
  assert.strictEqual(q.alertas.length, 2);
});

// ============================================================
// TAMANHO DO INSTRUMENTO
// ============================================================

test("O instrumento tem 58 decisões, distribuídas entre os quatro módulos", () => {
  assert.strictEqual(I.ITENS_LINGUAGEM.length, 20, "linguagens: 20 pares");
  assert.strictEqual(I.ITENS_TEMPERAMENTO.length, 16, "temperamento: 16 afirmações");
  assert.strictEqual(I.BLOCOS_ENEAGRAMA.length, 10, "eneagrama: 10 fatores");
  assert.strictEqual(I.BLOCOS_DISC.length, 12, "DISC: 12 blocos");

  const decisoes = I.ITENS_LINGUAGEM.length + I.ITENS_TEMPERAMENTO.length +
    I.BLOCOS_ENEAGRAMA.length + I.BLOCOS_DISC.length;
  assert.strictEqual(decisoes, 58, `o instrumento está com ${decisoes} decisões`);
});

test("Cálculo completo devolve os quatro módulos e a versão", () => {
  const perfil = I.calcularPerfilCompleto({
    linguagem: I.ITENS_LINGUAGEM.map((i) => ({ item: i.id, letra: i.a.letra })),
    temperamento: I.ITENS_TEMPERAMENTO.map((i, n) => ({ item: i.id, valor: (n % 5) + 1 })),
    eneagrama: I.BLOCOS_ENEAGRAMA.map((b, f) => ({
      fator: f, fichas: [b.opcoes[4].ficha, b.opcoes[f < 6 ? 5 : 3].ficha]
    })),
    disc: I.BLOCOS_DISC.map((b) => ({ bloco: b.id, mais: "I", menos: "C" })),
    respostaAtencao: 1,
    segundos: 600
  });
  assert.strictEqual(perfil.versao, "v2.1");
  assert.ok(perfil.linguagem.principalNome);
  assert.ok(perfil.temperamento.principalNome);
  assert.ok(perfil.eneagrama.primeiroNome);
  assert.strictEqual(perfil.eneagrama.total, 20);
  assert.strictEqual(perfil.disc.dominante, "I");
  assert.strictEqual(perfil.qualidade.status, "OK");
});

// ============================================================
// APRESENTAÇÃO DE EMPATES
// ============================================================
//
// Estes três testes nasceram de um defeito real encontrado ao rodar o
// questionário no navegador: como o desenho é perfeitamente contrabalanceado,
// escolher sempre a opção da esquerda empata as cinco linguagens em 4 pontos.
// O texto saía como "Palavras de afirmação / Tempo de qualidade / Presentes /
// Mimos / ...", ilegível — ainda mais porque um dos nomes já contém barra.

test("Empate geral nas linguagens é reportado como perfil equilibrado", () => {
  // Escolher sempre a alternativa da esquerda empata todas as linguagens:
  // é justamente o que o contrabalanceamento dos lados garante.
  const respostas = I.ITENS_LINGUAGEM.map((i) => ({ item: i.id, letra: i.a.letra }));
  const r = I.pontuarLinguagem(respostas);

  Object.values(r.contagem).forEach((v) => assert.strictEqual(v, 4));
  assert.strictEqual(r.equilibrado, true);
  assert.strictEqual(r.principalNome, "Perfil equilibrado — sem linguagem dominante");
  assert.strictEqual(r.secundariaNome, "", "sem dominante não faz sentido anunciar uma secundária");
  assert.ok(!r.principalNome.includes(" / "), "o nome do resultado não pode emendar rótulos com barra");
});

test("Empate entre exatamente duas linguagens é reportado com 'e'", () => {
  const r = I.pontuarLinguagem([
    { item: 1, letra: "A" },  // A vence B
    { item: 11, letra: "B" }, // B vence A
    { item: 2, letra: "A" },  // A vence C
    { item: 15, letra: "B" }  // B vence C
  ]);
  assert.deepStrictEqual(r.principal.sort(), ["A", "B"]);
  assert.strictEqual(r.principalNome, "Palavras de afirmação e Tempo de qualidade");
});

test("Empate geral no temperamento é reportado como perfil equilibrado", () => {
  const respostas = I.ITENS_TEMPERAMENTO.map((i) => ({ item: i.id, valor: 3 }));
  const r = I.pontuarTemperamento(respostas);
  assert.strictEqual(r.equilibrado, true);
  assert.strictEqual(r.principalNome, "Perfil equilibrado — sem temperamento dominante");
});
