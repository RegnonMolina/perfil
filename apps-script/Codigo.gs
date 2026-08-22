/**
 * Perfil Comportamental — Backend (Google Apps Script)
 *
 * O que este script faz:
 *  1. Recebe as respostas do formulário (index.html) via POST
 *  2. Salva o resultado na planilha
 *  3. Gera a análise personalizada com IA (Claude / Anthropic)
 *  4. Envia o resultado por e-mail para a pessoa e para quem lidera
 *  5. Fornece os dados para o dashboard (dashboard.html) via GET ?action=read
 *
 * INSTRUMENTO v2.0 — quatro módulos:
 *   Linguagens de Valorização, Temperamento, Eneagrama (9 tipos) e DISC.
 *
 * SOBRE AS DUAS ABAS
 *  A aba "Respostas" guarda o histórico da v1 e NÃO é mais escrita nem alterada.
 *  As respostas novas vão para "Respostas v2", que tem colunas a mais (DISC,
 *  asa, centro, controle de qualidade, versão do instrumento).
 *  O dashboard lê as duas e mostra a versão de cada linha, porque resultados
 *  da v1 e da v2 não são comparáveis entre si: o questionário mudou.
 *
 * SOBRE O VOCABULÁRIO
 *  Palavras como "escola", "colaborador" e "gestor" não estão mais fixas aqui.
 *  Elas chegam no campo "contexto" do POST, vindo do config.js de cada
 *  organização. É isso que permite um único backend atender o colégio e o
 *  grupo de networking sem manter duas cópias deste arquivo.
 *
 * CONFIGURAÇÃO (veja também o arquivo CONFIGURACAO.md no repositório):
 *  - Crie o script VINCULADO à sua planilha (Extensões > Apps Script)
 *  - Em Configurações do projeto > Propriedades do script, adicione:
 *      ANTHROPIC_API_KEY  = sua chave da API da Anthropic (sk-ant-...)
 *      EMAIL_GESTOR       = e-mail padrão de quem lidera (opcional)
 *  - Implante como App da Web: executar como VOCÊ, acesso "Qualquer pessoa"
 */

// Aba do instrumento v1 — preservada apenas para leitura do histórico.
// Versão deste backend. O formulário confere este número antes de enviar:
// se o site já estiver na v2 e o Apps Script ainda estiver na v1, o envio é
// bloqueado com uma mensagem clara, em vez de gravar dados incompletos na aba
// errada. Ao alterar o formato dos dados, suba esta versão junto.
var VERSAO_BACKEND = "v2.1";

var NOME_ABA = "Respostas";

// Aba do instrumento v2 — onde as respostas novas são gravadas.
var NOME_ABA_V2 = "Respostas v2";

// Cabeçalho da v1, mantido para conseguir ler as linhas antigas.
var CABECALHO = [
  "Data", "Nome", "E-mail", "Setor",
  "Linguagem", "Temperamento", "Eneagrama",
  "Quem é", "Pontos fortes", "Pontos a desenvolver",
  "Como comunicar", "Como motivar", "Evitar atrito"
];

var CABECALHO_V2 = [
  "Data", "Versão", "Nome", "E-mail", "Grupo",
  "Linguagem", "Linguagem secundária", "Distribuição linguagem",
  "Temperamento", "Temperamento secundário", "Percentual temperamento",
  "Eneagrama", "Eneagrama 2º lugar", "Centro", "Fichas escolhidas", "Scores eneagrama",
  "DISC", "DISC dominante", "DISC secundário", "Scores DISC",
  "Qualidade", "Alertas", "Duração (s)", "Consentimento",
  "Quem é", "Pontos fortes", "Pontos a desenvolver",
  "Como comunicar", "Como motivar", "Evitar atrito"
];

