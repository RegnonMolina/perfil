/**
 * ============================================================
 *  INSTRUMENTO DE PERFIL COMPORTAMENTAL — v2.0
 * ============================================================
 *
 * Banco de itens e cálculo dos quatro módulos:
 *   1. Linguagens de Valorização (5 fatores)  — 20 pares de escolha forçada
 *   2. Temperamento (4 fatores)               — 16 afirmações, escala 1 a 5
 *   3. Eneagrama (9 tipos)                    — 27 afirmações, escala 1 a 5
 *   4. DISC (4 fatores)                       — 12 blocos "mais/menos como eu"
 *
 * Total: 75 itens pontuados + 1 item de atenção (não pontuado).
 *
 * POR QUE ESTE ARQUIVO É SEPARADO DO index.html
 * Todo o cálculo aqui é feito por funções puras (mesma entrada, mesma saída,
 * sem tocar na tela). Isso permite que os testes automatizados em
 * tests/instrumento.test.js provem as propriedades do desenho — equilíbrio
 * entre fatores, ausência de item degenerado, contradomínio completo — em vez
 * de a gente apenas afirmar que estão corretas.
 *
 * Os itens são neutros quanto ao tipo de organização (servem para escola,
 * empresa ou grupo de networking) de propósito: mudar o texto dos itens por
 * cliente tornaria os resultados incomparáveis entre si. O vocabulário
 * específico de cada organização entra depois, na análise, via config.js.
 *
 * AVISO DE USO: instrumento de autoconhecimento e desenvolvimento. Não é
 * ferramenta de seleção, não é diagnóstico clínico e não substitui avaliação
 * profissional. Banco de itens de autoria própria — não reproduz itens de
 * nenhum instrumento comercial registrado.
 */

