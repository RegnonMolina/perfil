/**
 * Testes das travas de segurança e de privacidade do backend.
 *
 * Rodam o apps-script/Codigo.gs de verdade dentro de um simulador dos serviços
 * do Google (tests/apoio/apps-script-falso.js), exercitando doGet e doPost como
 * o navegador faria.
 *
 * Cada teste corresponde a um risco concreto levantado no diagnóstico:
 * base de dados aberta, formulário sem limite, conta usada como relé de e-mail
 * e tratamento de dado pessoal sem consentimento.
 */

const test = require("node:test");
const assert = require("node:assert");
const { criarAmbiente, envioValido, post, get } = require("./apoio/apps-script-falso.js");

const TOKEN = "token-de-teste-1234567890";

// ============================================================
// LEITURA DA BASE
// ============================================================

test("Leitura é recusada quando o TOKEN_GESTOR não está configurado", () => {
  // Falha fechada: um esquecimento de configuração não pode abrir a base.
  const a = criarAmbiente();
  const r = get(a, { action: "read" });
  assert.strictEqual(r.ok, false);
  assert.match(r.erro, /TOKEN_GESTOR/);
  assert.strictEqual(r.rows, undefined, "nenhuma linha pode vazar junto com o erro");
});

test("Leitura é recusada sem token, com token errado ou com token parcial", () => {
  const a = criarAmbiente({ propriedades: { TOKEN_GESTOR: TOKEN } });
  for (const tentativa of [undefined, "", "errado", TOKEN.slice(0, -1), TOKEN + "x", TOKEN.toUpperCase()]) {
    const r = get(a, tentativa === undefined ? { action: "read" } : { action: "read", token: tentativa });
    assert.strictEqual(r.ok, false, `token "${tentativa}" não deveria ser aceito`);
    assert.strictEqual(r.rows, undefined);
  }
});

test("Leitura funciona com o token correto", () => {
  const a = criarAmbiente({ propriedades: { TOKEN_GESTOR: TOKEN } });
  post(a, envioValido());
  const r = get(a, { action: "read", token: TOKEN });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.rows[0].nome, "Maria da Silva");
});