// ===== SEGURANÇA E LIMITES =====
//
// O QUE ESTAS TRAVAS FAZEM — E O QUE NÃO FAZEM
//
// LEITURA (?action=read): protegida de verdade. Exige o TOKEN_GESTOR, que vive
// só nas Propriedades do Script e é digitado pelo gestor no dashboard. Se a
// propriedade não estiver configurada, a leitura é RECUSADA — falha fechada, e
// não aberta. Antes disso, qualquer pessoa com a URL baixava a base inteira.
//
// ESCRITA (doPost): limitada, não impedida. O formulário é público por
// natureza — qualquer segredo colocado no site estático seria visível no
// código-fonte da página, o que seria encenação, não segurança. O que dá para
// fazer, e é o que está aqui, é limitar o estrago: campo-armadilha para robôs
// simples, teto diário de envios, intervalo mínimo entre envios do mesmo
// e-mail e teto diário de e-mails. Isso protege a cota do Google e o custo da
// API da Anthropic, e impede que a conta vire relé de spam em escala. Um
// atacante determinado ainda consegue inserir linhas.
//
// Para proteção real na escrita seria preciso exigir login (implantar o app
// como "executar como usuário que acessa", com acesso restrito ao domínio) —
// o que fecharia o formulário para quem não tem conta na organização.

var LIMITE_ENVIOS_DIA_PADRAO = 200;
var LIMITE_EMAILS_DIA_PADRAO = 150;
var INTERVALO_MINIMO_SEGUNDOS = 120;

function propriedade(nome, padrao) {
  var valor = PropertiesService.getScriptProperties().getProperty(nome);
  return (valor === null || valor === "") ? padrao : valor;
}

// Comparação de tempo constante: percorre a string inteira mesmo quando já
// encontrou diferença, para não revelar o token caractere a caractere.
function comparacaoSegura(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length) return false;
  var diferenca = 0;
  for (var i = 0; i < a.length; i++) {
    diferenca |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return diferenca === 0;
}

function chaveDoDia(prefixo) {
  var hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  return prefixo + "_" + hoje;
}

// Incrementa um contador diário e diz se ainda está dentro do teto.
// O bloqueio evita que dois envios simultâneos leiam o mesmo valor.
function dentroDoLimiteDiario(prefixo, limite) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (erro) {
    return true; // Sob disputa, prefere deixar passar a derrubar um envio legítimo.
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var chave = chaveDoDia(prefixo);
    var atual = Number(props.getProperty(chave) || 0);
    if (atual >= limite) return false;
    props.setProperty(chave, String(atual + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

// Intervalo mínimo entre envios do mesmo e-mail. O e-mail nunca é guardado em
// claro na cache: só o resumo criptográfico dele.
function envioRepetido(email) {
  var cache = CacheService.getScriptCache();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(email).toLowerCase());
  var chave = "envio_" + digest.map(function (b) {
    return ("0" + (b & 0xFF).toString(16)).slice(-2);
  }).join("").substring(0, 32);

  if (cache.get(chave)) return true;
  cache.put(chave, "1", INTERVALO_MINIMO_SEGUNDOS);
  return false;
}

// Validação do que chega. Devolve a mensagem de erro, ou "" se estiver tudo certo.
function validarEnvio(dados) {
  if (!dados.nome || String(dados.nome).trim().length < 2) {
    return "Informe o nome completo.";
  }
  if (!dados.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(dados.email).trim())) {
    return "Informe um e-mail válido.";
  }
  // Consentimento é exigido no servidor, e não só na tela: sem ele, o dado
  // pessoal não pode ser tratado, e uma tela alterada não contorna a regra.
  if (dados.consentimento !== true) {
    return "É necessário aceitar o aviso de privacidade para enviar as respostas.";
  }
  return "";
}

// ===== ENTRADAS HTTP =====

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (dados.action !== "submit") {
      return respostaJson({ ok: false, erro: "Ação desconhecida" });
    }

    // Campo-armadilha: invisível para pessoas, preenchido por robôs que
    // completam tudo. Responde ok para não ensinar ao robô o que o denunciou,
    // mas não grava nada.
    if (dados.confirmacao) {
      return respostaJson({ ok: true, versao: VERSAO_BACKEND });
    }

    var erro = validarEnvio(dados);
    if (erro) {
      return respostaJson({ ok: false, erro: erro });
    }

    if (envioRepetido(dados.email)) {
      return respostaJson({
        ok: false,
        erro: "Já recebemos um envio deste e-mail há poucos minutos. Se foi engano, aguarde alguns instantes."
      });
    }

    // O teto diário é conferido ANTES da chamada à IA, que é a parte que custa.
    var limiteEnvios = Number(propriedade("LIMITE_ENVIOS_DIA", LIMITE_ENVIOS_DIA_PADRAO));
    if (!dentroDoLimiteDiario("envios", limiteEnvios)) {
      console.error("Teto diário de envios atingido (" + limiteEnvios + ").");
      return respostaJson({
        ok: false,
        erro: "O limite de envios de hoje foi atingido. Avise a coordenação e tente novamente amanhã."
      });
    }

    var analise = gerarAnaliseIA(dados); // null se a chave da API não estiver configurada

    salvarNaPlanilha(dados, analise);
    enviarEmails(dados, analise);

    return respostaJson({ ok: true, analise: analise, versao: VERSAO_BACKEND });
  } catch (erro) {
    return respostaJson({ ok: false, erro: String(erro) });
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  // Pública de propósito: é assim que o formulário confere, antes de enviar,
  // se o backend já está na mesma versão do site. Não revela nenhum dado.
  if (action === "versao") {
    return respostaJson({ ok: true, servico: "Perfil Comportamental", versao: VERSAO_BACKEND });
  }

  if (action === "read") {
    var token = propriedade("TOKEN_GESTOR", "");

    // Falha FECHADA: sem token configurado, ninguém lê. O contrário
    // transformaria um esquecimento de configuração em base aberta.
    if (!token) {
      return respostaJson({
        ok: false,
        erro: "Leitura bloqueada: a propriedade TOKEN_GESTOR não está configurada no Apps Script. " +
              "Veja CONFIGURACAO.md, seção 'Proteção dos dados'."
      });
    }

    var enviado = (e && e.parameter && e.parameter.token) || "";
    if (!comparacaoSegura(enviado, token)) {
      return respostaJson({ ok: false, erro: "Token do gestor inválido ou ausente." });
    }

    return respostaJson({ ok: true, rows: lerRespostas(), versao: VERSAO_BACKEND });
  }

  return respostaJson({ ok: true, servico: "Perfil Comportamental", versao: VERSAO_BACKEND });
}

