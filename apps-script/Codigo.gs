/**
 * Perfil Comportamental — Backend (Google Apps Script)
 * Colégio Mundo do Saber
 *
 * O que este script faz:
 *  1. Recebe as respostas do formulário (index.html) via POST
 *  2. Salva o resultado na planilha
 *  3. Gera a análise personalizada com IA (Claude / Anthropic)
 *  4. Envia o resultado por e-mail para o colaborador e para o gestor
 *  5. Fornece os dados para o dashboard (dashboard.html) via GET ?action=read
 *
 * CONFIGURAÇÃO (veja também o arquivo CONFIGURACAO.md no repositório):
 *  - Crie o script VINCULADO à sua planilha (Extensões > Apps Script)
 *  - Em Configurações do projeto > Propriedades do script, adicione:
 *      ANTHROPIC_API_KEY  = sua chave da API da Anthropic (sk-ant-...)
 *      EMAIL_GESTOR       = e-mail padrão do gestor (opcional)
 *  - Implante como App da Web: executar como VOCÊ, acesso "Qualquer pessoa"
 */

var NOME_ABA = "Respostas";

var CABECALHO = [
  "Data", "Nome", "E-mail", "Setor",
  "Linguagem", "Temperamento", "Eneagrama",
  "Quem é", "Pontos fortes", "Pontos a desenvolver",
  "Como comunicar", "Como motivar", "Evitar atrito"
];

// ===== ENTRADAS HTTP =====

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (dados.action !== "submit") {
      return respostaJson({ ok: false, erro: "Ação desconhecida" });
    }

    var analise = gerarAnaliseIA(dados); // null se a chave da API não estiver configurada

    salvarNaPlanilha(dados, analise);
    enviarEmails(dados, analise);

    return respostaJson({ ok: true, analise: analise });
  } catch (erro) {
    return respostaJson({ ok: false, erro: String(erro) });
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "read") {
    return respostaJson({ rows: lerRespostas() });
  }

  return respostaJson({ ok: true, servico: "Perfil Comportamental" });
}

// ===== PLANILHA =====

function obterAba() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) {
    aba = planilha.insertSheet(NOME_ABA);
  }
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight("bold");
  }
  return aba;
}

function salvarNaPlanilha(dados, analise) {
  var a = analise || {};
  obterAba().appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
    dados.nome || "",
    dados.email || "",
    dados.setor || "",
    dados.linguagem || "",
    dados.temperamento || "",
    dados.eneagrama || "",
    a.quem_e || "",
    a.pontos_fortes || "",
    a.pontos_desenvolver || "",
    a.como_comunicar || "",
    a.como_motivar || "",
    a.evitar_atrito || ""
  ]);
}

function lerRespostas() {
  var aba = obterAba();
  if (aba.getLastRow() < 2) return [];

  var valores = aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHO.length).getValues();
  return valores.map(function (linha) {
    return {
      data: String(linha[0]),
      nome: linha[1],
      email: linha[2],
      setor: linha[3],
      linguagem: linha[4],
      temperamento: linha[5],
      eneagrama: linha[6],
      quem_e: linha[7],
      pontos_fortes: linha[8],
      pontos_desenvolver: linha[9],
      como_comunicar: linha[10],
      como_motivar: linha[11],
      evitar_atrito: linha[12]
    };
  }).reverse(); // mais recentes primeiro
}

// ===== ANÁLISE COM IA (CLAUDE) =====

