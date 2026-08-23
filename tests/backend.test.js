/**
 * Testes das funções do backend (apps-script/Codigo.gs) que não dependem
 * dos serviços do Google.
 *
 * O arquivo .gs é JavaScript comum, então dá para carregá-lo num contexto
 * isolado e testar as funções puras: formatação de scores, leitura do
 * vocabulário da organização e montagem do e-mail. São exatamente as partes
 * que o destinatário vê — e que antes só eram conferidas no olho.
 *
 * O que NÃO é testado aqui (depende de SpreadsheetApp / MailApp / UrlFetchApp):
 * gravação na planilha, envio de e-mail e a chamada à API da Anthropic.
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

test("formatarScores devolve texto legível e aguenta valor ausente", () => {
  assert.strictEqual(contexto.formatarScores({ A: 6, B: 3 }), "A: 6 | B: 3");
  assert.strictEqual(contexto.formatarScores(null), "");
  assert.strictEqual(contexto.formatarScores({}), "");
});

test("obterContexto usa o vocabulário enviado pela organização", () => {
  const ctx = contexto.obterContexto({
    contexto: {
      tipoOrganizacao: "um grupo de networking de negócios",
      termoPessoa: "membro",
      termoLider: "líder do capítulo",
      termoGrupo: "Categoria profissional",
      descricaoAmbiente: "as reuniões semanais"
    }
  });
  assert.strictEqual(ctx.termoPessoa, "membro");
  assert.strictEqual(ctx.termoLider, "líder do capítulo");
  assert.strictEqual(ctx.termoGrupo, "Categoria profissional");
});

test("obterContexto tem padrão seguro quando o POST vem sem contexto", () => {
  // Cenário real: um site ainda publicado com o config.js antigo.
  const ctx = contexto.obterContexto({});
  assert.strictEqual(ctx.tipoOrganizacao, "uma organização");
  assert.strictEqual(ctx.termoPessoa, "colaborador");
  assert.ok(ctx.descricaoAmbiente);
});

test("O cabeçalho da v2 cobre os quatro módulos e o controle de qualidade", () => {
  const h = contexto.CABECALHO_V2;
  ["Versão", "Linguagem", "Temperamento", "Eneagrama", "Eneagrama 2º lugar", "Centro", "Fichas escolhidas", "DISC", "Qualidade", "Alertas"]
    .forEach((coluna) => assert.ok(h.includes(coluna), `falta a coluna "${coluna}" no cabeçalho da v2`));
});

test("A aba da v1 continua existindo e separada da v2", () => {
  // Garantia de que o histórico não é sobrescrito.
  assert.strictEqual(contexto.NOME_ABA, "Respostas");
  assert.strictEqual(contexto.NOME_ABA_V2, "Respostas v2");
  assert.notStrictEqual(contexto.NOME_ABA, contexto.NOME_ABA_V2);
  assert.strictEqual(contexto.CABECALHO.length, 13, "o cabeçalho da v1 não pode mudar: ele descreve as linhas já gravadas");
});

test("O e-mail traz os quatro módulos e o aviso de uso", () => {
  const html = contexto.montarEmailHtml({
    nome: "Maria da Silva",
    setor: "Coordenação",
    linguagem: "Atos de serviço",
    linguagem_secundaria: "Palavras de afirmação",
    temperamento: "Melancólico",
    temperamento_secundario: "Fleumático",
    eneagrama: "Tipo 1 — Perfeccionista",
    eneagrama_segundo: "Tipo 9 — Pacificador",
    eneagrama_centro: "Instintivo",
    eneagrama_fichas: "1, 2, 10, 11",
    disc: "CS — Guardião",
    disc_dominante: "Conformidade",
    disc_secundario: "Estabilidade",
    versao_instrumento: "v2.0",
    contexto: { termoGrupo: "Setor" }
  }, {
    quem_e: "Você combina exigência com serenidade.",
    pontos_fortes: "Consistência.",
    pontos_desenvolver: "Flexibilidade.",
    como_comunicar: "Seja específico.",
    como_motivar: "Reconheça o cuidado.",
    evitar_atrito: "Evite mudanças de última hora."
  });

  ["Atos de serviço", "Melancólico", "Tipo 1", "CS — Guardião", "2º lugar", "centro", "Instintivo"]
    .forEach((t) => assert.ok(html.includes(t), `o e-mail não menciona "${t}"`));
  assert.ok(html.includes("Não é ferramenta de seleção"), "falta o aviso de uso no rodapé do e-mail");
  assert.ok(html.includes("v2.0"), "falta a versão do instrumento no e-mail");
});

test("O e-mail avisa quando o preenchimento levantou alerta de qualidade", () => {
  const html = contexto.montarEmailHtml({
    nome: "João Pereira",
    qualidade_status: "Revisar",
    qualidade_alertas: "Preenchido em menos de 4 minutos",
    contexto: {}
  }, null);
  assert.ok(html.includes("alertas de qualidade"));
  assert.ok(html.includes("Preenchido em menos de 4 minutos"));
});

test("O e-mail omite as linhas de campos que não vieram", () => {
  // Uma resposta sem DISC (por exemplo, vinda de um front desatualizado)
  // não pode gerar uma linha "DISC: undefined".
  const html = contexto.montarEmailHtml({ nome: "Ana Souza", contexto: {} }, null);
  assert.ok(!html.includes("undefined"), "há campo indefinido vazando para o corpo do e-mail");
  assert.ok(!html.includes("DISC:"), "linha de DISC não deveria aparecer quando não há dado");
});