test("A consulta de versão é pública e não devolve nenhum dado pessoal", () => {
  const a = criarAmbiente({ propriedades: { TOKEN_GESTOR: TOKEN } });
  post(a, envioValido());
  const r = get(a, { action: "versao" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.versao, "v2.1");
  assert.ok(!JSON.stringify(r).includes("maria@"), "a consulta de versão não pode expor dados");
  assert.strictEqual(r.rows, undefined);
});

test("A rota padrão não devolve dados", () => {
  const a = criarAmbiente({ propriedades: { TOKEN_GESTOR: TOKEN } });
  post(a, envioValido());
  const r = get(a, {});
  assert.strictEqual(r.rows, undefined);
});

// ============================================================
// CONSENTIMENTO (LGPD)
// ============================================================

test("Envio sem consentimento é recusado e nada é gravado", () => {
  const a = criarAmbiente();
  const r = post(a, envioValido({ consentimento: false }));
  assert.strictEqual(r.ok, false);
  assert.match(r.erro, /privacidade/i);
  assert.strictEqual(a.__abas.has("Respostas v2") && a.__abas.get("Respostas v2").getLastRow() > 1, false);
  assert.strictEqual(a.__emails.length, 0);
});

test("Consentimento ausente é tratado como recusa", () => {
  // Uma tela alterada no navegador não pode contornar a regra.
  const a = criarAmbiente();
  const corpo = envioValido();
  delete corpo.consentimento;
  assert.strictEqual(post(a, corpo).ok, false);
});

test("A data do consentimento é gravada na planilha", () => {
  const a = criarAmbiente();
  post(a, envioValido({ consentimento_em: "21/08/2026 10:30" }));
  const aba = a.__abas.get("Respostas v2");
  const cabecalho = aba.linhas[0];
  const linha = aba.linhas[1];
  assert.strictEqual(linha[cabecalho.indexOf("Consentimento")], "21/08/2026 10:30");
});

// ============================================================
// VALIDAÇÃO DE ENTRADA
// ============================================================

test("Envio sem nome ou com e-mail inválido é recusado", () => {
  const a = criarAmbiente();
  assert.strictEqual(post(a, envioValido({ nome: "" })).ok, false);
  assert.strictEqual(post(a, envioValido({ nome: "X" })).ok, false);
  for (const email of ["", "sem-arroba", "a@b", "a b@c.com"]) {
    assert.strictEqual(post(a, envioValido({ email })).ok, false, `"${email}" não deveria passar`);
  }
});

test("O campo-armadilha descarta robôs sem gravar nem denunciar a trava", () => {
  const a = criarAmbiente();
  const r = post(a, envioValido({ confirmacao: "http://spam.example" }));
  // Responde ok de propósito, para não ensinar ao robô o que o denunciou.
  assert.strictEqual(r.ok, true);
  assert.strictEqual(a.__emails.length, 0, "nenhum e-mail pode sair");
  assert.ok(!a.__abas.has("Respostas v2") || a.__abas.get("Respostas v2").linhas.length <= 1);
});

// ============================================================
// LIMITES DE USO
// ============================================================

test("O mesmo e-mail não consegue enviar duas vezes seguidas", () => {
  const a = criarAmbiente();
  assert.strictEqual(post(a, envioValido()).ok, true);
  const segundo = post(a, envioValido());
  assert.strictEqual(segundo.ok, false);
  assert.match(segundo.erro, /poucos minutos/);
});

test("O intervalo mínimo não confunde pessoas diferentes", () => {
  const a = criarAmbiente();
  assert.strictEqual(post(a, envioValido({ email: "ana@exemplo.com" })).ok, true);
  assert.strictEqual(post(a, envioValido({ email: "joao@exemplo.com" })).ok, true);
});

test("O teto diário de envios corta antes de chamar a IA, que é o que custa", () => {
  const a = criarAmbiente({ propriedades: { LIMITE_ENVIOS_DIA: "3", ANTHROPIC_API_KEY: "sk-teste" } });
  for (let i = 0; i < 3; i++) {
    assert.strictEqual(post(a, envioValido({ email: `p${i}@exemplo.com` })).ok, true, `envio ${i + 1}`);
  }
  const chamadasAntes = a.__http.length;
  const excedente = post(a, envioValido({ email: "p9@exemplo.com" }));
  assert.strictEqual(excedente.ok, false);
  assert.match(excedente.erro, /limite de envios/i);
  assert.strictEqual(a.__http.length, chamadasAntes, "não pode chamar a API da Anthropic após o teto");
});

test("O teto diário de e-mails para o envio mas preserva a resposta", () => {
  const a = criarAmbiente({ propriedades: { LIMITE_EMAILS_DIA: "2" } });
  post(a, envioValido({ email: "a@exemplo.com" }));
  post(a, envioValido({ email: "b@exemplo.com" }));
  const terceiro = post(a, envioValido({ email: "c@exemplo.com" }));

  assert.strictEqual(terceiro.ok, true, "a resposta da pessoa não pode ser perdida por causa da cota");
  assert.strictEqual(a.__emails.length, 2, "o terceiro e-mail não deve sair");
  assert.strictEqual(a.__abas.get("Respostas v2").linhas.length, 4, "as três respostas continuam gravadas");
});

// ============================================================
// GUARDA DE VERSÃO
// ============================================================

test("A resposta do envio informa a versão do backend", () => {
  // É o que permite ao site detectar um backend desatualizado.
  const a = criarAmbiente();
  assert.strictEqual(post(a, envioValido()).versao, "v2.1");
});

// ============================================================
// A ABA DA v1 CONTINUA INTOCADA
// ============================================================

test("Nenhum envio novo escreve na aba do instrumento antigo", () => {
  const a = criarAmbiente();
  post(a, envioValido({ email: "x@exemplo.com" }));
  post(a, envioValido({ email: "y@exemplo.com" }));
  const v1 = a.__abas.get("Respostas");
  // A aba v1 pode ser criada na leitura, mas só com o cabeçalho — nunca com dados novos.
  assert.ok(!v1 || v1.linhas.length <= 1, "o histórico da v1 não pode receber linha nova");
  assert.strictEqual(a.__abas.get("Respostas v2").linhas.length, 3);
});

// ============================================================
// SANEAMENTO DE SAÍDA
// ============================================================
//
// O que a pessoa digita acaba em dois lugares perigosos: o corpo HTML do
// e-mail, que sai da conta da organização, e as células da planilha.
// Estes testes vieram de uma revisão do PR #2, que apontou a lacuna.

test("Marcação no nome não entra como marcação no e-mail", () => {
  const a = criarAmbiente();
  const html = a.montarEmailHtml({
    nome: '<img src=x onerror="alert(1)">',
    setor: "<b>Coordenação</b>",
    linguagem: "Atos de serviço",
    contexto: {}
  }, null);

  // O que importa é que nenhuma TAG nova exista: os sinais < e > precisam ter
  // virado entidades. A sequência "onerror=" sobrevive como texto dentro do
  // conteúdo escapado, e isso é inofensivo — verificar a ausência dela seria
  // testar a coisa errada.
  assert.ok(!html.includes("<img"), "a marcação do nome vazou como tag para o e-mail");
  assert.ok(!html.includes("<b>Coordenação</b>"), "a marcação do setor vazou como tag");
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"),
    "o nome deveria aparecer inteiramente escapado");
});

