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
 * ── CONFIGURAÇÃO ──
 * Dois níveis, igual ao clima.js: a organização define o padrão no
 * config.js, e cada pessoa ajusta o seu no botão ⚙ do card (guardado
 * no localStorage do próprio navegador, por cima do padrão).
 *
 *   window.CONFIG_ESCOLA = {
 *     relogio: {
 *       exibir: true,               // false esconde o card
 *       segundos: true,             // false mostra só horas e minutos
 *       formato24: true,            // false usa 12h com AM/PM
 *       mostrarData: true,          // false esconde dia da semana e data
 *       piscarSeparador: true,      // false deixa o ":" parado
 *       tamanho: "medio",           // "pequeno" | "medio" | "grande"
 *       tema: "auto",               // "auto" | "claro" | "escuro"
 *       mostrarConfiguracoes: true  // false esconde o botão ⚙
 *     }
 *   };
 *
 * "auto" no tema segue a preferência do sistema operacional
 * (prefers-color-scheme) — é o que faz o card combinar tanto com a
 * barra clara do topo quanto com o corpo escuro das páginas.
 *
 * Acessibilidade: quem tem "reduzir movimento" ligado no sistema
 * recebe o mesmo relógio SEM a animação de virada — o horário
 * simplesmente troca. Mesma regra já adotada no formulário e no
 * dashboard.
 */
