/**
 * ============================================================
 *  PERFIL EXPRESSO v3.0
 * ============================================================
 *
 * Versão curta e permanente do teste: 21 decisões (22 ou 23 com desempate),
 * cerca de 4 minutos. Substitui o questionário completo v2.1, que foi
 * arquivado em arquivo/teste-completo-v2.1.html.
 *
 *   1. Linguagens de Valorização:  10 pares (+1 desempate, se houver empate)
 *   2. DISC:                       8 blocos MAIS/MENOS
 *   3. Temperamento:               derivado do DISC, sem pergunta própria
 *   4. Eneagrama:                  triagem em 3 perguntas (+1 desempate)
 *
 * DE ONDE VÊM OS ITENS
 * Linguagens e DISC reaproveitam os itens de instrumento.js (v2.1), que são de
 * autoria própria e já testados: a primeira rodada dos pares de linguagem e
 * os 8 primeiros blocos de DISC. Nada é copiado: os textos são lidos de lá,
 * para que uma correção num item valha para as duas versões.
 *
 * POR QUE O TEMPERAMENTO NÃO TEM PERGUNTA
 * Temperamento e DISC medem os mesmos dois eixos (ritmo e foco em tarefa ou
 * pessoas). Perguntar os dois seria medir a mesma coisa duas vezes. A
 * correspondência usada é Colérico = D, Sanguíneo = I, Fleumático = S e
 * Melancólico = C.
 *
 * POR QUE O ENEAGRAMA É "TRIAGEM"
 * Três perguntas não definem um tipo entre nove. O resultado sai com o nível
 * de confiança: "alta" quando as duas vias (estilo e motivação) concordam,
 * "média" quando divergem e o tipo sai do desempate pelo que mais incomoda.
 * Nas rodadas de teste, a via de motivação puxava para respostas mais
 * "bonitas" (o Tipo 1, por exemplo); o desempate pelo incômodo corrigiu isso.
 *
 * AVISO DE USO: instrumento de autoconhecimento e desenvolvimento. Não é
 * ferramenta de seleção, não é diagnóstico clínico e não foi validado
 * cientificamente. Mostra tendências, não define quem a pessoa é.
 */

