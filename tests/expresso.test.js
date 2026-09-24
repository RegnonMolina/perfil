/**
 * Testes do Perfil Expresso (expresso.js, v3.0).
 *
 * Assim como os testes da v2.1, estes não conferem digitação: provam as
 * propriedades do desenho. Equilíbrio entre linguagens e fatores, todos os
 * tipos do eneagrama alcançáveis, desempates que só aparecem quando precisam,
 * e resultados que não inventam dominante ou secundário onde não há.
 */

const test = require("node:test");
const assert = require("node:assert");
const E = require("../expresso.js");
const INSTRUMENTO = require("../instrumento.js");

// ---------- auxiliares ----------

// Responde os 10 pares escolhendo, em cada um, a letra que a função devolver.
function responderPares(escolher) {
  return E.PARES.map((p) => ({ item: p.id, letra: escolher(p) }));
}

// Responde os 8 blocos de DISC com o mesmo MAIS e o mesmo MENOS.
function responderDisc(mais, menos) {
  return E.BLOCOS_DISC.map((b) => ({ bloco: b.id, mais, menos }));
}

// ============================================================
// VERSÃO E ORIGEM DOS ITENS
// ============================================================

test("Versão do instrumento é v3.0", () => {
  assert.strictEqual(E.VERSAO, "v3.0");
  assert.strictEqual(E.calcularPerfil({}).versao, "v3.0");
});

test("Os itens vêm de instrumento.js, sem cópia de texto", () => {
  E.PARES.forEach((p) => {
    const original = INSTRUMENTO.ITENS_LINGUAGEM.find((i) => i.id === p.id);
    const textos = [original.a.texto, original.b.texto].sort();
    assert.deepStrictEqual([p.a.texto, p.b.texto].sort(), textos, `par ${p.id} diverge do original`);
  });
  E.BLOCOS_DISC.forEach((b, i) => assert.strictEqual(b, INSTRUMENTO.BLOCOS_DISC[i]));
});

// ============================================================
// LINGUAGENS
// ============================================================

test("Linguagens: 10 pares cobrem cada par de linguagens exatamente uma vez", () => {
  assert.strictEqual(E.PARES.length, 10);
  const pares = E.PARES.map((p) => [p.a.letra, p.b.letra].sort().join(""));
  assert.strictEqual(new Set(pares).size, 10, "há par de linguagens repetido");
  E.PARES.forEach((p) => assert.notStrictEqual(p.a.letra, p.b.letra, `item ${p.id} é degenerado`));
});

test("Linguagens: cada linguagem aparece 2 vezes à esquerda e 2 à direita", () => {
  const esquerda = {}, direita = {};
  E.PARES.forEach((p) => {
    esquerda[p.a.letra] = (esquerda[p.a.letra] || 0) + 1;
    direita[p.b.letra] = (direita[p.b.letra] || 0) + 1;
  });
  ["A", "B", "C", "D", "E"].forEach((l) => {
    assert.strictEqual(esquerda[l], 2, `${l} à esquerda`);
    assert.strictEqual(direita[l], 2, `${l} à direita`);
  });
});

test("Linguagens: todas as cinco podem sair como principal", () => {
  ["A", "B", "C", "D", "E"].forEach((alvo) => {
    const r = responderPares((p) => (p.a.letra === alvo || p.b.letra === alvo ? alvo : p.a.letra));
    const ling = E.pontuarLinguagem(r);
    assert.deepStrictEqual(ling.principal, [alvo]);
    assert.strictEqual(ling.contagem[alvo], 4);
  });
});

test("Linguagens: empate de duas é resolvido pelo confronto direto, sem pedir desempate", () => {
  // A vence todos os seus pares menos contra B; B vence todos os seus: B=4, A=3.
  // Força A=3 e B=3 escolhendo A contra B e perdendo B para outra letra.
  const r = responderPares((p) => {
    const par = [p.a.letra, p.b.letra].sort().join("");
    if (par === "AB") return "A";
    if (par === "BC") return "C";
    if (p.a.letra === "A" || p.b.letra === "A") return "A";
    if (p.a.letra === "B" || p.b.letra === "B") return "B";
    return p.a.letra;
  });
  const ling = E.pontuarLinguagem(r);
  assert.strictEqual(ling.contagem.A, 4);
  assert.deepStrictEqual(E.linguagensEmpatadas(r), []);
});

test("Linguagens: sempre a opção da esquerda empata as cinco e pede desempate", () => {
  const r = responderPares((p) => p.a.letra);
  const empatadas = E.linguagensEmpatadas(r);
  assert.strictEqual(empatadas.length, 5);
  assert.strictEqual(E.pontuarLinguagem(r).principalNome, "Perfil equilibrado, sem linguagem dominante");

  const comDesempate = E.pontuarLinguagem(r, "D");
  assert.deepStrictEqual(comDesempate.principal, ["D"]);
  assert.strictEqual(comDesempate.principalNome, "Atos de serviço");
  assert.strictEqual(comDesempate.viaDesempate, true);
});