test("Marcação vinda da análise da IA também é escapada", () => {
  const a = criarAmbiente();
  const html = a.montarEmailHtml({ nome: "Ana", contexto: {} },
    { quem_e: '</p><script>alert(1)</script><p>' });
  assert.ok(!html.includes("<script>"), "script vazou pela análise");
});

test("Cor inválida não escapa do atributo style", () => {
  const a = criarAmbiente();
  const html = a.montarEmailHtml({
    nome: "Ana",
    cor: '#fff" onload="alert(1)',
    contexto: {}
  }, null);
  assert.ok(!html.includes("onload="), "a cor permitiu sair do atributo");
  assert.ok(html.includes("#1f4788"), "cor inválida deveria cair no padrão");
});

test("Só logo https e sem aspas é aceita", () => {
  const a = criarAmbiente();
  assert.strictEqual(a.urlLogoValida("https://exemplo.com/logo.png"), "https://exemplo.com/logo.png");
  for (const ruim of [
    'https://x.com/a.png" onerror="alert(1)',
    "javascript:alert(1)",
    "http://exemplo.com/logo.png",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "https://exemplo.com/" + "a".repeat(500)
  ]) {
    assert.strictEqual(a.urlLogoValida(ruim), "", `deveria recusar: ${ruim.slice(0, 40)}`);
  }
});

test("Resposta que começa com = não vira fórmula na planilha", () => {
  // O Google Sheets interpreta =, +, - e @ no início de uma célula como
  // fórmula. Um nome como =HYPERLINK(...) viraria link ativo na planilha do
  // gestor, e também no CSV exportado, aberto no Excel.
  const a = criarAmbiente();
  post(a, envioValido({ nome: '=HYPERLINK("http://mau.example","clique")', email: "z@exemplo.com" }));

  const aba = a.__abas.get("Respostas v2");
  const cabecalho = aba.linhas[0];
  const nome = aba.linhas[1][cabecalho.indexOf("Nome")];

  assert.ok(String(nome).startsWith("'"), "a célula deveria começar com apóstrofo para não virar fórmula");
  assert.ok(String(nome).includes("HYPERLINK"), "o conteúdo original deve ser preservado");
});

test("Texto comum não é alterado ao ir para a planilha", () => {
  const a = criarAmbiente();
  assert.strictEqual(a.textoParaPlanilha("Maria da Silva"), "Maria da Silva");
  assert.strictEqual(a.textoParaPlanilha("Coordenação"), "Coordenação");
  assert.strictEqual(a.textoParaPlanilha(""), "");
});

// ============================================================
// SCRIPT INDEPENDENTE (NÃO VINCULADO À PLANILHA)
// ============================================================

test("Envio grava mesmo quando o script não está vinculado à planilha", () => {
  // Num projeto Apps Script independente, getActiveSpreadsheet() volta null.
  // O backend precisa cair para openById com a propriedade PLANILHA_ID —
  // senão todo envio quebra em produção sem nenhum aviso no formulário.
  const a = criarAmbiente({ propriedades: { PLANILHA_ID: "planilha-do-colegio" } });
  a.__semPlanilhaAtiva = true;
  const r = post(a, envioValido());
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(a.__ultimoOpenById, "planilha-do-colegio");
});

test("Sem PLANILHA_ID configurada, o script independente usa o ID padrão do CMS", () => {
  const a = criarAmbiente();
  a.__semPlanilhaAtiva = true;
  const r = post(a, envioValido());
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.match(a.__ultimoOpenById, /^1pQZ5/);
});
