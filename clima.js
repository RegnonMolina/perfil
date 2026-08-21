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
 * Localização: por padrão usa a posição atual do dispositivo (o
 * navegador pede permissão). Se a permissão for negada ou a posição
 * não vier, cai automaticamente para a cidade definida no config.js.
 *
 * Configuração: o botão ⚙ do card abre um painel onde cada pessoa
 * escolhe a fonte da localização, a cidade e a unidade. Essa escolha
 * vale só para o navegador dela; os padrões vêm do config.js.
 *
 * Dados: API pública Open-Meteo — gratuita e sem cadastro/chave.
 * O nome do lugar, quando a posição vem do dispositivo, é obtido no
 * serviço gratuito BigDataCloud; se ele falhar, o card mostra apenas
 * "Sua localização". Se a consulta do tempo falhar, o card não aparece.
 */

(function () {
  "use strict";

  var PADRAO = {
    exibir: true,
    fonte: "dispositivo",  // "dispositivo" = posição atual; "cidade" = a cidade abaixo
    cidade: "São Paulo",
    latitude: null,        // opcional: usados no lugar da busca pelo nome da cidade
    longitude: null,
    unidade: "C",          // "C" (Celsius) ou "F" (Fahrenheit)
    mostrarConfiguracoes: true
  };

  var CHAVE_PREFERENCIAS = "climaPreferencias";

  var doArquivo = Object.assign({}, PADRAO, (window.CONFIG_ESCOLA || {}).clima || {});
  if (!doArquivo.exibir) return;

  // Preferências escolhidas no painel ⚙ (só deste navegador) por cima do config.js.
  var cfg = Object.assign({}, doArquivo, lerPreferencias());

  var MINUTO = 60 * 1000;
  var VALIDADE_CLIMA = 15 * MINUTO;                  // reconsulta o tempo a cada 15 min
  var VALIDADE_COORDENADAS = 30 * 24 * 60 * MINUTO;  // coordenadas da cidade duram 30 dias
  var VALIDADE_POSICAO = 10 * MINUTO;                // posição do dispositivo reaproveitada por 10 min

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

  // ===== PREFERÊNCIAS E CACHE (localStorage) =====

  function lerPreferencias() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function gravarPreferencias(preferencias) {
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch (e) { /* modo privado / cota cheia: a escolha vale só nesta aba */ }
  }

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

  // ===== LOCALIZAÇÃO =====

  function buscarJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  // Desiste da promessa depois de um tempo, para nada travar o card.
  function comLimiteDeTempo(promessa, ms, mensagem) {
    return new Promise(function (resolve, reject) {
      var encerrado = false;
      var relogio = setTimeout(function () {
        if (encerrado) return;
        encerrado = true;
        reject(new Error(mensagem));
      }, ms);

      promessa.then(
        function (valor) { if (!encerrado) { encerrado = true; clearTimeout(relogio); resolve(valor); } },
        function (erro) { if (!encerrado) { encerrado = true; clearTimeout(relogio); reject(erro); } }
      );
    });
  }

  function estadoDaPermissao() {
    if (!navigator.permissions || !navigator.permissions.query) return Promise.resolve("prompt");
    return navigator.permissions.query({ name: "geolocation" })
      .then(function (p) { return p.state; })
      .catch(function () { return "prompt"; });
  }

  // Posição atual do aparelho. Exige HTTPS e permissão de quem está usando.
  function posicaoDoDispositivo() {
    var salva = lerCache("climaPosicao", VALIDADE_POSICAO);
    if (salva) return Promise.resolve(salva);

    if (!navigator.geolocation) {
      return Promise.reject(new Error("Navegador sem suporte a geolocalização"));
    }

    return estadoDaPermissao().then(function (estado) {
      if (estado === "denied") throw new Error("Permissão de localização negada");

      var pedido = new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function (posicao) {
            var coords = {
              lat: posicao.coords.latitude,
              lon: posicao.coords.longitude,
              nome: ""
            };
            // Guardado mesmo que já tenhamos desistido de esperar: se a pessoa
            // demorar a autorizar, a próxima atualização já usa esta posição.
            gravarCache("climaPosicao", coords);
            resolve(coords);
          },
          function (erro) { reject(new Error("Geolocalização indisponível: " + erro.message)); },
          { timeout: 8000, maximumAge: VALIDADE_POSICAO }
        );
      });

      // O timeout do navegador só começa a contar DEPOIS que a permissão é
      // decidida: se ninguém responder ao aviso, o pedido fica pendurado para
      // sempre. Este limite próprio garante que o card apareça mesmo assim.
      return comLimiteDeTempo(pedido, 9000, "Sem resposta ao pedido de localização");
    });
  }

  // Nome aproximado do lugar a partir das coordenadas (só para exibição).
  function nomeDoLugar(coords) {
    var chave = "climaLugar:" + coords.lat.toFixed(2) + "," + coords.lon.toFixed(2);
    var salvo = lerCache(chave, VALIDADE_COORDENADAS);
    if (salvo) return Promise.resolve(salvo);

    var url = "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt" +
      "&latitude=" + coords.lat + "&longitude=" + coords.lon;

    return buscarJson(url).then(function (json) {
      var nome = json.city || json.locality || json.principalSubdivision || "Sua localização";
      gravarCache(chave, nome);
      return nome;
    }).catch(function () {
      return "Sua localização";
    });
  }

  function coordenadasDaCidade() {
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

  function obterCoordenadas() {
    if (cfg.fonte !== "dispositivo") return coordenadasDaCidade();

    return posicaoDoDispositivo()
      .then(function (coords) {
        return nomeDoLugar(coords).then(function (nome) {
          return { lat: coords.lat, lon: coords.lon, nome: nome };
        });
      })
      .catch(function (erro) {
        // Permissão negada, sem sinal ou dentro de um iframe que bloqueia:
        // segue com a cidade configurada, sem incomodar quem está usando.
        console.warn("Clima: " + erro.message + " — usando a cidade configurada.");
        return coordenadasDaCidade();
      });
  }

  // ===== TEMPO ATUAL =====

  function obterClima(coords) {
    var fahrenheit = cfg.unidade === "F";
    var chave = "climaAtual:" + coords.lat.toFixed(2) + "," + coords.lon.toFixed(2) + ":" + cfg.unidade;
    var salvo = lerCache(chave, VALIDADE_CLIMA);
    if (salvo) return Promise.resolve(Object.assign({}, salvo, { cidade: coords.nome || salvo.cidade }));

    var url = "https://api.open-meteo.com/v1/forecast?timezone=auto" +
      "&latitude=" + coords.lat + "&longitude=" + coords.lon +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min" +
      (fahrenheit ? "&temperature_unit=fahrenheit" : "");

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
        unidade: cfg.unidade,
        cidade: coords.nome || cfg.cidade || ""
      };
      gravarCache(chave, clima);
      return clima;
    });
  }

  // ===== INTERFACE =====

  var CSS =
    "#weather-card{display:flex;align-items:center;gap:10px;max-width:fit-content;" +
    "margin:0 0 16px 0;padding:8px 14px;border-radius:10px;background:#1e293b;color:#f1f5f9;" +
    "font-family:inherit;font-size:13px;line-height:1.35}" +
    "#weather-card[hidden]{display:none}" +
    "#weather-card .wc-icone{font-size:20px;line-height:1}" +
    "#weather-card .wc-temp{font-weight:bold;font-size:15px}" +
    "#weather-card .wc-local{opacity:.7;font-size:11px}" +
    "#weather-card .wc-config{margin-left:6px;padding:2px 6px;border:0;border-radius:6px;" +
    "background:rgba(255,255,255,.12);color:inherit;font:inherit;font-size:13px;cursor:pointer}" +
    "#weather-card .wc-config:hover{background:rgba(255,255,255,.22)}" +
    "#clima-painel{max-width:320px;margin:-8px 0 16px 0;padding:12px 14px;border-radius:10px;" +
    "background:#1e293b;color:#f1f5f9;font-family:inherit;font-size:13px;line-height:1.5}" +
    "#clima-painel[hidden]{display:none}" +
    "#clima-painel h4{margin:0 0 8px;font-size:13px;font-weight:bold}" +
    "#clima-painel label{display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer}" +
    "#clima-painel input[type=text]{width:100%;margin:2px 0 8px;padding:5px 8px;border:0;" +
    "border-radius:6px;background:rgba(255,255,255,.12);color:inherit;font:inherit}" +
    "#clima-painel .wc-linha{display:flex;gap:14px;margin-bottom:8px}" +
    "#clima-painel .wc-botoes{display:flex;gap:8px;margin-top:10px}" +
    "#clima-painel button{padding:5px 12px;border:0;border-radius:6px;font:inherit;cursor:pointer}" +
    "#clima-painel .wc-salvar{background:#38bdf8;color:#0b1220;font-weight:bold}" +
    "#clima-painel .wc-cancelar{background:rgba(255,255,255,.12);color:inherit}" +
    "@media print{#weather-card,#clima-painel{display:none}}";

  function montarEstilo() {
    if (document.getElementById("clima-estilo")) return;
    var estilo = document.createElement("style");
    estilo.id = "clima-estilo";
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }

  function elemento(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function montarCard() {
    var card = elemento("div", "");
    card.id = "weather-card";
    card.setAttribute("role", "status");
    card.hidden = true;

    var painel = elemento("div", "");
    painel.id = "clima-painel";
    painel.hidden = true;

    var destino = document.getElementById("clima-topo");
    if (destino) {
      destino.appendChild(card);
      destino.appendChild(painel);
    } else {
      // Sem ponto de montagem na página: entra no topo do body.
      document.body.insertBefore(painel, document.body.firstChild);
      document.body.insertBefore(card, document.body.firstChild);
    }
    return { card: card, painel: painel };
  }

  function preencherCard(card, painel, clima) {
    var t = descreverTempo(clima.codigo, clima.ehDia);
    var grau = "°" + (clima.unidade || "C");
    var faixa = (isFinite(clima.minima) && isFinite(clima.maxima))
      ? "mín " + clima.minima + "° · máx " + clima.maxima + "°"
      : "";
    var horario = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    card.textContent = "";
    card.title = t.texto + (faixa ? " · " + faixa : "") +
      " · sensação de " + clima.sensacao + "° · umidade " + clima.umidade +
      "% · atualizado às " + horario;

    card.appendChild(elemento("span", "wc-icone", t.icone));

    var meio = elemento("div", "");
    meio.appendChild(elemento("div", "wc-temp", clima.temperatura + grau));
    meio.appendChild(elemento("div", "wc-local", clima.cidade));
    card.appendChild(meio);

    if (cfg.mostrarConfiguracoes) {
      var botao = elemento("button", "wc-config", "⚙");
      botao.type = "button";
      botao.title = "Configurar o card de clima";
      botao.setAttribute("aria-label", "Configurar o card de clima");
      botao.addEventListener("click", function () { alternarPainel(painel); });
      card.appendChild(botao);
    }

    card.hidden = false;
  }

  // ===== PAINEL DE CONFIGURAÇÃO =====

  function alternarPainel(painel) {
    if (!painel.hidden) { painel.hidden = true; return; }
    montarPainel(painel);
    painel.hidden = false;
  }

  function montarPainel(painel) {
    painel.textContent = "";
    painel.appendChild(elemento("h4", "", "Card de clima"));

    var porDispositivo = opcao("clima-fonte", "dispositivo", "Localização atual do dispositivo",
      cfg.fonte === "dispositivo");
    var porCidade = opcao("clima-fonte", "cidade", "Cidade fixa", cfg.fonte !== "dispositivo");
    painel.appendChild(porDispositivo.rotulo);
    painel.appendChild(porCidade.rotulo);

    var campoCidade = elemento("input", "");
    campoCidade.type = "text";
    campoCidade.value = cfg.cidade || "";
    campoCidade.placeholder = "Ex.: Ribeirão Preto";
    campoCidade.setAttribute("aria-label", "Cidade");
    campoCidade.disabled = cfg.fonte === "dispositivo";
    painel.appendChild(campoCidade);

    porDispositivo.entrada.addEventListener("change", function () { campoCidade.disabled = true; });
    porCidade.entrada.addEventListener("change", function () { campoCidade.disabled = false; });

    var linha = elemento("div", "wc-linha");
    var celsius = opcao("clima-unidade", "C", "°C", cfg.unidade !== "F");
    var fahrenheit = opcao("clima-unidade", "F", "°F", cfg.unidade === "F");
    linha.appendChild(celsius.rotulo);
    linha.appendChild(fahrenheit.rotulo);
    painel.appendChild(linha);

    var botoes = elemento("div", "wc-botoes");
    var salvar = elemento("button", "wc-salvar", "Salvar");
    salvar.type = "button";
    salvar.addEventListener("click", function () {
      var preferencias = {
        fonte: porDispositivo.entrada.checked ? "dispositivo" : "cidade",
        cidade: campoCidade.value.trim() || doArquivo.cidade,
        unidade: fahrenheit.entrada.checked ? "F" : "C"
      };
      gravarPreferencias(preferencias);
      Object.assign(cfg, preferencias);
      painel.hidden = true;
      atualizar(true);
    });

    var cancelar = elemento("button", "wc-cancelar", "Cancelar");
    cancelar.type = "button";
    cancelar.addEventListener("click", function () { painel.hidden = true; });

    botoes.appendChild(salvar);
    botoes.appendChild(cancelar);
    painel.appendChild(botoes);
  }

  function opcao(grupo, valor, texto, marcada) {
    var rotulo = elemento("label", "");
    var entrada = elemento("input", "");
    entrada.type = "radio";
    entrada.name = grupo;
    entrada.value = valor;
    entrada.checked = !!marcada;
    rotulo.appendChild(entrada);
    rotulo.appendChild(document.createTextNode(texto));
    return { rotulo: rotulo, entrada: entrada };
  }

  // ===== CICLO DE VIDA =====

  var elementos;

  function atualizar(limparPosicao) {
    if (limparPosicao) {
      // A pessoa acabou de trocar a fonte: não reaproveita a posição anterior.
      try { localStorage.removeItem("climaPosicao"); } catch (e) {}
    }
    return obterCoordenadas()
      .then(obterClima)
      .then(function (clima) { preencherCard(elementos.card, elementos.painel, clima); })
      .catch(function (erro) {
        elementos.card.hidden = true;
        console.warn("Card de clima indisponível: " + erro.message);
      });
  }

  function iniciar() {
    montarEstilo();
    elementos = montarCard();
    atualizar(false);
    // Páginas que ficam abertas (dashboard) continuam recebendo dados novos.
    setInterval(function () { atualizar(false); }, VALIDADE_CLIMA);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