test("Linguagens: desempate com uma letra que não empatou é ignorado", () => {
  const r = responderPares((p) => p.a.letra);
  const ling = E.pontuarLinguagem(r, "Z");
  assert.strictEqual(ling.viaDesempate, false);
  assert.strictEqual(ling.equilibrado, true);
});

test("Linguagens: sem os 10 pares respondidos, ainda não há desempate", () => {
  const r = responderPares((p) => p.a.letra).slice(0, 9);
  assert.deepStrictEqual(E.linguagensEmpatadas(r), []);
});

// ============================================================
// DISC E TEMPERAMENTO
// ============================================================

test("DISC: 8 blocos, cada um com uma palavra de cada fator", () => {
  assert.strictEqual(E.BLOCOS_DISC.length, 8);
  E.BLOCOS_DISC.forEach((b) => {
    assert.deepStrictEqual(b.opcoes.map((o) => o.fator).sort(), ["C", "D", "I", "S"], `bloco ${b.id}`);
  });
});

test("DISC: score vai de -8 a +8 e o dominante é o mais escolhido", () => {
  const d = E.pontuarDisc(responderDisc("C", "D"));
  assert.strictEqual(d.score.C, 8);
  assert.strictEqual(d.score.D, -8);
  assert.strictEqual(d.minimo, -8);
  assert.strictEqual(d.maximo, 8);
  assert.strictEqual(d.dominante, "C");
});

test("DISC: com 2º e 3º empatados, não inventa secundário", () => {
  // C sempre MAIS, D sempre MENOS: I e S ficam iguais (0 e 0).
  const d = E.pontuarDisc(responderDisc("C", "D"));
  assert.strictEqual(d.secundario, null);
  assert.strictEqual(d.secundarioNome, "");
  assert.strictEqual(d.perfil, "C");
});

test("DISC: com secundário claro, o nome segue o formato gravado pela v2.1", () => {
  const r = E.BLOCOS_DISC.map((b, i) => ({ bloco: b.id, mais: "C", menos: i % 2 ? "D" : "I" }));
  const d = E.pontuarDisc(r);
  assert.strictEqual(d.secundario, "S");
  // Mesmo texto que a v2.1 grava, para cair na mesma barra do dashboard.
  const v2 = INSTRUMENTO.pontuarDisc(r);
  assert.strictEqual(d.perfil, v2.perfil);
});

test("DISC: os quatro empatados viram perfil equilibrado", () => {
  const fatores = ["D", "I", "S", "C"];
  const r = E.BLOCOS_DISC.map((b, i) => ({ bloco: b.id, mais: fatores[i % 4], menos: fatores[(i + 1) % 4] }));
  const d = E.pontuarDisc(r);
  assert.strictEqual(d.equilibrado, true);
  assert.strictEqual(d.dominante, null);
  assert.strictEqual(E.derivarTemperamento(d).principalNome, "Perfil equilibrado, sem temperamento dominante");
});

test("Temperamento: derivado do DISC pela correspondência clássica", () => {
  const esperado = { D: "Colérico", I: "Sanguíneo", S: "Fleumático", C: "Melancólico" };
  Object.keys(esperado).forEach((f) => {
    const menos = f === "D" ? "I" : "D";
    const t = E.derivarTemperamento(E.pontuarDisc(responderDisc(f, menos)));
    assert.strictEqual(t.principalNome, esperado[f]);
    assert.strictEqual(t.derivado, true);
  });
});

// ============================================================
// ENEAGRAMA
// ============================================================