var EXPRESSO = (function () {
  "use strict";

  var BASE = (typeof INSTRUMENTO !== "undefined" && INSTRUMENTO) ||
    (typeof require === "function" ? require("./instrumento.js") : null);
  if (!BASE) throw new Error("expresso.js precisa de instrumento.js carregado antes.");

  var VERSAO = "v3.0";

  var LINGUAGENS = BASE.LINGUAGENS;
  var FATORES_DISC = BASE.FATORES_DISC;
  var TEMPERAMENTOS = BASE.TEMPERAMENTOS;
  var TIPOS_ENEAGRAMA = BASE.TIPOS_ENEAGRAMA;

  // ============================================================
  // MÓDULO 1: LINGUAGENS DE VALORIZAÇÃO
  // ============================================================
  //
  // Os itens 1 a 10 da v2.1 cobrem cada par de linguagens exatamente uma vez.
  // Na v2.1 a primeira letra do par ficava sempre à esquerda; aqui os itens
  // pares têm os lados invertidos, para que cada linguagem apareça duas vezes
  // à esquerda e duas à direita.
  var PARES = BASE.ITENS_LINGUAGEM.slice(0, 10).map(function (item) {
    var inverter = item.id % 2 === 0;
    return {
      id: item.id,
      a: inverter ? item.b : item.a,
      b: inverter ? item.a : item.b
    };
  });

  // Usado só na tela de desempate, quando as linguagens empatam no topo.
  var DESCRICAO_LINGUAGEM = {
    A: "Ouvir reconhecimento: elogio, agradecimento, incentivo.",
    B: "Ter atenção dedicada: conversa sem pressa, ser ouvido.",
    C: "Receber gestos concretos: lembranças, mimos, presentes.",
    D: "Receber ajuda prática: alguém que resolve e alivia a carga.",
    E: "Sentir acolhimento: calor humano, cordialidade, proximidade."
  };

  // respostas: [{ item: 1, letra: "A" }, ...]
  // Conta vitórias; entre empatadas, vence quem ganhou o confronto direto
  // (cada par se enfrentou uma vez). Devolve as que continuam empatadas.
  function contarLinguagem(respostas) {
    var contagem = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    var venceu = {};
    (respostas || []).forEach(function (r) {
      var par = PARES.filter(function (p) { return p.id === r.item; })[0];
      if (!par || contagem[r.letra] === undefined) return;
      var perdedora = par.a.letra === r.letra ? par.b.letra : par.a.letra;
      contagem[r.letra] += 1;
      venceu[r.letra + ">" + perdedora] = true;
    });

    var maior = Math.max.apply(null, Object.keys(contagem).map(function (l) { return contagem[l]; }));
    var topo = Object.keys(contagem).filter(function (l) { return contagem[l] === maior; });
    if (topo.length === 2) {
      if (venceu[topo[0] + ">" + topo[1]]) topo = [topo[0]];
      else if (venceu[topo[1] + ">" + topo[0]]) topo = [topo[1]];
    }
    return { contagem: contagem, topo: topo };
  }

  // Linguagens que precisam da tela de desempate (vazio = não precisa).
  function linguagensEmpatadas(respostas) {
    if ((respostas || []).length < PARES.length) return [];
    var c = contarLinguagem(respostas);
    return c.topo.length > 1 ? c.topo : [];
  }

  function pontuarLinguagem(respostas, desempate) {
    var c = contarLinguagem(respostas);
    var principal = c.topo;
    var viaDesempate = false;
    if (principal.length > 1 && desempate && principal.indexOf(desempate) !== -1) {
      principal = [desempate];
      viaDesempate = true;
    }

    var ordem = Object.keys(c.contagem).sort(function (x, y) { return c.contagem[y] - c.contagem[x]; });
    var resto = ordem.filter(function (l) { return principal.indexOf(l) === -1; });
    var equilibrado = principal.length > 2;

    var principalNome;
    if (principal.length === 1) principalNome = LINGUAGENS[principal[0]];
    else if (principal.length === 2) principalNome = LINGUAGENS[principal[0]] + " e " + LINGUAGENS[principal[1]];
    else principalNome = "Perfil equilibrado, sem linguagem dominante";

    // A secundária só é informada quando se destaca das demais; se as
    // restantes empataram, apontar uma delas seria sorteio pela ordem.
    var destacada = resto.length === 1 || (resto.length > 1 && c.contagem[resto[0]] > c.contagem[resto[1]]);
    var secundaria = (!equilibrado && principal.length === 1 && destacada) ? resto[0] : null;

    return {
      contagem: c.contagem,
      principal: principal,
      principalNome: principalNome,
      secundaria: secundaria,
      secundariaNome: secundaria ? LINGUAGENS[secundaria] : "",
      viaDesempate: viaDesempate,
      empate: principal.length > 1,
      equilibrado: equilibrado,
      maximo: 4
    };
  }

  // ============================================================
  // MÓDULO 2: DISC (e o temperamento derivado dele)
  // ============================================================
  //
  // Os 8 primeiros blocos da v2.1. Como cada bloco tem uma palavra de cada
  // fator, qualquer subconjunto continua balanceado: 8 oportunidades por
  // fator, score de -8 a +8.
  var BLOCOS_DISC = BASE.BLOCOS_DISC.slice(0, 8);

  var TEMPERAMENTO_DO_DISC = { D: "colerico", I: "sanguineo", S: "fleumatico", C: "melancol" };

  // Separador usado pela v2.1 entre as letras e o nome da combinação.
  var SEPARADOR_V2 = " \u2014 ";

  // respostas: [{ bloco: 1, mais: "D", menos: "S" }, ...]
  function pontuarDisc(respostas) {
    var mais = { D: 0, I: 0, S: 0, C: 0 };
    var menos = { D: 0, I: 0, S: 0, C: 0 };
    (respostas || []).forEach(function (r) {
      if (mais[r.mais] !== undefined) mais[r.mais] += 1;
      if (menos[r.menos] !== undefined) menos[r.menos] += 1;
    });

    var score = {};
    Object.keys(mais).forEach(function (f) { score[f] = mais[f] - menos[f]; });

    // Ordem: maior score; no empate, quem foi mais vezes MAIS.
    var ordem = Object.keys(score).sort(function (x, y) {
      return (score[y] - score[x]) || (mais[y] - mais[x]);
    });
    var dom = ordem[0], sec = ordem[1], terc = ordem[2];
    var igual = function (x, y) { return score[x] === score[y] && mais[x] === mais[y]; };

    var equilibrado = ordem.every(function (f) { return score[f] === score[dom]; });
    var empateTopo = !equilibrado && igual(dom, sec);
    // O secundário só é informado quando se distingue do terceiro colocado;
    // do contrário, seria ruído apresentado como traço.
    var secundarioClaro = !equilibrado && !empateTopo && !igual(sec, terc);

    // O nome da combinação segue o formato gravado pela v2.1 ("CS" + separador
    // + nome), para que o mesmo perfil caia na mesma barra do dashboard nas
    // duas versões.
    var combinacao = secundarioClaro ? (BASE.COMBINACOES_DISC[dom + sec] || "") : "";
    var perfil;
    if (equilibrado) perfil = "Perfil equilibrado, sem fator dominante";
    else if (empateTopo) perfil = dom + " e " + sec;
    else if (!secundarioClaro) perfil = dom;
    else perfil = dom + sec + (combinacao ? SEPARADOR_V2 + combinacao : "");

    return {
      mais: mais,
      menos: menos,
      score: score,
      minimo: -BLOCOS_DISC.length,
      maximo: BLOCOS_DISC.length,
      ordem: ordem,
      dominante: equilibrado ? null : dom,
      dominanteNome: equilibrado ? "" : FATORES_DISC[dom],
      secundario: secundarioClaro ? sec : null,
      secundarioNome: secundarioClaro ? FATORES_DISC[sec] : "",
      combinacao: combinacao,
      perfil: perfil,
      empateTopo: empateTopo,
      equilibrado: equilibrado
    };
  }

  function derivarTemperamento(disc) {
    if (!disc || disc.equilibrado) {
      return { principal: null, principalNome: "Perfil equilibrado, sem temperamento dominante", secundario: null, secundarioNome: "", derivado: true };
    }
    if (disc.empateTopo) {
      var dois = [disc.ordem[0], disc.ordem[1]].map(function (f) { return TEMPERAMENTOS[TEMPERAMENTO_DO_DISC[f]]; });
      return { principal: null, principalNome: dois[0] + " e " + dois[1], secundario: null, secundarioNome: "", derivado: true };
    }
    var p = TEMPERAMENTO_DO_DISC[disc.dominante];
    var s = disc.secundario ? TEMPERAMENTO_DO_DISC[disc.secundario] : null;
    return {
      principal: p,
      principalNome: TEMPERAMENTOS[p],
      secundario: s,
      secundarioNome: s ? TEMPERAMENTOS[s] : "",
      derivado: true
    };
  }

  // ============================================================
  // MÓDULO 3: ENEAGRAMA (triagem)
  // ============================================================
  //
  // Duas vias independentes:
  //   estilo    = cruzamento de "jeito no convívio" × "reação a problema"
  //   motivação = escolha direta entre 9 frases
  // Se divergirem, uma 4ª pergunta compara os dois candidatos pelo que mais
  // incomoda cada tipo. Textos de autoria própria.
  var PERGUNTAS_ENEAGRAMA = [
    { id: "convivio", pergunta: "No convívio com outras pessoas, meu jeito natural é...",
      nota: "Pense em como você é fora do papel profissional: com amigos, família, no dia a dia. Nenhuma vai servir perfeitamente.",
      opcoes: [
        { k: "assertivo",   titulo: "Tomar a frente", texto: "Defino o rumo, puxo a ação e ocupo o espaço. Prefiro agir a esperar." },
        { k: "conciliador", titulo: "Fazer a minha parte bem feita", texto: "Procuro saber o que esperam de mim, cumpro o combinado e sigo o que foi acordado." },
        { k: "retraido",    titulo: "Observar antes de me envolver", texto: "Preciso do meu tempo e do meu espaço. Contribuo melhor depois de ter pensado ou sentido com calma." }
      ] },
    { id: "reacao", pergunta: "Diante de um problema sério, minha primeira reação é...",
      nota: "Pense em como você é fora do papel profissional: com amigos, família, no dia a dia. Nenhuma vai servir perfeitamente.",
      opcoes: [
        { k: "positivo",    titulo: "Manter o otimismo", texto: "Procuro o lado bom, evito remoer e tento deixar o clima mais leve." },
        { k: "competencia", titulo: "Analisar com a cabeça fria", texto: "Primeiro entendo o que aconteceu; o sentimento fica para depois. Busco a solução mais lógica." },
        { k: "reativo",     titulo: "Sentir forte e precisar falar", texto: "A emoção vem com intensidade e preciso que ela seja reconhecida antes de seguir adiante." }
      ] },
    { id: "motivacao", pergunta: "Qual destas frases descreve melhor o que mais move você?",
      nota: "Pense no que você busca por dentro, não no que o seu cargo exige.",
      opcoes: [
        { k: "1", titulo: "Fazer do jeito certo", texto: "Corrigir o que está errado e fazer as coisas como devem ser feitas." },
        { k: "2", titulo: "Ser importante para as pessoas", texto: "Ser útil, cuidar e fazer diferença na vida de quem está perto." },
        { k: "3", titulo: "Realizar e ser reconhecido", texto: "Alcançar resultados e ser visto pelo que conquisto." },
        { k: "4", titulo: "Ser autêntico", texto: "Ser fiel ao que sinto e encontrar o que me torna único." },
        { k: "5", titulo: "Entender a fundo", texto: "Compreender como as coisas funcionam antes de agir e ter domínio do assunto." },
        { k: "6", titulo: "Ter segurança", texto: "Poder confiar nas pessoas e nos planos, e estar preparado para o que pode dar errado." },
        { k: "7", titulo: "Viver o que é bom", texto: "Ter experiências novas, liberdade e uma vida interessante." },
        { k: "8", titulo: "Ter força e autonomia", texto: "Decidir meu próprio caminho e proteger quem é meu." },
        { k: "9", titulo: "Ter paz", texto: "Manter a harmonia, evitar conflitos desnecessários e estar em equilíbrio." }
      ] }
  ];

  // O que mais incomoda cada tipo. Menos sujeito a resposta "bonita" do que
  // a pergunta de motivação, porque ninguém escolhe um incômodo para parecer bem.
  var INCOMODO = {
    1: "Errar, ser injusto ou ver algo sendo feito de forma malfeita.",
    2: "Não ser necessário ou não ser querido pelas pessoas.",
    3: "Fracassar ou ser visto como alguém sem valor.",
    4: "Ser comum, igual a todo mundo, sem identidade própria.",
    5: "Ser invadido, sobrecarregado ou pego sem saber o suficiente.",
    6: "Ficar sem apoio, sem garantias, sem saber em quem confiar.",
    7: "Ficar preso, entediado ou sem opções.",
    8: "Ser controlado, ficar vulnerável ou depender de alguém.",
    9: "Conflito, tensão e brigas ao meu redor."
  };

  // Jeito no convívio × reação a problema: cada cruzamento aponta um tipo.
  var GRADE_ENEAGRAMA = {
    assertivo:   { positivo: 7, competencia: 3, reativo: 8 },
    conciliador: { positivo: 2, competencia: 1, reativo: 6 },
    retraido:    { positivo: 9, competencia: 5, reativo: 4 }
  };

  // respostas: { convivio: "retraido", reacao: "competencia", motivacao: "5" }
  function estiloEneagrama(respostas) {
    var r = respostas || {};
    var linha = GRADE_ENEAGRAMA[r.convivio];
    return (linha && linha[r.reacao]) || null;
  }

  function motivacaoEneagrama(respostas) {
    var m = Number((respostas || {}).motivacao);
    return TIPOS_ENEAGRAMA[m] ? m : null;
  }

  // Candidatos do desempate (vazio = não precisa).
  function eneagramaDivergente(respostas) {
    var e = estiloEneagrama(respostas), m = motivacaoEneagrama(respostas);
    return (e && m && e !== m) ? [e, m] : [];
  }

  function pontuarEneagrama(respostas, desempate) {
    var estilo = estiloEneagrama(respostas);
    var motivacao = motivacaoEneagrama(respostas);
    var concordam = estilo !== null && estilo === motivacao;
    var candidatos = eneagramaDivergente(respostas);
    var escolhido = Number(desempate);

    var tipo;
    if (concordam) tipo = estilo;
    else if (candidatos.indexOf(escolhido) !== -1) tipo = escolhido;
    else tipo = estilo || motivacao;

    var outro = concordam ? null : (tipo === estilo ? motivacao : estilo);
    return {
      tipo: tipo,
      nome: tipo ? TIPOS_ENEAGRAMA[tipo].nome : "",
      centro: tipo ? TIPOS_ENEAGRAMA[tipo].centro : "",
      estilo: estilo,
      motivacao: motivacao,
      desempate: concordam ? null : (candidatos.indexOf(escolhido) !== -1 ? escolhido : null),
      alternativo: outro,
      alternativoNome: outro ? TIPOS_ENEAGRAMA[outro].nome : "",
      concordam: concordam,
      confianca: concordam ? "alta" : "média"
    };
  }

  // ============================================================
  // CONTROLE DE QUALIDADE
  // ============================================================
  // Não bloqueia ninguém: sinaliza para a pessoa, o e-mail e o dashboard.
  var TEMPO_MINIMO_SEGUNDOS = 60;

  function calcularQualidade(entrada) {
    var e = entrada || {};
    var lados = (e.linguagem || []).map(function (r) {
      var par = PARES.filter(function (p) { return p.id === r.item; })[0];
      return par ? (par.a.letra === r.letra ? "a" : "b") : null;
    }).filter(Boolean);

    var mesmoLado = lados.length === PARES.length && lados.every(function (l) { return l === lados[0]; });
    var rapidoDemais = typeof e.segundos === "number" && e.segundos > 0 && e.segundos < TEMPO_MINIMO_SEGUNDOS;

    var alertas = [];
    if (mesmoLado) alertas.push("Todas as escolhas de valorização foram do mesmo lado");
    if (rapidoDemais) alertas.push("Preenchido em menos de 1 minuto");

    return {
      mesmoLado: mesmoLado,
      rapidoDemais: rapidoDemais,
      alertas: alertas,
      status: alertas.length ? "Revisar" : "OK",
      segundos: e.segundos || 0
    };
  }

  // ============================================================
  // CÁLCULO COMPLETO
  // ============================================================
  // entrada: {
  //   linguagem: [{ item, letra }], desempateLinguagem: "A",
  //   disc: [{ bloco, mais, menos }],
  //   eneagrama: { convivio, reacao, motivacao }, desempateEneagrama: 5,
  //   segundos: 180
  // }
  function calcularPerfil(entrada) {
    var e = entrada || {};
    var disc = pontuarDisc(e.disc);
    return {
      versao: VERSAO,
      linguagem: pontuarLinguagem(e.linguagem, e.desempateLinguagem),
      disc: disc,
      temperamento: derivarTemperamento(disc),
      eneagrama: pontuarEneagrama(e.eneagrama, e.desempateEneagrama),
      qualidade: calcularQualidade({ linguagem: e.linguagem, segundos: e.segundos })
    };
  }

  // Registro compacto das respostas, item a item, para a planilha. Serve para
  // validar o instrumento depois com dados reais (a v2.1 só guardava totais).
  function respostasCompactas(entrada) {
    var e = entrada || {};
    var ling = (e.linguagem || []).slice().sort(function (x, y) { return x.item - y.item; })
      .map(function (r) { return r.letra; }).join("");
    var disc = (e.disc || []).slice().sort(function (x, y) { return x.bloco - y.bloco; })
      .map(function (r) { return (r.mais || "?") + (r.menos || "?"); }).join(" ");
    var en = e.eneagrama || {};
    return "L:" + ling + (e.desempateLinguagem ? "/" + e.desempateLinguagem : "") +
      " | D:" + disc +
      " | E:" + [en.convivio || "", en.reacao || "", en.motivacao || ""].join(",") +
      (e.desempateEneagrama ? "/" + e.desempateEneagrama : "");
  }

  return {
    VERSAO: VERSAO,
    LINGUAGENS: LINGUAGENS,
    FATORES_DISC: FATORES_DISC,
    TEMPERAMENTOS: TEMPERAMENTOS,
    TIPOS_ENEAGRAMA: TIPOS_ENEAGRAMA,
    PARES: PARES,
    DESCRICAO_LINGUAGEM: DESCRICAO_LINGUAGEM,
    BLOCOS_DISC: BLOCOS_DISC,
    TEMPERAMENTO_DO_DISC: TEMPERAMENTO_DO_DISC,
    PERGUNTAS_ENEAGRAMA: PERGUNTAS_ENEAGRAMA,
    INCOMODO: INCOMODO,
    GRADE_ENEAGRAMA: GRADE_ENEAGRAMA,
    TEMPO_MINIMO_SEGUNDOS: TEMPO_MINIMO_SEGUNDOS,
    linguagensEmpatadas: linguagensEmpatadas,
    pontuarLinguagem: pontuarLinguagem,
    pontuarDisc: pontuarDisc,
    derivarTemperamento: derivarTemperamento,
    estiloEneagrama: estiloEneagrama,
    eneagramaDivergente: eneagramaDivergente,
    pontuarEneagrama: pontuarEneagrama,
    calcularQualidade: calcularQualidade,
    calcularPerfil: calcularPerfil,
    respostasCompactas: respostasCompactas
  };
})();

// Disponível tanto no navegador (via <script src>) quanto no Node (testes).
if (typeof window !== "undefined") { window.EXPRESSO = EXPRESSO; }
if (typeof module !== "undefined" && module.exports) { module.exports = EXPRESSO; }
