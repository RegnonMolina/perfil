/**
 * Testes da notificação no Google Chat (notificarChat, apps-script/Codigo.gs).
 *
 * Garantias:
 *  - sem a propriedade CHAT_WEBHOOK_PERFIL, nada é enviado (outras
 *    organizações que usam o mesmo backend não mudam de comportamento);
 *  - com a propriedade, cada resposta gravada gera uma mensagem no webhook;
 *  - a mensagem leva só nome e grupo, nunca o perfil;
 *  - falha no Chat nunca derruba o envio da pessoa;
 *  - envio recusado (validação, robô) não notifica.
 */

const test = require("node:test");
const assert = require("node:assert");
const { criarAmbiente, envioValido, post } = require("./apoio/apps-script-falso.js");

const WEBHOOK = "https://chat.googleapis.com/v1/spaces/TESTE/messages?key=k&token=t";

function chamadasAoChat(ambiente) {
  return ambiente.__http.filter((c) => c.url === WEBHOOK);
}

test("Sem CHAT_WEBHOOK_PERFIL nenhuma notificação é enviada", () => {
  const a = criarAmbiente();
  const r = post(a, envioValido());
  assert.strictEqual(r.ok, true);
  assert.strictEqual(a.__http.filter((c) => /chat\.googleapis/.test(c.url)).length, 0);
});

test("Com CHAT_WEBHOOK_PERFIL cada resposta gera uma mensagem com nome e grupo", () => {
  const a = criarAmbiente({ propriedades: { CHAT_WEBHOOK_PERFIL: WEBHOOK } });
  const r = post(a, envioValido());
  assert.strictEqual(r.ok, true);

  const chamadas = chamadasAoChat(a);
  assert.strictEqual(chamadas.length, 1);
  assert.strictEqual(chamadas[0].params.method, "post");
  const texto = JSON.parse(chamadas[0].params.payload).text;
  assert.match(texto, /Nova resposta no Perfil Comportamental/);
  assert.match(texto, /Maria da Silva/);
  assert.match(texto, /Setor: Coordenação/);
});

test("A mensagem no Chat não expõe o perfil nem o e-mail", () => {
  const a = criarAmbiente({ propriedades: { CHAT_WEBHOOK_PERFIL: WEBHOOK } });
  post(a, envioValido());
  const texto = JSON.parse(chamadasAoChat(a)[0].params.payload).text;
  for (const sensivel of ["Melancólico", "Perfeccionista", "Atos de serviço", "Guardião", "maria@"]) {
    assert.ok(!texto.includes(sensivel), `a mensagem não pode conter "${sensivel}"`);
  }
});

test("URL_DASHBOARD acrescenta o link do painel", () => {
  const a = criarAmbiente({
    propriedades: { CHAT_WEBHOOK_PERFIL: WEBHOOK, URL_DASHBOARD: "https://exemplo.github.io/perfil/dashboard.html" }
  });
  post(a, envioValido());
  const texto = JSON.parse(chamadasAoChat(a)[0].params.payload).text;
  assert.match(texto, /<https:\/\/exemplo\.github\.io\/perfil\/dashboard\.html\|Abrir o dashboard>/);
});

test("Erro do Google Chat não derruba o envio da pessoa", () => {
  const a = criarAmbiente({
    propriedades: { CHAT_WEBHOOK_PERFIL: WEBHOOK },
    respostaHttp: { codigo: 500, corpo: "erro" }
  });
  const r = post(a, envioValido());
  assert.strictEqual(r.ok, true);
  assert.strictEqual(a.__abas.get("Respostas v2").getLastRow() > 1, true, "a resposta continua gravada");
});

test("Envio recusado ou de robô não gera notificação", () => {
  const a = criarAmbiente({ propriedades: { CHAT_WEBHOOK_PERFIL: WEBHOOK } });
  post(a, envioValido({ consentimento: false }));
  post(a, envioValido({ confirmacao: "sou um robô" }));
  assert.strictEqual(chamadasAoChat(a).length, 0);
});
