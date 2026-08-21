/**
 * Simulador mínimo dos serviços do Google Apps Script.
 *
 * Serve para carregar o apps-script/Codigo.gs num contexto isolado e exercitar
 * doGet e doPost de verdade — inclusive as travas de segurança — sem depender
 * do Google e sem tocar em nenhuma planilha real.
 *
 * Só implementa o que o Codigo.gs realmente usa. Não é um emulador completo.
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function doisDigitos(n) {
  return String(n).padStart(2, "0");
}

function criarAmbiente(opcoes = {}) {
  const propriedades = new Map(Object.entries(opcoes.propriedades || {}));
  const cache = new Map();
  const emailsEnviados = [];
  const chamadasHttp = [];
  const abas = new Map();

  function criarAba(nome) {
    const linhas = [];
    const aba = {
      nome,
      linhas,
      getLastRow: () => linhas.length,
      appendRow: (linha) => linhas.push(linha.slice()),
      setFrozenRows: () => {},
      getRange: (linhaInicial, colInicial, numLinhas, numCols) => ({
        getValues: () =>
          linhas
            .slice(linhaInicial - 1, linhaInicial - 1 + numLinhas)
            .map((l) => {
              const fatia = l.slice(colInicial - 1, colInicial - 1 + numCols);
              while (fatia.length < numCols) fatia.push("");
              return fatia;
            }),
        setFontWeight: () => {}
      })
    };
    abas.set(nome, aba);
    return aba;
  }

  const contexto = {
    console: { error: () => {}, log: () => {}, warn: () => {} },

    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (propriedades.has(k) ? propriedades.get(k) : null),
        setProperty: (k, v) => propriedades.set(k, String(v)),
        deleteProperty: (k) => propriedades.delete(k)
      })
    },

    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => cache.set(k, v),
        remove: (k) => cache.delete(k)
      })
    },

    LockService: {
      getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} })
    },

    Session: { getScriptTimeZone: () => "America/Sao_Paulo" },

    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      computeDigest: (_alg, texto) => Array.from(crypto.createHash("sha256").update(texto).digest()),
      formatDate: (data, _tz, formato) => {
        const d = data instanceof Date ? data : new Date(data);
        if (formato === "yyyyMMdd") {
          return `${d.getFullYear()}${doisDigitos(d.getMonth() + 1)}${doisDigitos(d.getDate())}`;
        }
        return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()} ` +
          `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (nome) => abas.get(nome) || null,
        insertSheet: (nome) => criarAba(nome)
      })
    },

    MailApp: {
      sendEmail: (opcoes) => {
        if (contexto.__falharEmail) throw new Error("cota de e-mail estourada");
        emailsEnviados.push(opcoes);
      }
    },

    UrlFetchApp: {
      fetch: (url, params) => {
        chamadasHttp.push({ url, params });
        const resposta = opcoes.respostaHttp || { codigo: 200, corpo: JSON.stringify({ content: [] }) };
        return {
          getResponseCode: () => resposta.codigo,
          getContentText: () => resposta.corpo
        };
      }
    },

    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (texto) => ({
        setMimeType: () => ({ getContent: () => texto }),
        getContent: () => texto
      })
    }
  };

  vm.createContext(contexto);
  const codigo = fs.readFileSync(
    path.join(__dirname, "..", "..", "apps-script", "Codigo.gs"), "utf8");
  vm.runInContext(codigo, contexto);

  // Atalhos de inspeção para os testes.
  contexto.__emails = emailsEnviados;
  contexto.__http = chamadasHttp;
  contexto.__abas = abas;
  contexto.__propriedades = propriedades;
  contexto.__cache = cache;

  return contexto;
}

// Lê a resposta JSON devolvida por doGet/doPost.
function lerResposta(saida) {
  return JSON.parse(saida.getContent());
}

// Monta o corpo de um POST válido, com todos os campos obrigatórios.
function envioValido(extras = {}) {
  return {
    action: "submit",
    versao_instrumento: "v2.0",
    nome: "Maria da Silva",
    email: "maria@exemplo.com.br",
    setor: "Coordenação",
    consentimento: true,
    consentimento_em: "21/08/2026 10:00",
    linguagem: "Atos de serviço",
    temperamento: "Melancólico",
    eneagrama: "Tipo 1 — Perfeccionista",
    disc: "CS — Guardião",
    qualidade_status: "OK",
    contexto: { termoGrupo: "Setor" },
    ...extras
  };
}

function post(ambiente, corpo) {
  return lerResposta(ambiente.doPost({ postData: { contents: JSON.stringify(corpo) } }));
}

function get(ambiente, parametros = {}) {
  return lerResposta(ambiente.doGet({ parameter: parametros }));
}

module.exports = { criarAmbiente, lerResposta, envioValido, post, get };
