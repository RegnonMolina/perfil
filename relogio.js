/**
 * ============================================================
 *  RELÓGIO FLIP  —  card de horas no estilo painel de aeroporto
 * ============================================================
 *
 * Card com dígitos que "viram" (split-flap) a cada segundo, feito
 * para ficar AO LADO do card de clima (#weather-card, clima.js).
 *
 * Segue o mesmo contrato do clima.js de propósito: arquivo único,
 * sem biblioteca externa, que se monta sozinho e não exige nada do
 * HTML além do ponto de montagem opcional <div id="clima-topo">.
 * Assim o mesmo arquivo serve às páginas do GitHub Pages e pode ser
 * colado dentro de um <script> de web app do Apps Script.
 *
 * Configuração (opcional) em config.js:
 *
 *   window.CONFIG_ESCOLA = {
 *     relogio: {
 *       exibir: true,        // false esconde o card em todas as páginas
 *       segundos: true,      // false mostra apenas horas e minutos
 *       formato24: true,     // false usa 12h com AM/PM
 *       mostrarData: true    // false esconde a linha do dia da semana
 *     }
 *   };
 *
 * Acessibilidade: quem tem "reduzir movimento" ligado no sistema
 * recebe o mesmo relógio SEM a animação de virada — o horário
 * simplesmente troca. Mesma regra já adotada no formulário e no
 * dashboard.
 */