// ===== PLANILHA =====

// Aba do histórico v1. Só é usada para leitura — nunca recebe linha nova.
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

function obterAbaV2() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(NOME_ABA_V2);
  if (!aba) {
    aba = planilha.insertSheet(NOME_ABA_V2);
  }
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO_V2);
    aba.getRange(1, 1, 1, CABECALHO_V2.length).setFontWeight("bold");
    aba.setFrozenRows(1);
  }
  return aba;
}

// ===== SANEAMENTO DE SAÍDA =====
//
// Tudo o que vem do formulário é digitado por qualquer pessoa da internet, e
// esses valores acabam em dois lugares perigosos: o corpo HTML do e-mail que
// sai da conta da organização, e as células da planilha. Cada destino precisa
// de um tratamento diferente.

// Escapa texto para uso dentro de HTML. Sem isto, um nome com marcação entra
// como marcação no e-mail — que é enviado pela conta do colégio, com a
// credibilidade dele.
function escaparHtml(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// A cor entra num atributo style. Só hexadecimal de 6 dígitos passa; qualquer
// outra coisa vira a cor padrão, em vez de escapar do atributo.
function corValida(valor) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(valor || "")) ? String(valor) : "#1f4788";
}

// A logo entra num src="...". Precisa ser https e não pode conter aspas nem
// sinais que permitam sair do atributo. Na dúvida, o e-mail sai sem logo.
function urlLogoValida(valor) {
  var url = String(valor || "").trim();
  if (!url || url.length > 400) return "";
  return /^https:\/\/[^\s"'<>\\]+$/.test(url) ? url : "";
}

// Impede injeção de fórmula na planilha: uma resposta que começa com =, +, -
// ou @ seria interpretada como fórmula pelo Google Sheets ao ser aberta, e
// também por Excel ao abrir o CSV exportado. O apóstrofo força texto.
function textoParaPlanilha(valor) {
  var texto = String(valor === null || valor === undefined ? "" : valor);
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}

// Transforma um objeto de scores em texto legível na planilha.
// Exemplo: { A: 6, B: 3 }  =>  "A: 6 | B: 3"
function formatarScores(objeto) {
  if (!objeto) return "";
  return Object.keys(objeto).map(function (k) {
    return k + ": " + objeto[k];
  }).join(" | ");
}

function salvarNaPlanilha(dados, analise) {
  var a = analise || {};
  var t = textoParaPlanilha; // atalho: toda célula de texto passa por aqui

  obterAbaV2().appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
    dados.versao_instrumento || "v2.0",
    t(dados.nome),
    t(dados.email),
    t(dados.setor),

    t(dados.linguagem),
    t(dados.linguagem_secundaria),
    formatarScores(dados.distribuicao_linguagem),

    t(dados.temperamento),
    t(dados.temperamento_secundario),
    formatarScores(dados.percentual_temperamento),

    t(dados.eneagrama),
    t(dados.eneagrama_segundo),
    t(dados.eneagrama_centro),
    t(dados.eneagrama_fichas),
    formatarScores(dados.scores_eneagrama),

    t(dados.disc),
    t(dados.disc_dominante),
    t(dados.disc_secundario),
    formatarScores(dados.scores_disc),

    t(dados.qualidade_status),
    t(dados.qualidade_alertas),
    dados.duracao_segundos || "",
    t(dados.consentimento_em),

    t(a.quem_e),
    t(a.pontos_fortes),
    t(a.pontos_desenvolver),
    t(a.como_comunicar),
    t(a.como_motivar),
    t(a.evitar_atrito)
  ]);
}

