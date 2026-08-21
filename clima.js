/**
 * ============================================================
 *  CARD DE CLIMA — componente compartilhado
 * ============================================================
 *
 * Um cartãozinho com a previsão do tempo para exibir no topo de
 * qualquer página do projeto. Para usar, basta incluir:
 *
 *     <script src="config.js"></script>
 *     <script src="clima.js"></script>
 *
 * O card é inserido dentro do elemento #clima-topo, se ele existir
 * na página; caso contrário, é colocado no topo do <body>.
 *
 * A cidade é definida no config.js (bloco "clima"). Os dados vêm da
 * API pública Open-Meteo — gratuita e sem cadastro/chave.
 * Se a consulta falhar, o card simplesmente não aparece.
 */

(function () {
  "use strict";

  var PADRAO = {
    exibir: true,
    cidade: "São Paulo",
    latitude: null,   // opcional: se preenchido, dispensa a busca pela cidade
    longitude: null
  };

  var cfg = Object.assign({}, PADRAO, (window.CONFIG_ESCOLA || {}).clima || {});
  if (!cfg.exibir) return;

  var MINUTO = 60 * 1000;
  var VALIDADE_CLIMA = 15 * MINUTO;        // reconsulta o tempo a cada 15 min
  var VALIDADE_COORDENADAS = 30 * 24 * 60 * MINUTO; // coordenadas da cidade duram 30 dias

  // ===== TEMPO (códigos WMO) =====

  var TEMPO = {
    0:  ["Céu limpo", "☀️", "🌙"],
    1:  ["Poucas nuvens", "🌤️", "🌙"],
    2:  ["Parcialmente nublado", "⛅", "☁️"],
    3:  ["Nublado", "☁️", "☁️"],
    45: ["Nevoeiro", "🌫️", "🌫️"],
    48: ["Nevoeiro", "🌫️", "🌫️"],
    51: ["Garoa fraca", "🌦️", "🌧️"],
    53: ["Garoa", "🌦️", "🌧️"],
    55: ["Garoa forte", "🌧️", "🌧️"],
    56: ["Garoa congelante", "🌧️", "🌧️"],
    57: ["Garoa congelante", "🌧️", "🌧️"],
    61: ["Chuva fraca", "🌦️", "🌧️"],
    63: ["Chuva", "🌧️", "🌧️"],
    65: ["Chuva forte", "🌧️", "🌧️"],
    66: ["Chuva congelante", "🌧️", "🌧️"],
    67: ["Chuva congelante", "🌧️", "🌧️"],
    71: ["Neve fraca", "🌨️", "🌨️"],
    73: ["Neve", "❄️", "❄️"],
    75: ["Neve forte", "❄️", "❄️"],
    77: ["Grãos de neve", "🌨️", "🌨️"],
    80: ["Pancadas de chuva", "🌦️", "🌧️"],
    81: ["Pancadas de chuva", "🌧️", "🌧️"],
    82: ["Chuva muito forte", "⛈️", "⛈️"],
    85: ["Pancadas de neve", "🌨️", "🌨️"],
    86: ["Pancadas de neve", "🌨️", "🌨️"],
    95: ["Trovoada", "⛈️", "⛈️"],
    96: ["Trovoada com granizo", "⛈️", "⛈️"],
    99: ["Trovoada com granizo", "⛈️", "⛈️"]
  };

  function descreverTempo(codigo, ehDia) {
    var t = TEMPO[codigo] || ["Tempo indefinido", "🌡️", "🌡️"];
    return { texto: t[0], icone: ehDia ? t[1] : t[2] };
  }

  // ===== CACHE (localStorage) =====

  function lerCache(chave, validade) {
    try {
      var bruto = localStorage.getItem(chave);
      if (!bruto) return null;
      var item = JSON.parse(bruto);
      if (!item || (Date.now() - item.ts) > validade) return null;
      return item.dados;
    } catch (e) {
      return null;
    }
  }

  function gravarCache(chave, dados) {
    try {
      localStorage.setItem(chave, JSON.stringify({ ts: Date.now(), dados: dados }));
    } catch (e) { /* modo privado / cota cheia: segue sem cache */ }
  }

  // ===== CONSULTAS À API =====

  function buscarJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function obterCoordenadas() {
    if (typeof cfg.latitude === "number" && typeof cfg.longitude === "number") {
      return Promise.resolve({ lat: cfg.latitude, lon: cfg.longitude, nome: cfg.cidade || "" });
    }

    var cidade = (cfg.cidade || "").trim();
    if (!cidade) return Promise.reject(new Error("Cidade não configurada"));

    var chave = "climaCoords:" + cidade.toLowerCase();
    var salvo = lerCache(chave, VALIDADE_COORDENADAS);
    if (salvo) return Promise.resolve(salvo);

    var url = "https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&format=json" +
      "&name=" + encodeURIComponent(cidade);

    return buscarJson(url).then(function (json) {
      var achado = (json.results || [])[0];
      if (!achado) throw new Error("Cidade não encontrada: " + cidade);
      var coords = { lat: achado.latitude, lon: achado.longitude, nome: achado.name };
      gravarCache(chave, coords);
      return coords;
    });
  }

  function obterClima(coords) {
    var chave = "climaAtual:" + coords.lat.toFixed(2) + "," + coords.lon.toFixed(2);
    var salvo = lerCache(chave, VALIDADE_CLIMA);
    if (salvo) return Promise.resolve(salvo);

    var url = "https://api.open-meteo.com/v1/forecast?timezone=auto" +
      "&latitude=" + coords.lat + "&longitude=" + coords.lon +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min";

    return buscarJson(url).then(function (json) {
      var atual = json.current || {};
      var diario = json.daily || {};
      var clima = {
        temperatura: Math.round(atual.temperature_2m),
        sensacao: Math.round(atual.apparent_temperature),
        umidade: atual.relative_humidity_2m,
        ehDia: atual.is_day !== 0,
        codigo: atual.weather_code,
        minima: Math.round((diario.temperature_2m_min || [])[0]),
        maxima: Math.round((diario.temperature_2m_max || [])[0]),
        cidade: coords.nome || cfg.cidade || ""
      };
      gravarCache(chave, clima);
      return clima;
    });
  }

  // ===== INTERFACE =====

  var CSS =
    ".clima-card{display:flex;align-items:center;gap:12px;flex-wrap:wrap;" +
    "background:rgba(255,255,255,.95);border:1px solid rgba(0,0,0,.07);border-radius:12px;" +
    "padding:10px 14px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.10);" +
    "font-family:inherit;font-size:13px;color:#1A202C;line-height:1.35}" +
    ".clima-card[hidden]{display:none}" +
    ".clima-icone{font-size:26px;line-height:1}" +
    ".clima-temp{font-size:20px;font-weight:700;letter-spacing:-.02em}" +
    ".clima-desc{color:#4A5568}" +
    ".clima-extra{color:#718096;font-size:12px}" +
    ".clima-local{margin-left:auto;text-align:right;color:#718096;font-size:12px}" +
    "@media(max-width:520px){.clima-local{margin-left:0;text-align:left;width:100%}}" +
    "@media print{.clima-card{display:none}}";

  function montarEstilo() {
    if (document.getElementById("clima-estilo")) return;
    var estilo = document.createElement("style");
    estilo.id = "clima-estilo";
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }

  function montarCard() {
    var card = document.createElement("div");
    card.className = "clima-card";
    card.id = "clima-card";
    card.setAttribute("role", "status");
    card.hidden = true;

    var destino = document.getElementById("clima-topo");
    if (destino) {
      destino.appendChild(card);
    } else {
      // Sem ponto de montagem na página: entra no topo do body com margem própria.
      card.style.maxWidth = "700px";
      card.style.marginInline = "auto";
      document.body.insertBefore(card, document.body.firstChild);
    }
    return card;
  }

  function preencherCard(card, clima) {
    var t = descreverTempo(clima.codigo, clima.ehDia);
    var faixa = (isFinite(clima.minima) && isFinite(clima.maxima))
      ? "mín " + clima.minima + "° · máx " + clima.maxima + "°"
      : "";
    var horario = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    card.textContent = "";
    card.title = "Sensação de " + clima.sensacao + "° · umidade " + clima.umidade +
      "% · atualizado às " + horario;

    var bloco = function (classe, texto) {
      var el = document.createElement("div");
      el.className = classe;
      el.textContent = texto;
      return el;
    };

    card.appendChild(bloco("clima-icone", t.icone));
    card.appendChild(bloco("clima-temp", clima.temperatura + "°C"));

    var meio = document.createElement("div");
    meio.appendChild(bloco("clima-desc", t.texto));
    if (faixa) meio.appendChild(bloco("clima-extra", faixa));
    card.appendChild(meio);

    var local = document.createElement("div");
    local.className = "clima-local";
    local.appendChild(bloco("", clima.cidade));
    local.appendChild(bloco("clima-extra", "Sensação " + clima.sensacao + "° · " + clima.umidade + "% umidade"));
    card.appendChild(local);

    card.hidden = false;
  }

  function atualizar(card) {
    return obterCoordenadas()
      .then(obterClima)
      .then(function (clima) { preencherCard(card, clima); })
      .catch(function (erro) {
        card.hidden = true;
        console.warn("Card de clima indisponível: " + erro.message);
      });
  }

  function iniciar() {
    montarEstilo();
    var card = montarCard();
    atualizar(card);
    // Páginas que ficam abertas (dashboard) continuam recebendo dados novos.
    setInterval(function () { atualizar(card); }, VALIDADE_CLIMA);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