(function () {
  "use strict";

  var PADRAO = {
    exibir: true,
    segundos: true,
    formato24: true,
    mostrarData: true
  };

  // Lê a configuração da organização por cima dos padrões. O clima.js faz
  // igual — config ausente nunca pode impedir o card de aparecer.
  var cfg = Object.assign({}, PADRAO, (window.CONFIG_ESCOLA || {}).relogio || {});

  var DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira",
              "quinta-feira", "sexta-feira", "sábado"];
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
               "jul", "ago", "set", "out", "nov", "dez"];

  // Duração da virada. Metade do tempo é a aba de cima caindo, a outra
  // metade é a de baixo subindo — por isso o CSS usa .24s em cada uma.
  var DURACAO_MS = 480;

  var CSS =
    "#flip-clock{display:flex;align-items:center;gap:12px;max-width:fit-content;" +
    "margin:0 0 16px 0;padding:8px 14px;border-radius:10px;background:#1e293b;color:#f1f5f9;" +
    "font-family:inherit;font-size:13px;line-height:1.35}" +
    "#flip-clock[hidden]{display:none}" +
    "#flip-clock .fc-mostrador{display:flex;align-items:center;gap:3px}" +
    "#flip-clock .fc-info{display:flex;flex-direction:column;gap:1px}" +
    "#flip-clock .fc-dia{opacity:.7;font-size:11px;white-space:nowrap}" +
    "#flip-clock .fc-data{opacity:.7;font-size:11px;white-space:nowrap}" +
    "#flip-clock .fc-sufixo{opacity:.7;font-size:11px;letter-spacing:.06em;align-self:flex-start;margin-top:2px}" +

    // Separador ":" entre os grupos — pisca junto com o segundo.
    "#flip-clock .fc-sep{font-size:17px;font-weight:bold;opacity:.55;padding:0 1px;" +
    "animation:fcPisca 1s steps(1,end) infinite}" +
    "@keyframes fcPisca{0%,50%{opacity:.55}50.01%,100%{opacity:.18}}" +

    // ── Dígito ──
    // Caixa com perspectiva; as duas metades estáticas ficam sempre
    // visíveis e as duas abas só existem durante a virada.
    "#flip-clock .fc-digito{position:relative;width:22px;height:32px;" +
    "perspective:90px;font-size:22px;font-weight:bold;line-height:32px;text-align:center;" +
    "font-variant-numeric:tabular-nums}" +
    "#flip-clock .fc-face,#flip-clock .fc-aba{position:absolute;left:0;width:100%;height:50%;" +
    "overflow:hidden;background:#0f172a;color:#f1f5f9;backface-visibility:hidden}" +
    "#flip-clock .fc-topo,#flip-clock .fc-aba-topo{top:0;border-radius:4px 4px 0 0;" +
    "border-bottom:1px solid rgba(0,0,0,.55);transform-origin:50% 100%}" +
    "#flip-clock .fc-baixo,#flip-clock .fc-aba-baixo{bottom:0;border-radius:0 0 4px 4px;" +
    "transform-origin:50% 0%}" +
    // O texto de cada metade é o dígito inteiro deslocado: a metade de
    // baixo sobe 50% para mostrar a parte inferior do mesmo glifo.
    "#flip-clock .fc-baixo span,#flip-clock .fc-aba-baixo span{display:block;margin-top:-16px}" +
    "#flip-clock .fc-aba{z-index:2}" +
    "#flip-clock .fc-aba-baixo{z-index:3;transform:rotateX(90deg)}" +

    "#flip-clock .fc-virando .fc-aba-topo{animation:fcTopo .24s ease-in forwards}" +
    "#flip-clock .fc-virando .fc-aba-baixo{animation:fcBaixo .24s ease-out .24s forwards}" +
    "@keyframes fcTopo{0%{transform:rotateX(0)}100%{transform:rotateX(-90deg)}}" +
    "@keyframes fcBaixo{0%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}" +

    // Sem virada para quem pediu menos movimento no sistema operacional.
    "@media (prefers-reduced-motion:reduce){" +
    "#flip-clock .fc-virando .fc-aba-topo,#flip-clock .fc-virando .fc-aba-baixo{animation:none}" +
    "#flip-clock .fc-sep{animation:none;opacity:.55}}" +

    // Fica ao lado do card de clima quando os dois dividem o #clima-topo.
    // Feito daqui, com seletor mais específico, para não precisar alterar
    // o clima.js — que continua idêntico ao que já estava em produção.
    "#clima-topo{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}" +
    "#clima-topo #weather-card,#clima-topo #flip-clock{margin-bottom:0}" +
    "#clima-topo{margin-bottom:16px}" +

    "@media print{#flip-clock{display:none}}";

  function montarEstilo() {
    if (document.getElementById("relogio-estilo")) return;
    var estilo = document.createElement("style");
    estilo.id = "relogio-estilo";
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }

  function elemento(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /**
   * Cria um dígito com as duas metades estáticas. As abas da virada são
   * criadas e descartadas a cada troca, para não deixar nó órfão animando.
   * @param {string} valor - Caractere inicial ("0"–"9")
   * @return {HTMLElement} Elemento do dígito
   */
  function criarDigito(valor) {
    var d = elemento("span", "fc-digito");
    d.dataset.valor = valor;

    var topo = elemento("span", "fc-face fc-topo");
    topo.appendChild(elemento("span", "", valor));

    var baixo = elemento("span", "fc-face fc-baixo");
    baixo.appendChild(elemento("span", "", valor));

    d.appendChild(topo);
    d.appendChild(baixo);
    return d;
  }

  /**
   * Troca o valor de um dígito, virando-o. Se o valor não mudou, não faz
   * nada — sem isso, os dígitos parados piscariam a cada segundo.
   * @param {HTMLElement} d - Elemento do dígito
   * @param {string} novo - Novo caractere
   */
  function virarDigito(d, novo) {
    var antigo = d.dataset.valor;
    if (antigo === novo) return;
    d.dataset.valor = novo;

    var topo = d.querySelector(".fc-topo span");
    var baixo = d.querySelector(".fc-baixo span");

    // Abas da virada: a de cima mostra o valor ANTIGO caindo, a de baixo
    // mostra o NOVO subindo. A metade de cima estática já vira o novo
    // valor, escondida atrás da aba enquanto ela cai.
    var abaTopo = elemento("span", "fc-aba fc-aba-topo");
    abaTopo.appendChild(elemento("span", "", antigo));
    var abaBaixo = elemento("span", "fc-aba fc-aba-baixo");
    abaBaixo.appendChild(elemento("span", "", novo));

    topo.textContent = novo;
    d.appendChild(abaTopo);
    d.appendChild(abaBaixo);
    d.classList.add("fc-virando");

    window.setTimeout(function () {
      // Só ao fim da virada a metade de baixo assume o novo valor — antes
      // disso ela precisa continuar mostrando o antigo, senão a animação
      // revela o resultado cedo demais.
      baixo.textContent = novo;
      d.classList.remove("fc-virando");
      if (abaTopo.parentNode) d.removeChild(abaTopo);
      if (abaBaixo.parentNode) d.removeChild(abaBaixo);
    }, DURACAO_MS);
  }

  /**
   * Monta o card e devolve as referências usadas na atualização.
   * @return {object} { card, digitos, dia, data, sufixo }
   */
  function montarCard() {
    var card = elemento("div", "");
    card.id = "flip-clock";
    card.setAttribute("role", "timer");
    card.setAttribute("aria-live", "off");   // ler a cada segundo seria ruído

    var mostrador = elemento("div", "fc-mostrador");
    var digitos = [];

    // Grupos: HH, MM e (opcional) SS, separados por ":".
    var grupos = cfg.segundos ? 3 : 2;
    for (var g = 0; g < grupos; g++) {
      if (g > 0) mostrador.appendChild(elemento("span", "fc-sep", ":"));
      for (var i = 0; i < 2; i++) {
        var d = criarDigito("0");
        digitos.push(d);
        mostrador.appendChild(d);
      }
    }

    var sufixo = null;
    if (!cfg.formato24) {
      sufixo = elemento("span", "fc-sufixo", "--");
      mostrador.appendChild(sufixo);
    }

    card.appendChild(mostrador);

    var dia = null, data = null;
    if (cfg.mostrarData) {
      var info = elemento("div", "fc-info");
      dia = elemento("div", "fc-dia", "");
      data = elemento("div", "fc-data", "");
      info.appendChild(dia);
      info.appendChild(data);
      card.appendChild(info);
    }

    // Mesmo ponto de montagem do card de clima, para os dois ficarem lado
    // a lado. Sem ele, entra no topo do body — igual ao clima.js.
    var destino = document.getElementById("clima-topo");
    if (destino) {
      destino.appendChild(card);
    } else {
      document.body.insertBefore(card, document.body.firstChild);
    }

    return { card: card, digitos: digitos, dia: dia, data: data, sufixo: sufixo };
  }

  function doisDigitos(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /**
   * Escreve o horário atual nos dígitos.
   * @param {object} ref - Retorno de montarCard()
   */
  function atualizar(ref) {
    var agora = new Date();
    var horas = agora.getHours();

    if (!cfg.formato24) {
      var periodo = horas < 12 ? "AM" : "PM";
      horas = horas % 12;
      if (horas === 0) horas = 12;
      if (ref.sufixo) ref.sufixo.textContent = periodo;
    }

    var texto = doisDigitos(horas) + doisDigitos(agora.getMinutes()) +
      (cfg.segundos ? doisDigitos(agora.getSeconds()) : "");

    for (var i = 0; i < ref.digitos.length; i++) {
      virarDigito(ref.digitos[i], texto.charAt(i));
    }

    // Só a primeira letra em maiúscula: "Quarta-feira", não
    // "Quarta-Feira" — capitalize do CSS erraria a segunda palavra.
    if (ref.dia) {
      var nome = DIAS[agora.getDay()];
      ref.dia.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
    }
    if (ref.data) {
      ref.data.textContent = doisDigitos(agora.getDate()) + " " +
        MESES[agora.getMonth()] + " " + agora.getFullYear();
    }
  }

  /**
   * Agenda a próxima atualização na virada do segundo seguinte. Um
   * setInterval(1000) acumularia atraso e o relógio sairia do horário
   * depois de algumas horas abertas.
   * @param {object} ref - Retorno de montarCard()
   */
  function agendar(ref) {
    var atraso = 1000 - (Date.now() % 1000);
    window.setTimeout(function () {
      atualizar(ref);
      agendar(ref);
    }, atraso);
  }

  function iniciar() {
    if (cfg.exibir === false) return;
    if (document.getElementById("flip-clock")) return;
    montarEstilo();
    var ref = montarCard();
    atualizar(ref);
    agendar(ref);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