test("Eneagrama: a grade de estilo alcança os nove tipos, cada um uma vez", () => {
  const tipos = [];
  Object.keys(E.GRADE_ENEAGRAMA).forEach((c) =>
    Object.keys(E.GRADE_ENEAGRAMA[c]).forEach((r) => tipos.push(E.GRADE_ENEAGRAMA[c][r])));
  assert.deepStrictEqual(tipos.sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("Eneagrama: as opções das perguntas batem com a grade e com os 9 tipos", () => {
  const [convivio, reacao, motivacao] = E.PERGUNTAS_ENEAGRAMA;
  assert.deepStrictEqual(convivio.opcoes.map((o) => o.k).sort(), Object.keys(E.GRADE_ENEAGRAMA).sort());
  assert.deepStrictEqual(reacao.opcoes.map((o) => o.k).sort(), Object.keys(E.GRADE_ENEAGRAMA.assertivo).sort());
  assert.deepStrictEqual(motivacao.opcoes.map((o) => Number(o.k)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let t = 1; t <= 9; t++) assert.ok(E.INCOMODO[t], `falta a frase de incômodo do tipo ${t}`);
});

test("Eneagrama: quando estilo e motivação concordam, confiança alta e sem desempate", () => {
  const r = { convivio: "retraido", reacao: "competencia", motivacao: "5" };
  assert.deepStrictEqual(E.eneagramaDivergente(r), []);
  const en = E.pontuarEneagrama(r);
  assert.strictEqual(en.tipo, 5);
  assert.strictEqual(en.confianca, "alta");
  assert.strictEqual(en.alternativo, null);
});

test("Eneagrama: divergência pede desempate entre os dois candidatos", () => {
  // O caso real das rodadas de teste: estilo 5, motivação 1.
  const r = { convivio: "retraido", reacao: "competencia", motivacao: "1" };
  assert.deepStrictEqual(E.eneagramaDivergente(r), [5, 1]);

  const en = E.pontuarEneagrama(r, 5);
  assert.strictEqual(en.tipo, 5);
  assert.strictEqual(en.confianca, "média");
  assert.strictEqual(en.alternativo, 1);
  assert.match(en.alternativoNome, /Tipo 1/);

  const outro = E.pontuarEneagrama(r, 1);
  assert.strictEqual(outro.tipo, 1);
  assert.strictEqual(outro.alternativo, 5);
});

test("Eneagrama: desempate com um tipo fora dos candidatos é ignorado", () => {
  const r = { convivio: "retraido", reacao: "competencia", motivacao: "1" };
  const en = E.pontuarEneagrama(r, 7);
  assert.strictEqual(en.desempate, null);
  assert.strictEqual(en.tipo, 5, "sem desempate válido, vale o estilo");
});

test("Eneagrama: os nove tipos podem sair como resultado", () => {
  Object.keys(E.GRADE_ENEAGRAMA).forEach((c) =>
    Object.keys(E.GRADE_ENEAGRAMA[c]).forEach((reacao) => {
      const tipo = E.GRADE_ENEAGRAMA[c][reacao];
      const en = E.pontuarEneagrama({ convivio: c, reacao, motivacao: String(tipo) });
      assert.strictEqual(en.tipo, tipo);
      assert.ok(en.centro, "falta o centro de inteligência");
    }));
});

// ============================================================
// QUALIDADE E REGISTRO
// ============================================================

test("Qualidade: todas as escolhas do mesmo lado geram alerta", () => {
  const q = E.calcularQualidade({ linguagem: responderPares((p) => p.a.letra), segundos: 200 });
  assert.strictEqual(q.mesmoLado, true);
  assert.strictEqual(q.status, "Revisar");
});

test("Qualidade: menos de 1 minuto gera alerta; 4 minutos não", () => {
  const variado = responderPares((p) => (p.id % 3 ? p.a.letra : p.b.letra));
  assert.strictEqual(E.calcularQualidade({ linguagem: variado, segundos: 40 }).rapidoDemais, true);
  const ok = E.calcularQualidade({ linguagem: variado, segundos: 240 });
  assert.strictEqual(ok.status, "OK");
  assert.deepStrictEqual(ok.alertas, []);
});

test("Registro item a item traz linguagens, DISC, eneagrama e desempates", () => {
  const texto = E.respostasCompactas({
    linguagem: responderPares((p) => p.a.letra),
    desempateLinguagem: "D",
    disc: responderDisc("C", "D"),
    eneagrama: { convivio: "retraido", reacao: "competencia", motivacao: "1" },
    desempateEneagrama: 5
  });
  assert.match(texto, /^L:[A-E]{10}\/D \| D:(CD ){7}CD \| E:retraido,competencia,1\/5$/);
});

test("Cálculo completo devolve os quatro módulos", () => {
  const p = E.calcularPerfil({
    linguagem: responderPares((p) => (p.id % 3 ? p.a.letra : p.b.letra)),
    disc: responderDisc("C", "D"),
    eneagrama: { convivio: "retraido", reacao: "competencia", motivacao: "5" },
    segundos: 180
  });
  assert.ok(p.linguagem.principalNome);
  assert.strictEqual(p.disc.dominanteNome, "Conformidade");
  assert.strictEqual(p.temperamento.principalNome, "Melancólico");
  assert.strictEqual(p.eneagrama.tipo, 5);
  assert.strictEqual(p.qualidade.status, "OK");
});

test("Textos novos não prometem precisão: nenhuma porcentagem", () => {
  const textos = JSON.stringify([E.PERGUNTAS_ENEAGRAMA, E.INCOMODO, E.DESCRICAO_LINGUAGEM]);
  assert.ok(!/%/.test(textos));
});

test("Linguagens: com as restantes empatadas, não inventa secundária", () => {
  // Cinco empatadas em 2, resolvidas no desempate: sobram quatro iguais.
  const r = responderPares((p) => p.a.letra);
  const ling = E.pontuarLinguagem(r, "D");
  assert.strictEqual(ling.secundaria, null);
  assert.strictEqual(ling.secundariaNome, "");
});

test("Linguagens: secundária aparece quando se destaca", () => {
  const r = responderPares((p) => {
    const letras = [p.a.letra, p.b.letra];
    if (letras.includes("A")) return "A";
    if (letras.includes("E")) return "E";
    return p.a.letra;
  });
  const ling = E.pontuarLinguagem(r);
  assert.deepStrictEqual(ling.principal, ["A"]);
  assert.strictEqual(ling.secundaria, "E");
});