// Lê as duas abas e devolve tudo com a versão marcada.
// As linhas da v1 vêm com os campos novos vazios — o dashboard sabe lidar.
function lerRespostas() {
  return lerRespostasV2().concat(lerRespostasV1());
}

function lerRespostasV1() {
  var aba = obterAba();
  if (aba.getLastRow() < 2) return [];

  var valores = aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHO.length).getValues();
  return valores.map(function (linha) {
    return {
      versao: "v1",
      data: String(linha[0]),
      nome: linha[1],
      email: linha[2],
      setor: linha[3],
      linguagem: linha[4],
      linguagem_secundaria: "",
      temperamento: linha[5],
      temperamento_secundario: "",
      eneagrama: linha[6],
      eneagrama_segundo: "",
      eneagrama_centro: "",
      eneagrama_fichas: "",
      disc: "",
      disc_dominante: "",
      disc_secundario: "",
      qualidade: "",
      alertas: "",
      quem_e: linha[7],
      pontos_fortes: linha[8],
      pontos_desenvolver: linha[9],
      como_comunicar: linha[10],
      como_motivar: linha[11],
      evitar_atrito: linha[12]
    };
  }).reverse(); // mais recentes primeiro
}

function lerRespostasV2() {
  var aba = obterAbaV2();
  if (aba.getLastRow() < 2) return [];

  var valores = aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHO_V2.length).getValues();
  return valores.map(function (linha) {
    return {
      data: String(linha[0]),
      versao: linha[1] || "v2.0",
      nome: linha[2],
      email: linha[3],
      setor: linha[4],
      linguagem: linha[5],
      linguagem_secundaria: linha[6],
      distribuicao_linguagem: linha[7],
      temperamento: linha[8],
      temperamento_secundario: linha[9],
      percentual_temperamento: linha[10],
      eneagrama: linha[11],
      eneagrama_segundo: linha[12],
      eneagrama_centro: linha[13],
      eneagrama_fichas: linha[14],
      scores_eneagrama: linha[15],
      disc: linha[16],
      disc_dominante: linha[17],
      disc_secundario: linha[18],
      scores_disc: linha[19],
      qualidade: linha[20],
      alertas: linha[21],
      duracao: linha[22],
      consentimento_em: linha[23],
      quem_e: linha[24],
      pontos_fortes: linha[25],
      pontos_desenvolver: linha[26],
      como_comunicar: linha[27],
      como_motivar: linha[28],
      evitar_atrito: linha[29]
    };
  }).reverse(); // mais recentes primeiro
}