function gerarAnaliseIA(dados) {
  var chave = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if (!chave) return null;

  var d = dados.distribuicao_linguagem || {};
  var s = dados.scores_temperamento || {};

  var prompt =
    "Analise o perfil comportamental deste colaborador de uma escola (Colégio Mundo do Saber) " +
    "e escreva uma análise em português do Brasil, em tom acolhedor e profissional, " +
    "dirigida ao próprio colaborador (use 'você'). Cada campo deve ter de 2 a 4 frases.\n\n" +
    "Dados do colaborador:\n" +
    "- Nome: " + dados.nome + "\n" +
    "- Setor: " + dados.setor + "\n" +
    "- Linguagem de valorização principal: " + dados.linguagem +
    " (distribuição: Palavras de afirmação=" + (d.A || 0) +
    ", Tempo de qualidade=" + (d.B || 0) +
    ", Presentes/Mimos=" + (d.C || 0) +
    ", Atos de serviço=" + (d.D || 0) +
    ", Presença/Acolhimento=" + (d.E || 0) + ")\n" +
    "- Temperamento predominante: " + dados.temperamento +
    " (Colérico=" + (s.colerico || 0) + ", Sanguíneo=" + (s.sanguineo || 0) +
    ", Melancólico=" + (s.melancol || 0) + ", Fleumático=" + (s.fleumatico || 0) + ")\n" +
    "- Eneagrama: " + dados.eneagrama + "\n\n" +
    "Os campos 'como_comunicar', 'como_motivar' e 'evitar_atrito' devem orientar o GESTOR " +
    "sobre como lidar com este colaborador no dia a dia escolar.";

  var esquema = {
    type: "object",
    properties: {
      quem_e: { type: "string", description: "Síntese de quem é a pessoa, integrando linguagem, temperamento e eneagrama" },
      pontos_fortes: { type: "string", description: "Principais pontos fortes no ambiente de trabalho" },
      pontos_desenvolver: { type: "string", description: "Pontos de atenção e desenvolvimento, com tom construtivo" },
      como_comunicar: { type: "string", description: "Orientação ao gestor: como se comunicar com esta pessoa" },
      como_motivar: { type: "string", description: "Orientação ao gestor: como motivar e reconhecer esta pessoa" },
      evitar_atrito: { type: "string", description: "Orientação ao gestor: o que evitar para não gerar atrito" }
    },
    required: ["quem_e", "pontos_fortes", "pontos_desenvolver", "como_comunicar", "como_motivar", "evitar_atrito"],
    additionalProperties: false
  };

  var corpo = {
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: "Você é um especialista em comportamento humano e gestão de pessoas em ambiente escolar.",
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: esquema } }
  };

  try {
    var resposta = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": chave,
        "anthropic-version": "2023-06-01"
      },
      payload: JSON.stringify(corpo),
      muteHttpExceptions: true
    });

    if (resposta.getResponseCode() !== 200) {
      console.error("Erro na API da Anthropic: " + resposta.getContentText());
      return null;
    }

    var json = JSON.parse(resposta.getContentText());
    var texto = "";
    (json.content || []).forEach(function (bloco) {
      if (bloco.type === "text") texto += bloco.text;
    });
    return JSON.parse(texto);
  } catch (erro) {
    console.error("Falha ao gerar análise com IA: " + erro);
    return null;
  }
}

// ===== E-MAIL =====

function enviarEmails(dados, analise) {
  var corpoHtml = montarEmailHtml(dados, analise);
  var assunto = "Perfil Comportamental — " + dados.nome;

  // Para o colaborador
  if (dados.email) {
    try {
      MailApp.sendEmail({
        to: dados.email,
        subject: "Seu " + assunto,
        htmlBody: corpoHtml
      });
    } catch (erro) {
      console.error("Falha ao enviar e-mail ao colaborador: " + erro);
    }
  }

  // Para o gestor (o informado no formulário, ou o padrão das propriedades do script)
  var gestor = dados.email_gestor ||
    PropertiesService.getScriptProperties().getProperty("EMAIL_GESTOR");
  if (gestor && gestor !== dados.email) {
    try {
      MailApp.sendEmail({
        to: gestor,
        subject: assunto + " (" + dados.setor + ")",
        htmlBody: corpoHtml
      });
    } catch (erro) {
      console.error("Falha ao enviar e-mail ao gestor: " + erro);
    }
  }
}

function montarEmailHtml(dados, analise) {
  var a = analise || {};
  var secao = function (titulo, texto) {
    if (!texto) return "";
    return '<h3 style="color:#1f4788;font-size:15px;margin:18px 0 4px">' + titulo + "</h3>" +
      '<p style="font-size:13px;line-height:1.6;margin:0">' + texto + "</p>";
  };

  return '<div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:640px;margin:0 auto;color:#222">' +
    '<div style="background:#1f4788;color:#fff;padding:18px;text-align:center;border-radius:8px 8px 0 0">' +
    "<h2 style='margin:0;font-size:20px'>Perfil Comportamental</h2>" +
    "<p style='margin:4px 0 0;font-size:12px;opacity:.85'>Colégio Mundo do Saber</p></div>" +
    '<div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">' +
    '<p style="font-size:13px"><strong>Nome:</strong> ' + dados.nome +
    "<br><strong>Setor:</strong> " + dados.setor +
    "<br><strong>Linguagem de Valorização:</strong> " + dados.linguagem +
    "<br><strong>Temperamento:</strong> " + dados.temperamento +
    "<br><strong>Eneagrama:</strong> " + dados.eneagrama + "</p>" +
    secao("Quem é você", a.quem_e) +
    secao("Pontos Fortes", a.pontos_fortes) +
    secao("Pontos a Desenvolver", a.pontos_desenvolver) +
    secao("Como Comunicar", a.como_comunicar) +
    secao("Como Motivar", a.como_motivar) +
    secao("Evitar Atrito", a.evitar_atrito) +
    "</div></div>";
}

// ===== UTILITÁRIOS =====

function respostaJson(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