var INSTRUMENTO = (function () {
  "use strict";

  var VERSAO = "v2.0";

  // ============================================================
  // MÓDULO 1 — LINGUAGENS DE VALORIZAÇÃO
  // ============================================================
  //
  // Desenho de blocos balanceados: com 5 linguagens existem exatamente
  // 10 pares possíveis (A-B, A-C, A-D, A-E, B-C, B-D, B-E, C-D, C-E, D-E).
  // Cada par aparece 2 vezes, com conteúdos diferentes, totalizando 20 itens.
  //
  // Consequência: cada linguagem disputa contra cada uma das outras
  // exatamente 2 vezes e aparece em 8 itens. Teto igual para todas (8 pontos).
  // Na segunda aparição de cada par os lados são invertidos, para neutralizar
  // a tendência de escolher sempre a primeira opção.

  var LINGUAGENS = {
    A: "Palavras de afirmação",
    B: "Tempo de qualidade",
    C: "Presentes / Mimos",
    D: "Atos de serviço",
    E: "Presença / Acolhimento"
  };

  var ITENS_LINGUAGEM = [
    // --- Réplica 1: primeira letra do par à esquerda ---
    { id: 1,  a: { letra: "A", texto: "Um elogio sincero pelo meu trabalho me dá energia para a semana." },
              b: { letra: "B", texto: "Uma conversa sem pressa, só para saber como estou, me dá energia para a semana." } },
    { id: 2,  a: { letra: "A", texto: "Prefiro ouvir alguém dizer que fiz um ótimo trabalho." },
              b: { letra: "C", texto: "Prefiro receber uma lembrança que mostre que pensaram em mim." } },
    { id: 3,  a: { letra: "A", texto: "Sinto-me reconhecido quando dizem na frente dos outros que confiam no meu trabalho." },
              b: { letra: "D", texto: "Sinto-me reconhecido quando alguém assume parte da minha carga sem eu precisar pedir." } },
    { id: 4,  a: { letra: "A", texto: "Um feedback positivo por escrito fica marcado comigo." },
              b: { letra: "E", texto: "Um cumprimento caloroso na chegada fica marcado comigo." } },
    { id: 5,  a: { letra: "B", texto: "Ser chamado para pensar junto em uma decisão me valoriza." },
              b: { letra: "C", texto: "Receber um mimo inesperado me valoriza." } },
    { id: 6,  a: { letra: "B", texto: "Quero que reservem tempo para entender meus desafios." },
              b: { letra: "D", texto: "Quero que resolvam, na prática, o que está travando meu trabalho." } },
    { id: 7,  a: { letra: "B", texto: "Uma conversa longa e sem interrupção vale muito para mim." },
              b: { letra: "E", texto: "Um ambiente acolhedor no dia a dia vale muito para mim." } },
    { id: 8,  a: { letra: "C", texto: "Um presente escolhido com cuidado mostra que se importam comigo." },
              b: { letra: "D", texto: "Uma ajuda concreta na hora do aperto mostra que se importam comigo." } },
    { id: 9,  a: { letra: "C", texto: "Lembrarem do meu aniversário com um presente me toca." },
              b: { letra: "E", texto: "Ser recebido com entusiasmo todos os dias me toca." } },
    { id: 10, a: { letra: "D", texto: "Prefiro que me ajudem a tirar uma tarefa difícil da frente." },
              b: { letra: "E", texto: "Prefiro que me tratem com cordialidade e calor humano." } },

    // --- Réplica 2: mesmos pares, conteúdo novo, lados invertidos ---
    { id: 11, a: { letra: "B", texto: "Ter atenção total de alguém enquanto explico algo é o que mais me valoriza." },
              b: { letra: "A", texto: "Ouvir um obrigado por tudo o que faço é o que mais me valoriza." } },
    { id: 12, a: { letra: "C", texto: "Um item personalizado, pensado para mim, me faz sentir parte do grupo." },
              b: { letra: "A", texto: "Um reconhecimento dito em voz alta me faz sentir parte do grupo." } },
    { id: 13, a: { letra: "D", texto: "Quando alguém me ajuda com a burocracia, sinto que sou valorizado." },
              b: { letra: "A", texto: "Quando alguém elogia minha competência, sinto que sou valorizado." } },
    { id: 14, a: { letra: "E", texto: "Um aperto de mão firme ou um abraço me passa segurança." },
              b: { letra: "A", texto: "Uma palavra de incentivo me passa segurança." } },
    { id: 15, a: { letra: "C", texto: "Ganhar algo útil para o meu dia a dia me anima." },
              b: { letra: "B", texto: "Ser ouvido sem ser julgado me anima." } },
    { id: 16, a: { letra: "D", texto: "Gosto quando organizam as coisas para facilitar o meu trabalho." },
              b: { letra: "B", texto: "Gosto quando param o que estão fazendo para me dar atenção." } },
    { id: 17, a: { letra: "E", texto: "Sinto-me integrado quando as pessoas são calorosas comigo." },
              b: { letra: "B", texto: "Sinto-me integrado quando sou consultado antes das decisões." } },
    { id: 18, a: { letra: "D", texto: "Alguém me trazer um café num dia corrido vale mais do que qualquer discurso." },
              b: { letra: "C", texto: "Um bilhete com um doce na minha mesa vale mais do que qualquer discurso." } },
    { id: 19, a: { letra: "E", texto: "Um sorriso e um bom dia de verdade fazem o meu dia." },
              b: { letra: "C", texto: "Uma pequena lembrança deixada na minha mesa faz o meu dia." } },
    { id: 20, a: { letra: "E", texto: "Prefiro proximidade e cordialidade no trato." },
              b: { letra: "D", texto: "Prefiro apoio prático e objetivo." } }
  ];

  // ============================================================
  // MÓDULO 2 — TEMPERAMENTO
  // ============================================================
  //
  // 16 afirmações em escala 1 a 5, 4 por temperamento (as 12 originais da v1
  // foram preservadas na íntegra; 4 novas completam o equilíbrio).
  // A pontuação é reportada em percentual do total respondido, o que neutraliza
  // o viés de quem marca notas altas em tudo.

  var TEMPERAMENTOS = {
    colerico: "Colérico",
    sanguineo: "Sanguíneo",
    melancol: "Melancólico",
    fleumatico: "Fleumático"
  };

  var ITENS_TEMPERAMENTO = [
    { id: 1,  fator: "colerico",   texto: "Quando surge um problema, minha reação mais natural é assumir o controle." },
    { id: 2,  fator: "sanguineo",  texto: "Eu costumo ser comunicativo e me envolver com facilidade com as pessoas." },
    { id: 3,  fator: "melancol",   texto: "Sou detalhista e percebo coisas que muita gente deixa passar." },
    { id: 4,  fator: "fleumatico", texto: "Normalmente ajo com calma, mesmo quando os outros estão tensos." },
    { id: 5,  fator: "colerico",   texto: "Gosto de decidir rápido e partir para a ação." },
    { id: 6,  fator: "sanguineo",  texto: "Tenho facilidade para animar o ambiente e deixar tudo mais leve." },
    { id: 7,  fator: "melancol",   texto: "Costumo pensar bastante antes de confiar que algo está realmente certo." },
    { id: 8,  fator: "fleumatico", texto: "Evito conflitos desnecessários e prefiro manter a harmonia." },
    { id: 9,  fator: "colerico",   texto: "Fico incomodado quando vejo lentidão, enrolação ou falta de resultado." },
    { id: 10, fator: "sanguineo",  texto: "Sou naturalmente expressivo e costumo demonstrar o que sinto." },
    { id: 11, fator: "melancol",   texto: "Tenho tendência a ser exigente comigo mesmo e com a qualidade das coisas." },
    { id: 12, fator: "fleumatico", texto: "As pessoas costumam me ver como alguém estável e tranquilo." },
    { id: 13, fator: "colerico",   texto: "Costumo dizer o que penso de forma direta, mesmo que soe duro." },
    { id: 14, fator: "sanguineo",  texto: "Perco o interesse quando a tarefa vira pura rotina e repetição." },
    { id: 15, fator: "melancol",   texto: "Prefiro analisar com calma a arriscar uma decisão precipitada." },
    { id: 16, fator: "fleumatico", texto: "Tenho paciência para ouvir e mediar quando há desentendimento." }
  ];

  // ============================================================
  // MÓDULO 3 — ENEAGRAMA
  // ============================================================
  //
  // 27 afirmações em escala 1 a 5, 3 por tipo, cobrindo os nove tipos.
  // Substitui o bloco da v1, que só conseguia devolver Tipo 1 ou Tipo 2.
  // Além do tipo principal, são calculados a asa (tipo vizinho mais pontuado)
  // e o centro de inteligência.

  var TIPOS_ENEAGRAMA = {
    1: { nome: "Tipo 1 — Perfeccionista", centro: "Instintivo" },
    2: { nome: "Tipo 2 — Prestativo",     centro: "Emocional" },
    3: { nome: "Tipo 3 — Realizador",     centro: "Emocional" },
    4: { nome: "Tipo 4 — Individualista", centro: "Emocional" },
    5: { nome: "Tipo 5 — Investigador",   centro: "Mental" },
    6: { nome: "Tipo 6 — Leal",           centro: "Mental" },
    7: { nome: "Tipo 7 — Entusiasta",     centro: "Mental" },
    8: { nome: "Tipo 8 — Desafiador",     centro: "Instintivo" },
    9: { nome: "Tipo 9 — Pacificador",    centro: "Instintivo" }
  };

  var ITENS_ENEAGRAMA = [
    { id: 1,  tipo: 1, texto: "Percebo rapidamente o que está errado e sinto necessidade de corrigir." },
    { id: 2,  tipo: 2, texto: "Percebo o que as pessoas precisam antes de elas pedirem." },
    { id: 3,  tipo: 3, texto: "Meço bastante o meu valor pelo que consigo realizar." },
    { id: 4,  tipo: 4, texto: "Sinto que sou diferente das outras pessoas de um jeito difícil de explicar." },
    { id: 5,  tipo: 5, texto: "Preciso de tempo sozinho para recarregar depois de muita convivência." },
    { id: 6,  tipo: 6, texto: "Antecipo o que pode dar errado antes mesmo de começar." },
    { id: 7,  tipo: 7, texto: "Fico entusiasmado com ideias novas e costumo ter várias em andamento." },
    { id: 8,  tipo: 8, texto: "Assumo a frente quando percebo que ninguém está conduzindo." },
    { id: 9,  tipo: 9, texto: "Costumo enxergar o ponto de vista de todos os lados." },
    { id: 10, tipo: 1, texto: "Tenho um padrão interno de certo e errado que procuro seguir sempre." },
    { id: 11, tipo: 2, texto: "Tenho dificuldade de dizer não quando alguém precisa de mim." },
    { id: 12, tipo: 3, texto: "Adapto a forma como me apresento para causar boa impressão." },
    { id: 13, tipo: 4, texto: "Minhas emoções são intensas e influenciam bastante o meu dia." },
    { id: 14, tipo: 5, texto: "Prefiro observar e entender bem antes de me envolver." },
    { id: 15, tipo: 6, texto: "Confio nas pessoas aos poucos, depois de vê-las na prática." },
    { id: 16, tipo: 7, texto: "Evito situações que me deixem preso ou sem alternativas." },
    { id: 17, tipo: 8, texto: "Não tenho medo de confronto quando considero necessário." },
    { id: 18, tipo: 9, texto: "Adio decisões difíceis na esperança de que se resolvam sozinhas." },
    { id: 19, tipo: 1, texto: "Fico incomodado quando as regras combinadas não são respeitadas." },
    { id: 20, tipo: 2, texto: "Sinto-me bem sendo a pessoa com quem os outros podem contar." },
    { id: 21, tipo: 3, texto: "Tenho dificuldade de parar enquanto ainda há uma meta em aberto." },
    { id: 22, tipo: 4, texto: "Valorizo mais o que é autêntico do que o que é padronizado." },
    { id: 23, tipo: 5, texto: "Guardo minhas opiniões até ter certeza de que domino o assunto." },
    { id: 24, tipo: 6, texto: "Sinto-me mais seguro quando há regras claras e um plano definido." },
    { id: 25, tipo: 7, texto: "Prefiro olhar para o lado bom a ficar remoendo um problema." },
    { id: 26, tipo: 8, texto: "Protejo quem está do meu lado, mesmo que isso me custe caro." },
    { id: 27, tipo: 9, texto: "Abro mão da minha vontade para manter a paz." }
  ];

  // Item de atenção — não entra em nenhuma pontuação. Serve apenas para
  // identificar quem respondeu no automático (ver calcularQualidade).
  var ITEM_ATENCAO = {
    id: 99,
    texto: "Para confirmar que você está lendo com atenção, marque a nota 1 nesta afirmação.",
    valorEsperado: 1
  };

  // ============================================================
  // MÓDULO 4 — DISC
  // ============================================================
  //
  // 12 blocos de 4 palavras, uma de cada fator. Em cada bloco a pessoa marca
  // a que MAIS e a que MENOS tem a ver com ela.
  // Pontuação: (vezes escolhida como MAIS) menos (vezes escolhida como MENOS).
  // Como cada fator aparece uma vez em cada bloco, o equilíbrio é garantido
  // pela própria construção: 12 oportunidades para cada um, faixa de -12 a +12.
  // A ordem das palavras varia entre os blocos para não induzir a escolha.

  var FATORES_DISC = {
    D: "Dominância",
    I: "Influência",
    S: "Estabilidade",
    C: "Conformidade"
  };

  var BLOCOS_DISC = [
    { id: 1,  opcoes: [ { fator: "D", palavra: "Decidido" },     { fator: "I", palavra: "Animado" },       { fator: "S", palavra: "Paciente" },     { fator: "C", palavra: "Preciso" } ] },
    { id: 2,  opcoes: [ { fator: "S", palavra: "Constante" },    { fator: "C", palavra: "Cauteloso" },     { fator: "D", palavra: "Direto" },       { fator: "I", palavra: "Sociável" } ] },
    { id: 3,  opcoes: [ { fator: "I", palavra: "Persuasivo" },   { fator: "D", palavra: "Competitivo" },   { fator: "C", palavra: "Detalhista" },   { fator: "S", palavra: "Leal" } ] },
    { id: 4,  opcoes: [ { fator: "C", palavra: "Organizado" },   { fator: "S", palavra: "Calmo" },         { fator: "I", palavra: "Otimista" },     { fator: "D", palavra: "Ousado" } ] },
    { id: 5,  opcoes: [ { fator: "D", palavra: "Exigente" },     { fator: "C", palavra: "Analítico" },     { fator: "S", palavra: "Acolhedor" },    { fator: "I", palavra: "Expressivo" } ] },
    { id: 6,  opcoes: [ { fator: "I", palavra: "Comunicativo" }, { fator: "S", palavra: "Previsível" },    { fator: "D", palavra: "Determinado" },  { fator: "C", palavra: "Metódico" } ] },
    { id: 7,  opcoes: [ { fator: "S", palavra: "Ponderado" },    { fator: "D", palavra: "Assertivo" },     { fator: "C", palavra: "Criterioso" },   { fator: "I", palavra: "Espontâneo" } ] },
    { id: 8,  opcoes: [ { fator: "C", palavra: "Rigoroso" },     { fator: "I", palavra: "Divertido" },     { fator: "S", palavra: "Prestativo" },   { fator: "D", palavra: "Objetivo" } ] },
    { id: 9,  opcoes: [ { fator: "D", palavra: "Firme" },        { fator: "S", palavra: "Estável" },       { fator: "I", palavra: "Entusiasmado" }, { fator: "C", palavra: "Sistemático" } ] },
    { id: 10, opcoes: [ { fator: "I", palavra: "Convincente" },  { fator: "C", palavra: "Reservado" },     { fator: "D", palavra: "Independente" }, { fator: "S", palavra: "Cooperativo" } ] },
    { id: 11, opcoes: [ { fator: "S", palavra: "Tranquilo" },    { fator: "I", palavra: "Extrovertido" },  { fator: "C", palavra: "Cuidadoso" },    { fator: "D", palavra: "Corajoso" } ] },
    { id: 12, opcoes: [ { fator: "C", palavra: "Perfeccionista" }, { fator: "D", palavra: "Impaciente" },  { fator: "S", palavra: "Conciliador" },  { fator: "I", palavra: "Falante" } ] }
  ];

  // Nomes de combinação de autoria própria (dominante + secundário).
  var COMBINACOES_DISC = {
    DI: "Impulsionador",  DS: "Executor Firme",  DC: "Estrategista",
    ID: "Persuasor",      IS: "Conselheiro",     IC: "Articulador",
    SD: "Sustentador",    SI: "Facilitador",     SC: "Especialista",
    CD: "Auditor",        CI: "Planejador",      CS: "Guardião"
  };

  // ============================================================
  // FUNÇÕES AUXILIARES DE PONTUAÇÃO
  // ============================================================

  // Ordena as chaves da maior pontuação para a menor.
  function ordenarPorScore(mapa) {
    return Object.keys(mapa).sort(function (x, y) { return mapa[y] - mapa[x]; });
  }

  // Devolve todas as chaves empatadas na pontuação máxima.
  function chavesNoTopo(mapa) {
    var chaves = Object.keys(mapa);
    if (!chaves.length) return [];
    var max = Math.max.apply(null, chaves.map(function (k) { return mapa[k]; }));
    return chaves.filter(function (k) { return mapa[k] === max; });
  }

  // Converte pontuações brutas em percentual do total (soma 100).
  function percentualizar(mapa) {
    var total = Object.keys(mapa).reduce(function (s, k) { return s + mapa[k]; }, 0);
    var out = {};
    Object.keys(mapa).forEach(function (k) {
      out[k] = total > 0 ? Math.round((mapa[k] / total) * 1000) / 10 : 0;
    });
    return out;
  }

  // Formata o nome do resultado levando o empate a sério.
  // Um empate entre 2 fatores ainda é informação útil ("A e B").
  // Um empate entre 3 ou mais significa que não há fator dominante — dizer
  // isso é mais honesto do que emendar quatro nomes com barras, ainda mais
  // porque alguns nomes já contêm barra ("Presentes / Mimos").
  function formatarEmpate(nomes, textoEquilibrado) {
    if (nomes.length === 1) return nomes[0];
    if (nomes.length === 2) return nomes[0] + " e " + nomes[1];
    return textoEquilibrado;
  }

  // ============================================================
  // PONTUAÇÃO — MÓDULO 1: LINGUAGENS
  // ============================================================
  //
  // respostas: [{ item: 1, letra: "A" }, ...]
  //
  // Desempate: entre as linguagens empatadas, vence a que ganhou o confronto
  // direto contra a outra. Como o desenho garante que todo par se enfrentou,
  // esse critério quase sempre resolve. Persistindo o empate, as duas são
  // reportadas — mas explicitamente, e não por concatenação silenciosa.
  function pontuarLinguagem(respostas) {
    var contagem = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    var confrontos = {}; // "A>B" = quantas vezes A venceu B

    (respostas || []).forEach(function (r) {
      var item = ITENS_LINGUAGEM.filter(function (i) { return i.id === r.item; })[0];
      if (!item) return;
      var vencedora = r.letra;
      var perdedora = item.a.letra === vencedora ? item.b.letra : item.a.letra;
      if (contagem[vencedora] === undefined) return;
      contagem[vencedora] += 1;
      var chave = vencedora + ">" + perdedora;
      confrontos[chave] = (confrontos[chave] || 0) + 1;
    });

    var topo = chavesNoTopo(contagem);
    var principal = topo;

    if (topo.length > 1) {
      // Desempate por confronto direto entre as empatadas.
      var vitorias = {};
      topo.forEach(function (x) {
        vitorias[x] = 0;
        topo.forEach(function (y) {
          if (x !== y) vitorias[x] += (confrontos[x + ">" + y] || 0);
        });
      });
      principal = chavesNoTopo(vitorias);
    }

    var ordem = ordenarPorScore(contagem);
    var secundaria = ordem.filter(function (l) { return principal.indexOf(l) === -1; })[0] || null;

    return {
      contagem: contagem,
      percentual: percentualizar(contagem),
      principal: principal,
      principalNome: formatarEmpate(
        principal.map(function (l) { return LINGUAGENS[l]; }),
        "Perfil equilibrado — sem linguagem dominante"
      ),
      secundaria: principal.length > 2 ? null : secundaria,
      secundariaNome: (principal.length > 2 || !secundaria) ? "" : LINGUAGENS[secundaria],
      empate: principal.length > 1,
      equilibrado: principal.length > 2
    };
  }

  // ============================================================
  // PONTUAÇÃO — MÓDULO 2: TEMPERAMENTO
  // ============================================================
  //
  // respostas: [{ item: 1, valor: 1..5 }, ...]
  // O percentual é o que deve ser lido: neutraliza quem marca alto em tudo.
  function pontuarTemperamento(respostas) {
    var bruto = { colerico: 0, sanguineo: 0, melancol: 0, fleumatico: 0 };

    (respostas || []).forEach(function (r) {
      var item = ITENS_TEMPERAMENTO.filter(function (i) { return i.id === r.item; })[0];
      if (!item) return;
      bruto[item.fator] += Number(r.valor) || 0;
    });

    var pct = percentualizar(bruto);
    var topo = chavesNoTopo(bruto);
    var ordem = ordenarPorScore(bruto);
    var secundario = ordem.filter(function (t) { return topo.indexOf(t) === -1; })[0] || null;

    return {
      bruto: bruto,
      percentual: pct,
      principal: topo,
      principalNome: formatarEmpate(
        topo.map(function (t) { return TEMPERAMENTOS[t]; }),
        "Perfil equilibrado — sem temperamento dominante"
      ),
      secundario: topo.length > 2 ? null : secundario,
      secundarioNome: (topo.length > 2 || !secundario) ? "" : TEMPERAMENTOS[secundario],
      empate: topo.length > 1,
      equilibrado: topo.length > 2
    };
  }

  // ============================================================
  // PONTUAÇÃO — MÓDULO 3: ENEAGRAMA
  // ============================================================
  //
  // respostas: [{ item: 1, valor: 1..5 }, ...]
  //
  // Devolve tipo principal, asa (vizinho mais pontuado no círculo, onde 9 e 1
  // são vizinhos) e centro de inteligência.
  // Desempate: maior soma do centro correspondente; persistindo, reporta ambos.
  function pontuarEneagrama(respostas) {
    var bruto = {};
    for (var t = 1; t <= 9; t++) bruto[t] = 0;

    (respostas || []).forEach(function (r) {
      var item = ITENS_ENEAGRAMA.filter(function (i) { return i.id === r.item; })[0];
      if (!item) return;
      bruto[item.tipo] += Number(r.valor) || 0;
    });

    var centros = { Instintivo: 0, Emocional: 0, Mental: 0 };
    Object.keys(bruto).forEach(function (tipo) {
      centros[TIPOS_ENEAGRAMA[tipo].centro] += bruto[tipo];
    });

    var topo = chavesNoTopo(bruto);
    if (topo.length > 1) {
      // Desempate pelo centro de inteligência mais forte.
      var porCentro = {};
      topo.forEach(function (tipo) {
        porCentro[tipo] = centros[TIPOS_ENEAGRAMA[tipo].centro];
      });
      topo = chavesNoTopo(porCentro);
    }

    var principal = Number(topo[0]);
    var anterior = principal === 1 ? 9 : principal - 1;
    var posterior = principal === 9 ? 1 : principal + 1;
    var asa = bruto[anterior] >= bruto[posterior] ? anterior : posterior;

    return {
      bruto: bruto,
      percentual: percentualizar(bruto),
      centros: centros,
      principal: principal,
      principalNome: TIPOS_ENEAGRAMA[principal].nome,
      asa: asa,
      asaNome: TIPOS_ENEAGRAMA[asa].nome,
      // Notação usual: tipo com asa, por exemplo "1a9".
      notacao: principal + "a" + asa,
      centro: TIPOS_ENEAGRAMA[principal].centro,
      empate: topo.length > 1,
      empatados: topo.map(Number)
    };
  }

  // ============================================================
  // PONTUAÇÃO — MÓDULO 4: DISC
  // ============================================================
  //
  // respostas: [{ bloco: 1, mais: "D", menos: "S" }, ...]
  // Score = mais - menos. Faixa possível: -12 a +12.
  // Desempate: quem foi escolhido mais vezes como MAIS.
  function pontuarDisc(respostas) {
    var mais = { D: 0, I: 0, S: 0, C: 0 };
    var menos = { D: 0, I: 0, S: 0, C: 0 };

    (respostas || []).forEach(function (r) {
      if (mais[r.mais] !== undefined) mais[r.mais] += 1;
      if (menos[r.menos] !== undefined) menos[r.menos] += 1;
    });

    var score = {};
    Object.keys(mais).forEach(function (f) { score[f] = mais[f] - menos[f]; });

    // Escala de leitura de 0 a 100 (o score bruto vai de -12 a +12).
    var totalBlocos = BLOCOS_DISC.length;
    var intensidade = {};
    Object.keys(score).forEach(function (f) {
      intensidade[f] = Math.round(((score[f] + totalBlocos) / (2 * totalBlocos)) * 100);
    });

    var topo = chavesNoTopo(score);
    if (topo.length > 1) {
      var porMais = {};
      topo.forEach(function (f) { porMais[f] = mais[f]; });
      topo = chavesNoTopo(porMais);
    }

    var dominante = topo[0];
    var ordem = ordenarPorScore(score);
    var secundario = ordem.filter(function (f) { return f !== dominante; })[0] || null;
    var combinacao = secundario ? (COMBINACOES_DISC[dominante + secundario] || "") : "";

    return {
      mais: mais,
      menos: menos,
      score: score,
      intensidade: intensidade,
      dominante: dominante,
      dominanteNome: FATORES_DISC[dominante],
      secundario: secundario,
      secundarioNome: secundario ? FATORES_DISC[secundario] : "",
      combinacao: combinacao,
      // Exemplo: "DC — Estrategista"
      perfil: secundario ? (dominante + secundario + (combinacao ? " — " + combinacao : "")) : dominante,
      empate: topo.length > 1
    };
  }

  // ============================================================
  // CONTROLE DE QUALIDADE DA RESPOSTA
  // ============================================================
  //
  // Não bloqueia ninguém. Apenas sinaliza, para que o dashboard e o gestor
  // saibam quando um resultado deve ser lido com ressalva.
  //
  // entrada: {
  //   temperamento: [...], eneagrama: [...],
  //   respostaAtencao: 1..5, segundos: 123
  // }
  function calcularQualidade(entrada) {
    var e = entrada || {};
    var likert = []
      .concat((e.temperamento || []).map(function (r) { return Number(r.valor); }))
      .concat((e.eneagrama || []).map(function (r) { return Number(r.valor); }));

    // Straight-lining: a mesma nota em todas as afirmações de escala.
    var monotona = likert.length > 0 && likert.every(function (v) { return v === likert[0]; });

    // Tempo mínimo plausível para 76 itens, com folga (4 minutos).
    var TEMPO_MINIMO_SEGUNDOS = 240;
    var rapidoDemais = typeof e.segundos === "number" && e.segundos > 0 && e.segundos < TEMPO_MINIMO_SEGUNDOS;

    // Item de atenção: esperado exatamente o valor pedido no enunciado.
    var falhouAtencao = e.respostaAtencao !== undefined &&
      e.respostaAtencao !== null &&
      Number(e.respostaAtencao) !== ITEM_ATENCAO.valorEsperado;

    var alertas = [];
    if (monotona) alertas.push("Mesma nota em todas as afirmações");
    if (rapidoDemais) alertas.push("Preenchido em menos de 4 minutos");
    if (falhouAtencao) alertas.push("Item de atenção não conferido");

    return {
      monotona: monotona,
      rapidoDemais: rapidoDemais,
      falhouAtencao: falhouAtencao,
      alertas: alertas,
      // "OK" ou "Revisar" — é isso que vai para a planilha.
      status: alertas.length === 0 ? "OK" : "Revisar",
      segundos: e.segundos || 0
    };
  }

  // ============================================================
  // CÁLCULO COMPLETO
  // ============================================================
  function calcularPerfilCompleto(respostas) {
    var r = respostas || {};
    return {
      versao: VERSAO,
      linguagem: pontuarLinguagem(r.linguagem),
      temperamento: pontuarTemperamento(r.temperamento),
      eneagrama: pontuarEneagrama(r.eneagrama),
      disc: pontuarDisc(r.disc),
      qualidade: calcularQualidade({
        temperamento: r.temperamento,
        eneagrama: r.eneagrama,
        respostaAtencao: r.respostaAtencao,
        segundos: r.segundos
      })
    };
  }

  return {
    VERSAO: VERSAO,
    LINGUAGENS: LINGUAGENS,
    TEMPERAMENTOS: TEMPERAMENTOS,
    TIPOS_ENEAGRAMA: TIPOS_ENEAGRAMA,
    FATORES_DISC: FATORES_DISC,
    COMBINACOES_DISC: COMBINACOES_DISC,
    ITENS_LINGUAGEM: ITENS_LINGUAGEM,
    ITENS_TEMPERAMENTO: ITENS_TEMPERAMENTO,
    ITENS_ENEAGRAMA: ITENS_ENEAGRAMA,
    ITEM_ATENCAO: ITEM_ATENCAO,
    BLOCOS_DISC: BLOCOS_DISC,
    pontuarLinguagem: pontuarLinguagem,
    pontuarTemperamento: pontuarTemperamento,
    pontuarEneagrama: pontuarEneagrama,
    pontuarDisc: pontuarDisc,
    calcularQualidade: calcularQualidade,
    calcularPerfilCompleto: calcularPerfilCompleto
  };
})();

// Disponível tanto no navegador (via <script src>) quanto no Node (testes).
if (typeof window !== "undefined") { window.INSTRUMENTO = INSTRUMENTO; }
if (typeof module !== "undefined" && module.exports) { module.exports = INSTRUMENTO; }
