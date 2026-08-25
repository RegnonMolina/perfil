/**
 * Testes da análise padrão (sem IA) do backend.
 *
 * A promessa desta função é forte: TODO envio recebe os seis campos de
 * análise preenchidos, mesmo sem chave da API, mesmo com dados estranhos.
 * Os testes cobrem a detecção de cada módulo (pelo nome legível e pelo
 * plano B via scores) e a garantia de campo nunca-vazio.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const codigo = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Codigo.gs"), "utf8");
const contexto = { console: console };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

const CAMPOS = ["quem_e", "pontos_fortes", "pontos_desenvolver", "como_comunicar", "como_motivar", "evitar_atrito"];

// Envio típico, com os nomes exatamente como o instrumento v2.1 os grava.
const envioTipico = {
  nome: "Pessoa de Teste",
  linguagem: "Palavras de afirmação",
  temperamento: "Melancólico",
  temperamento_secundario: "Fleumático",
  eneagrama: "Tipo 5 — Investigador",
  eneagrama_segundo: "Tipo 6 — Leal",
  disc: "CD — Auditor",
  disc_dominante: "Conformidade"
};

test("análise padrão devolve os seis campos preenchidos para um envio típico", () => {
  const a = contexto.gerarAnalisePadrao(envioTipico);
  CAMPOS.forEach((campo) => {
    assert.ok(typeof a[campo] === "string" && a[campo].length > 40, `campo "${campo}" veio vazio ou curto demais`);
  });
});

test("a análise reflete as categorias detectadas, não texto genérico", () => {
  const a = contexto.gerarAnalisePadrao(envioTipico);
  assert.ok(/reflexiva/.test(a.quem_e), "quem_e deveria trazer o texto do Melancólico");
  assert.ok(/entender a fundo/.test(a.quem_e), "quem_e deveria trazer o texto do Tipo 5");
  assert.ok(/dados e critérios/.test(a.como_comunicar), "como_comunicar deveria trazer o texto do fator C");
  assert.ok(/elogio específico/.test(a.como_motivar), "como_motivar deveria trazer o texto de Palavras de afirmação");
  assert.ok(/secundário \(Fleumático\)/.test(a.quem_e), "quem_e deveria citar o temperamento secundário");
});

test("detecção cai para os scores quando os nomes não são reconhecíveis", () => {
  assert.strictEqual(contexto.detectarLinguagem({ linguagem: "???", distribuicao_linguagem: { A: 1, B: 7, C: 2, D: 0, E: 3 } }), "B");
  assert.strictEqual(contexto.detectarTemperamento({ temperamento: "", percentual_temperamento: { colerico: 10, sanguineo: 55, melancol: 20, fleumatico: 15 } }), "Sanguíneo");
  assert.strictEqual(contexto.detectarEneagrama({ eneagrama: "", scores_eneagrama: { 1: 2, 7: 9, 9: 3 } }), 7);
  assert.strictEqual(contexto.detectarDisc({ disc: "Perfil equilibrado — sem fator dominante", scores_disc: { D: 4, I: -2, S: 1, C: 0 } }), "D");
});

test("empate anunciado no nome usa a primeira categoria citada", () => {
  assert.strictEqual(contexto.detectarLinguagem({ linguagem: "Tempo de qualidade e Atos de serviço" }), "B");
  assert.strictEqual(contexto.detectarTemperamento({ temperamento: "Colérico e Sanguíneo" }), "Colérico");
});

test("envio sem dado nenhum ainda recebe os seis campos, com o texto de resultado equilibrado", () => {
  const a = contexto.gerarAnalisePadrao({});
  CAMPOS.forEach((campo) => {
    assert.ok(typeof a[campo] === "string" && a[campo].length > 0, `campo "${campo}" veio vazio`);
  });
  assert.ok(/equilibrados/.test(a.pontos_fortes), "sem dados, o campo deveria assumir o texto de resultado equilibrado");
  // quem_e nunca fica só com a frase genérica: a ressalva anti-rótulo sempre entra.
  assert.ok(/tendência, não um rótulo/.test(a.quem_e));
});

test("os nove tipos do eneagrama e os quatro fatores DISC têm texto completo", () => {
  for (let tipo = 1; tipo <= 9; tipo++) {
    ["essencia", "forte", "desenvolver", "motivar", "atrito"].forEach((c) => {
      assert.ok(contexto.TEXTOS_ENEAGRAMA[tipo][c], `eneagrama tipo ${tipo} sem o texto "${c}"`);
    });
  }
  ["D", "I", "S", "C"].forEach((f) => {
    ["comunicar", "forte", "atrito"].forEach((c) => {
      assert.ok(contexto.TEXTOS_DISC[f][c], `DISC ${f} sem o texto "${c}"`);
    });
  });
});