// ===== ANÁLISE COM IA (CLAUDE) =====

// Lê o vocabulário enviado pelo config.js da organização, com um padrão
// seguro para o caso de um front antigo enviar o POST sem esse bloco.
function obterContexto(dados) {
  var c = (dados && dados.contexto) || {};
  return {
    tipoOrganizacao: c.tipoOrganizacao || "uma organização",
    termoPessoa: c.termoPessoa || "colaborador",
    termoLider: c.termoLider || "gestor",
    termoGrupo: c.termoGrupo || "Grupo",
    descricaoAmbiente: c.descricaoAmbiente || "o dia a dia de trabalho"
  };
}

function gerarAnaliseIA(dados) {
  var chave = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if (!chave) return null;

  var ctx = obterContexto(dados);
  var organizacao = dados.organizacao || dados.escola || "";

  var d = dados.distribuicao_linguagem || {};
  var t = dados.percentual_temperamento || dados.scores_temperamento || {};
  var en = dados.scores_eneagrama || {};
  var di = dados.scores_disc || {};

  var prompt =
    "Analise o perfil comportamental desta pessoa e escreva em português do Brasil, " +
    "em tom acolhedor e profissional, dirigida à própria pessoa (use 'você'). " +
    "Cada campo deve ter de 2 a 4 frases.\n\n" +

    "CONTEXTO\n" +
    "- A pessoa é " + ctx.termoPessoa + " de " + ctx.tipoOrganizacao +
    (organizacao ? " (" + organizacao + ")" : "") + ".\n" +
    "- O ambiente a considerar nos exemplos é " + ctx.descricaoAmbiente + ".\n" +
    "- Quem lidera esta pessoa é tratado como " + ctx.termoLider + ".\n" +
    "- " + ctx.termoGrupo + ": " + (dados.setor || "não informado") + "\n\n" +

    "DADOS\n" +
    "- Nome: " + dados.nome + "\n" +
    "- Linguagem de valorização principal: " + dados.linguagem +
    (dados.linguagem_secundaria ? " (secundária: " + dados.linguagem_secundaria + ")" : "") +
    " — distribuição: Palavras de afirmação=" + (d.A || 0) +
    ", Tempo de qualidade=" + (d.B || 0) +
    ", Presentes/Mimos=" + (d.C || 0) +
    ", Atos de serviço=" + (d.D || 0) +
    ", Presença/Acolhimento=" + (d.E || 0) + "\n" +

    "- Temperamento predominante: " + dados.temperamento +
    (dados.temperamento_secundario ? " (secundário: " + dados.temperamento_secundario + ")" : "") +
    " — percentuais: Colérico=" + (t.colerico || 0) +
    ", Sanguíneo=" + (t.sanguineo || 0) +
    ", Melancólico=" + (t.melancol || 0) +
    ", Fleumático=" + (t.fleumatico || 0) + "\n" +

    "- Eneagrama: " + dados.eneagrama +
    (dados.eneagrama_segundo ? " (segundo lugar: " + dados.eneagrama_segundo + ")" : "") +
    (dados.eneagrama_centro ? ", centro de inteligência " + dados.eneagrama_centro : "") +
    " — escolhas por tipo, de 0 a 10, somando 20: " + formatarScores(en) + "\n" +

    "- DISC: " + (dados.disc || "não informado") +
    (dados.disc_dominante ? " — fator dominante " + dados.disc_dominante : "") +
    (dados.disc_secundario ? ", secundário " + dados.disc_secundario : "") +
    " — scores (faixa de -12 a +12): " + formatarScores(di) + "\n\n" +

    "INSTRUÇÕES\n" +
    "- Integre os QUATRO instrumentos em uma leitura única e coerente. Não " +
    "descreva um por um: mostre como eles se reforçam ou se tensionam.\n" +
    "- Quando dois instrumentos apontarem para lados opostos, diga isso com " +
    "naturalidade, como uma nuance da pessoa, e não como contradição ou erro.\n" +
    "- Os campos 'como_comunicar', 'como_motivar' e 'evitar_atrito' orientam " +
    ctx.termoLider + " sobre como lidar com esta pessoa no dia a dia, com " +
    "exemplos concretos de " + ctx.descricaoAmbiente + ".\n" +
    "- Não use rótulos determinísticos ('você é assim e pronto'). Fale em " +
    "tendências e preferências.\n" +
    "- No eneagrama, trabalhe com o primeiro e o segundo lugar. NÃO mencione " +
    "asa: o instrumento usado não mede isso, e o segundo colocado não é " +
    "necessariamente um tipo vizinho.\n" +
    "- Não sugira decisões de contratação, promoção ou desligamento: este é um " +
    "instrumento de desenvolvimento, não de seleção." +

    (dados.qualidade_status && dados.qualidade_status !== "OK"
      ? "\n- ATENÇÃO: o preenchimento levantou alertas de qualidade (" +
        dados.qualidade_alertas + "). Escreva a análise normalmente, mas de " +
        "forma um pouco mais cautelosa e menos categórica."
      : "");

  var esquema = {
    type: "object",
    properties: {
      quem_e: { type: "string", description: "Síntese de quem é a pessoa, integrando linguagem de valorização, temperamento, eneagrama e DISC" },
      pontos_fortes: { type: "string", description: "Principais pontos fortes no ambiente de trabalho" },
      pontos_desenvolver: { type: "string", description: "Pontos de atenção e desenvolvimento, com tom construtivo" },
      como_comunicar: { type: "string", description: "Orientação a quem lidera: como se comunicar com esta pessoa" },
      como_motivar: { type: "string", description: "Orientação a quem lidera: como motivar e reconhecer esta pessoa" },
      evitar_atrito: { type: "string", description: "Orientação a quem lidera: o que evitar para não gerar atrito" }
    },
    required: ["quem_e", "pontos_fortes", "pontos_desenvolver", "como_comunicar", "como_motivar", "evitar_atrito"],
    additionalProperties: false
  };

  var corpo = {
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: "Você é um especialista em comportamento humano e desenvolvimento de pessoas, " +
      "com domínio das cinco linguagens de valorização, dos quatro temperamentos, do eneagrama e do DISC.",
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
  // Teto diário de e-mails: protege a cota do Google e impede que a conta da
  // organização seja usada para disparar mensagens em massa. Se o teto for
  // atingido, as respostas continuam sendo gravadas — só o e-mail não sai.
  var limiteEmails = Number(propriedade("LIMITE_EMAILS_DIA", LIMITE_EMAILS_DIA_PADRAO));
  if (!dentroDoLimiteDiario("emails", limiteEmails)) {
    console.error("Teto diário de e-mails atingido (" + limiteEmails + "). Resposta gravada sem envio.");
    return;
  }

  var corpoHtml = montarEmailHtml(dados, analise);
  var assunto = "Perfil Comportamental — " + dados.nome;

  // Para a própria pessoa
  if (dados.email) {
    try {
      MailApp.sendEmail({
        to: dados.email,
        subject: "Seu " + assunto,
        htmlBody: corpoHtml
      });
    } catch (erro) {
      console.error("Falha ao enviar e-mail à pessoa: " + erro);
    }
  }

  // Para quem lidera (o informado no formulário, ou o padrão das propriedades do script)
  var lider = dados.email_gestor ||
    PropertiesService.getScriptProperties().getProperty("EMAIL_GESTOR");
  if (lider && lider !== dados.email) {
    try {
      MailApp.sendEmail({
        to: lider,
        subject: assunto + " (" + dados.setor + ")",
        htmlBody: corpoHtml
      });
    } catch (erro) {
      console.error("Falha ao enviar e-mail a quem lidera: " + erro);
    }
  }
}

function montarEmailHtml(dados, analise) {
  var a = analise || {};
  var esc = escaparHtml;

  // Nada que venha do formulário entra na mensagem como marcação: o e-mail sai
  // da conta da organização e carrega a credibilidade dela.
  var cor = corValida(dados.cor);
  var ctx = obterContexto(dados);
  var organizacao = esc(dados.organizacao || dados.escola || "");
  var urlLogo = urlLogoValida(dados.logo_url);
  var logo = urlLogo
    ? '<img src="' + esc(urlLogo) + '" alt="Logo" style="max-height:48px;max-width:180px;margin-bottom:8px">'
    : "";

  var secao = function (titulo, texto) {
    if (!texto) return "";
    return '<h3 style="color:' + cor + ';font-size:15px;margin:18px 0 4px">' + esc(titulo) + "</h3>" +
      '<p style="font-size:13px;line-height:1.6;margin:0">' + esc(texto) + "</p>";
  };

  var linha = function (rotulo, valor) {
    if (!valor) return "";
    return "<strong>" + esc(rotulo) + ":</strong> " + esc(valor) + "<br>";
  };

  // Monta "valor principal (complemento)" só quando o valor principal existe.
  // Sem esta guarda, um campo ausente virava a string "undefined" no e-mail,
  // porque undefined + "" resulta em "undefined", que é um texto verdadeiro.
  var composto = function (base, complemento) {
    if (!base) return "";
    return base + (complemento || "");
  };

  var alerta = (dados.qualidade_status && dados.qualidade_status !== "OK")
    ? '<p style="background:#fff8e1;border-left:4px solid #f9a825;padding:10px;font-size:12px;' +
      'color:#7a5c00;margin:0 0 14px">O preenchimento levantou alertas de qualidade (' +
      escaparHtml(dados.qualidade_alertas) + '). Leia o resultado com essa ressalva.</p>'
    : "";

  return '<div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:640px;margin:0 auto;color:#222">' +
    '<div style="background:' + cor + ';color:#fff;padding:18px;text-align:center;border-radius:8px 8px 0 0">' +
    logo +
    "<h2 style='margin:0;font-size:20px'>Perfil Comportamental</h2>" +
    "<p style='margin:4px 0 0;font-size:12px;opacity:.85'>" + organizacao + "</p></div>" +
    '<div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">' +
    alerta +
    '<p style="font-size:13px">' +
    linha("Nome", dados.nome) +
    linha(ctx.termoGrupo, dados.setor) +
    linha("Linguagem de Valorização", composto(dados.linguagem,
      dados.linguagem_secundaria ? " (secundária: " + dados.linguagem_secundaria + ")" : "")) +
    linha("Temperamento", composto(dados.temperamento,
      dados.temperamento_secundario ? " (secundário: " + dados.temperamento_secundario + ")" : "")) +
    linha("Eneagrama", composto(dados.eneagrama,
      (dados.eneagrama_segundo ? " (2º lugar: " + dados.eneagrama_segundo + ")" : "") +
      (dados.eneagrama_centro ? " — centro " + dados.eneagrama_centro : ""))) +
    linha("DISC", composto(dados.disc,
      (dados.disc_dominante ? " — dominante " + dados.disc_dominante : "") +
      (dados.disc_secundario ? ", secundário " + dados.disc_secundario : ""))) +
    "</p>" +
    secao("Quem é você", a.quem_e) +
    secao("Pontos Fortes", a.pontos_fortes) +
    secao("Pontos a Desenvolver", a.pontos_desenvolver) +
    secao("Como Comunicar", a.como_comunicar) +
    secao("Como Motivar", a.como_motivar) +
    secao("Evitar Atrito", a.evitar_atrito) +
    '<p style="font-size:10px;color:#888;margin-top:24px;border-top:1px solid #ddd;padding-top:10px;line-height:1.6">' +
    "Instrumento de autoconhecimento e desenvolvimento (" + esc(dados.versao_instrumento || "v2.0") + "). " +
    "Não é ferramenta de seleção, não constitui diagnóstico clínico e não substitui avaliação profissional." +
    "</p>" +
    "</div></div>";
}

// ===== UTILITÁRIOS =====

function respostaJson(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