(function () {
  "use strict";

  var CHAVE_PREFERENCIAS = "relogioPreferencias";

  var PADRAO = {
    exibir: true,
    segundos: true,
    formato24: true,
    mostrarData: true,
    piscarSeparador: true,
    tamanho: "medio",
    tema: "auto",
    mostrarConfiguracoes: true
  };

  // Só estes campos vêm do painel do usuário. "exibir" e
  // "mostrarConfiguracoes" ficam de fora de propósito: são decisão da
  // organização, não de quem acessa — senão a pessoa esconde o botão ⚙
  // e não tem mais como trazer o card de volta.
  var CAMPOS_DO_USUARIO = ["segundos", "formato24", "mostrarData",
                           "piscarSeparador", "tamanho", "tema"];

  function lerPreferencias() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) || "{}") || {};
    } catch (e) {
      return {};   // localStorage bloqueado ou JSON corrompido: usa o padrão
    }
  }

  function salvarPreferencias(prefs) {
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(prefs));
    } catch (e) {
      // Navegador em modo restrito: a escolha vale para esta sessão e
      // some ao recarregar. Não é motivo para quebrar o card.
    }
  }

  // Padrões do arquivo < config da organização < ajuste local da pessoa.
  var cfg = Object.assign({}, PADRAO,
    (window.CONFIG_ESCOLA || {}).relogio || {}, lerPreferencias());

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
    "#flip-clock .fc-config{margin-left:2px;padding:2px 6px;border:0;border-radius:6px;" +
    "background:rgba(255,255,255,.12);color:inherit;font:inherit;font-size:13px;cursor:pointer}" +
    "#flip-clock .fc-config:hover{background:rgba(255,255,255,.22)}" +

    // Separador ":" entre os grupos — pisca junto com o segundo.
    "#flip-clock .fc-sep{font-size:17px;font-weight:bold;opacity:.55;padding:0 1px;" +
    "animation:fcPisca 1s steps(1,end) infinite}" +
    "#flip-clock.fc-sem-pisca .fc-sep{animation:none}" +
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

    // ── Tamanhos ──
    // A metade de baixo desloca o glifo em -50% da altura, então cada
    // tamanho precisa do seu margin-top; por isso não dá para escalar
    // só com font-size.
    "#flip-clock.fc-pequeno .fc-digito{width:16px;height:24px;font-size:16px;line-height:24px}" +
    "#flip-clock.fc-pequeno .fc-baixo span,#flip-clock.fc-pequeno .fc-aba-baixo span{margin-top:-12px}" +
    "#flip-clock.fc-pequeno .fc-sep{font-size:13px}" +
    "#flip-clock.fc-grande .fc-digito{width:30px;height:44px;font-size:30px;line-height:44px;perspective:120px}" +
    "#flip-clock.fc-grande .fc-baixo span,#flip-clock.fc-grande .fc-aba-baixo span{margin-top:-22px}" +
    "#flip-clock.fc-grande .fc-sep{font-size:23px}" +

    // ── Temas ──
    // "claro" existe para o card ficar legível dentro da barra branca do
    // topo; "escuro" é o visual original, do corpo das páginas.
    "#flip-clock.fc-claro{background:transparent;color:#1A1A2E}" +
    "#flip-clock.fc-claro .fc-face,#flip-clock.fc-claro .fc-aba{background:#1A1A2E;color:#FFFFFF}" +
    "#flip-clock.fc-claro .fc-dia,#flip-clock.fc-claro .fc-data{color:#6B7280;opacity:1}" +
    "#flip-clock.fc-claro .fc-config{background:rgba(0,0,0,.06)}" +
    "#flip-clock.fc-claro .fc-config:hover{background:rgba(0,0,0,.12)}" +
    "@media (prefers-color-scheme:light){" +
    "#flip-clock.fc-auto{background:transparent;color:#1A1A2E}" +
    "#flip-clock.fc-auto .fc-dia,#flip-clock.fc-auto .fc-data{color:#6B7280;opacity:1}" +
    "#flip-clock.fc-auto .fc-config{background:rgba(0,0,0,.06)}}" +

    // Sem virada para quem pediu menos movimento no sistema operacional.
    "@media (prefers-reduced-motion:reduce){" +
    "#flip-clock .fc-virando .fc-aba-topo,#flip-clock .fc-virando .fc-aba-baixo{animation:none}" +
    "#flip-clock .fc-sep{animation:none;opacity:.55}}" +

    // ── Painel de configuração ──
    // Mesma linguagem visual do painel do clima (#clima-painel).
    "#relogio-painel{max-width:320px;margin:-8px 0 16px 0;padding:12px 14px;border-radius:10px;" +
    "background:#1e293b;color:#f1f5f9;font-family:inherit;font-size:13px;line-height:1.5}" +
    "#relogio-painel[hidden]{display:none}" +
    "#relogio-painel h4{margin:0 0 8px;font-size:13px;font-weight:bold}" +
    "#relogio-painel label{display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer}" +
    "#relogio-painel .fc-linha{display:flex;gap:14px;margin:8px 0 4px;flex-wrap:wrap}" +
    "#relogio-painel .fc-titulo{opacity:.7;font-size:11px;text-transform:uppercase;" +
    "letter-spacing:.05em;margin-top:10px}" +
    "#relogio-painel .fc-botoes{display:flex;gap:8px;margin-top:10px}" +
    "#relogio-painel button{padding:5px 12px;border:0;border-radius:6px;font:inherit;cursor:pointer}" +
    "#relogio-painel .fc-salvar{background:#38bdf8;color:#0b1220;font-weight:bold}" +
    "#relogio-painel .fc-cancelar{background:rgba(255,255,255,.12);color:inherit}" +

    // Fica ao lado do card de clima quando os dois dividem o #clima-topo.
    // Feito daqui, com seletor mais específico, para não precisar alterar
    // o clima.js — que continua idêntico ao que já estava em produção.
    "#clima-topo{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}" +
    "#clima-topo #weather-card,#clima-topo #flip-clock{margin-bottom:0}" +
    "#clima-topo{margin-bottom:16px}" +

    "@media print{#flip-clock,#relogio-painel{display:none}}";

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
   * Aplica no card as opções que são puro CSS (tamanho, tema, piscada).
   * @param {HTMLElement} card - Elemento do card
   */
  function aplicarAparencia(card) {
    card.className = "fc-" + (cfg.tamanho || "medio") + " fc-" + (cfg.tema || "auto") +
      (cfg.piscarSeparador === false ? " fc-sem-pisca" : "");
  }

  /**
   * (Re)monta o mostrador. Chamado na carga e sempre que o número de
   * dígitos muda — ligar ou desligar os segundos altera a estrutura, não
   * só a aparência.
   * @param {object} ref - Referências do card
   */
  function montarMostrador(ref) {
    ref.mostrador.textContent = "";
    ref.digitos = [];

    var grupos = cfg.segundos ? 3 : 2;
    for (var g = 0; g < grupos; g++) {
      if (g > 0) ref.mostrador.appendChild(elemento("span", "fc-sep", ":"));
      for (var i = 0; i < 2; i++) {
        var d = criarDigito("0");
        ref.digitos.push(d);
        ref.mostrador.appendChild(d);
      }
    }

    if (ref.sufixo && ref.sufixo.parentNode) ref.sufixo.parentNode.removeChild(ref.sufixo);
    ref.sufixo = null;
    if (!cfg.formato24) {
      ref.sufixo = elemento("span", "fc-sufixo", "--");
      ref.mostrador.appendChild(ref.sufixo);
    }

    ref.info.hidden = !cfg.mostrarData;
  }

  function doisDigitos(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /**
   * Escreve o horário atual nos dígitos.
   * @param {object} ref - Referências do card
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

    if (!cfg.mostrarData) return;
    // Só a primeira letra em maiúscula: "Quarta-feira", não
    // "Quarta-Feira" — capitalize do CSS erraria a segunda palavra.
    var nome = DIAS[agora.getDay()];
    ref.dia.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
    ref.data.textContent = doisDigitos(agora.getDate()) + " " +
      MESES[agora.getMonth()] + " " + agora.getFullYear();
  }

  // ===== PAINEL DE CONFIGURAÇÃO =====

  function caixa(rotulo, marcada) {
    var lb = elemento("label", "");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!marcada;
    lb.appendChild(input);
    lb.appendChild(document.createTextNode(rotulo));
    return { rotulo: lb, input: input };
  }

  function radio(grupo, valor, rotulo, marcado) {
    var lb = elemento("label", "");
    var input = document.createElement("input");
    input.type = "radio";
    input.name = grupo;
    input.value = valor;
    input.checked = !!marcado;
    lb.appendChild(input);
    lb.appendChild(document.createTextNode(rotulo));
    return { rotulo: lb, input: input };
  }

  /**
   * Monta o painel do ⚙. As escolhas valem só neste navegador e ficam
   * por cima do padrão do config.js — mesma regra do card de clima.
   * @param {HTMLElement} painel - Elemento do painel
   * @param {object} ref - Referências do card
   */
  function montarPainel(painel, ref) {
    painel.textContent = "";
    painel.appendChild(elemento("h4", "", "Relógio"));

    var segundos = caixa("Mostrar segundos", cfg.segundos);
    var data = caixa("Mostrar dia e data", cfg.mostrarData);
    var pisca = caixa("Piscar o separador", cfg.piscarSeparador !== false);
    var f24 = caixa("Formato 24 horas", cfg.formato24);
    painel.appendChild(segundos.rotulo);
    painel.appendChild(data.rotulo);
    painel.appendChild(f24.rotulo);
    painel.appendChild(pisca.rotulo);

    painel.appendChild(elemento("div", "fc-titulo", "Tamanho"));
    var linhaTam = elemento("div", "fc-linha");
    var tamanhos = [["pequeno", "Pequeno"], ["medio", "Médio"], ["grande", "Grande"]];
    var opcoesTam = tamanhos.map(function (t) {
      var r = radio("relogio-tamanho", t[0], t[1], (cfg.tamanho || "medio") === t[0]);
      linhaTam.appendChild(r.rotulo);
      return r;
    });
    painel.appendChild(linhaTam);

    painel.appendChild(elemento("div", "fc-titulo", "Tema"));
    var linhaTema = elemento("div", "fc-linha");
    var temas = [["auto", "Automático"], ["claro", "Claro"], ["escuro", "Escuro"]];
    var opcoesTema = temas.map(function (t) {
      var r = radio("relogio-tema", t[0], t[1], (cfg.tema || "auto") === t[0]);
      linhaTema.appendChild(r.rotulo);
      return r;
    });
    painel.appendChild(linhaTema);

    function escolhido(opcoes, padrao) {
      for (var i = 0; i < opcoes.length; i++) {
        if (opcoes[i].input.checked) return opcoes[i].input.value;
      }
      return padrao;
    }

    var botoes = elemento("div", "fc-botoes");
    var salvar = elemento("button", "fc-salvar", "Salvar");
    salvar.type = "button";
    salvar.addEventListener("click", function () {
      var antes = { segundos: cfg.segundos, formato24: cfg.formato24,
                    mostrarData: cfg.mostrarData };

      cfg.segundos = segundos.input.checked;
      cfg.mostrarData = data.input.checked;
      cfg.piscarSeparador = pisca.input.checked;
      cfg.formato24 = f24.input.checked;
      cfg.tamanho = escolhido(opcoesTam, "medio");
      cfg.tema = escolhido(opcoesTema, "auto");

      var prefs = {};
      CAMPOS_DO_USUARIO.forEach(function (c) { prefs[c] = cfg[c]; });
      salvarPreferencias(prefs);

      aplicarAparencia(ref.card);
      // Segundos, formato e data mudam a ESTRUTURA do mostrador — só
      // remonta quando um deles mudou, para não descartar a animação em
      // curso à toa.
      if (antes.segundos !== cfg.segundos || antes.formato24 !== cfg.formato24 ||
          antes.mostrarData !== cfg.mostrarData) {
        montarMostrador(ref);
      }
      atualizar(ref);
      painel.hidden = true;
    });

    var cancelar = elemento("button", "fc-cancelar", "Cancelar");
    cancelar.type = "button";
    cancelar.addEventListener("click", function () { painel.hidden = true; });

    botoes.appendChild(salvar);
    botoes.appendChild(cancelar);
    painel.appendChild(botoes);
  }

  /**
   * Monta o card e devolve as referências usadas na atualização.
   * @return {object} Referências do card
   */
  function montarCard() {
    var card = elemento("div", "");
    card.id = "flip-clock";
    card.setAttribute("role", "timer");
    card.setAttribute("aria-live", "off");   // ler a cada segundo seria ruído

    var painel = elemento("div", "");
    painel.id = "relogio-painel";
    painel.hidden = true;

    var mostrador = elemento("div", "fc-mostrador");
    card.appendChild(mostrador);

    var info = elemento("div", "fc-info");
    var dia = elemento("div", "fc-dia", "");
    var data = elemento("div", "fc-data", "");
    info.appendChild(dia);
    info.appendChild(data);
    card.appendChild(info);

    var ref = { card: card, painel: painel, mostrador: mostrador, info: info,
                dia: dia, data: data, digitos: [], sufixo: null };

    if (cfg.mostrarConfiguracoes !== false) {
      var botao = elemento("button", "fc-config", "⚙");
      botao.type = "button";
      botao.title = "Configurar o relógio";
      botao.setAttribute("aria-label", "Configurar o relógio");
      botao.addEventListener("click", function () {
        if (painel.hidden) montarPainel(painel, ref);
        painel.hidden = !painel.hidden;
      });
      card.appendChild(botao);
    }

    // Mesmo ponto de montagem do card de clima, para os dois ficarem lado
    // a lado. Sem ele, entra no topo do body — igual ao clima.js.
    var destino = document.getElementById("clima-topo");
    if (destino) {
      destino.appendChild(card);
      destino.appendChild(painel);
    } else {
      document.body.insertBefore(painel, document.body.firstChild);
      document.body.insertBefore(card, document.body.firstChild);
    }

    aplicarAparencia(card);
    montarMostrador(ref);
    return ref;
  }

  /**
   * Agenda a próxima atualização na virada do segundo seguinte. Um
   * setInterval(1000) acumularia atraso e o relógio sairia do horário
   * depois de algumas horas abertas.
   * @param {object} ref - Referências do card
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
