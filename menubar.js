/**
 * ============================================================
 *  BARRA SUPERIOR  —  navegação entre os sistemas da organização
 * ============================================================
 *
 * Porta para estas páginas a mesma barra de menu que os web apps
 * do Apps Script já usam no topo (a ".menubar" do ROI BNI, herdada
 * do Hub CMS + BNI). Mesmas medidas, mesmas cores, mesmo
 * comportamento: clique abre, passar o mouse troca entre menus já
 * abertos, clique fora ou Esc fecha.
 *
 * Arquivo único, sem dependência externa, igual a clima.js e
 * relogio.js — serve tanto às páginas do GitHub Pages quanto a um
 * <script> colado dentro de um web app do Apps Script.
 *
 * ⚠️ NASCE DESLIGADA, DE PROPÓSITO.
 * Este repositório é white-label: outras escolas o clonam. Os links
 * dos sistemas internos do CMS não podem vir embutidos no código —
 * eles ficam no config.js de cada organização. Sem o bloco "menubar"
 * lá, nenhuma barra é montada e a página fica exatamente como era.
 *
 * Configuração em config.js:
 *
 *   window.CONFIG_ESCOLA = {
 *     menubar: {
 *       exibir: true,
 *       titulo: "Sistema CMS + BNI",
 *       logoUrl: "https://.../logo.png",   // "" esconde a imagem
 *       grupos: [
 *         { nome: "CMS", itens: [
 *             { nome: "Cobranças", icone: "💰", url: "https://..." }
 *         ]}
 *       ]
 *     }
 *   };
 *
 * A página pode marcar em qual sistema o visitante está, para o item
 * aparecer como "(atual)" e sem link:
 *
 *   <script>window.MENUBAR_ATUAL = "Perfil Comportamental";</script>
 */
(function () {
  "use strict";

  var cfg = (window.CONFIG_ESCOLA || {}).menubar || {};
  var ALTURA = 52;

  // Mesmas cores da .menubar do ROI BNI (App.html). Ficam aqui, fixas, em
  // vez de virem de variáveis CSS: cada página deste repositório tem o seu
  // próprio conjunto de tokens (o formulário usa --cor-primaria, o
  // dashboard usa --primary), e a barra precisa sair idêntica nas duas.
  var CSS =
    "#cms-menubar{position:fixed;top:0;left:0;right:0;z-index:300;" +
    "display:flex;align-items:center;gap:4px;height:" + ALTURA + "px;padding:0 14px;" +
    "background:#FFFFFF;border-bottom:1px solid #E5E7EB;color:#1A1A2E;" +
    "font-family:'Inter','Segoe UI',Tahoma,sans-serif;box-sizing:border-box}" +
    "#cms-menubar *{box-sizing:border-box}" +

    "#cms-menubar .mb-brand{display:flex;align-items:center;gap:10px;padding-right:14px;" +
    "margin-right:6px;border-right:1px solid #E5E7EB}" +
    "#cms-menubar .mb-brand img{height:26px;width:auto;display:block}" +
    "#cms-menubar .mb-brand .mb-titulo{font-weight:650;font-size:15px;white-space:nowrap}" +

    "#cms-menubar .mb-menus{display:flex;align-items:center;gap:2px;position:relative}" +
    "#cms-menubar .mb-menu{position:relative}" +
    "#cms-menubar .mb-btn{display:flex;align-items:center;gap:6px;border:none;background:transparent;" +
    "color:#1A1A2E;padding:8px 14px;border-radius:7px;cursor:pointer;font-family:inherit;" +
    "font-size:13.5px;font-weight:600}" +
    "#cms-menubar .mb-btn:hover{background:#FFEBEE}" +
    "#cms-menubar .mb-menu.aberto .mb-btn{background:#FFEBEE;color:#8E1A1A}" +
    "#cms-menubar .mb-btn .mb-chev{font-size:10px;opacity:.65;transition:transform .12s ease}" +
    "#cms-menubar .mb-menu.aberto .mb-btn .mb-chev{transform:rotate(180deg)}" +

    "#cms-menubar .mb-dropdown{display:none;position:absolute;top:calc(100% + 6px);left:0;" +
    "min-width:260px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:10px;" +
    "border-top:3px solid #C62828;box-shadow:0 2px 8px rgba(0,0,0,.10);padding:6px;z-index:30}" +
    "#cms-menubar .mb-menu.aberto .mb-dropdown{display:block}" +

    "#cms-menubar .mb-item{display:flex;align-items:center;gap:10px;padding:9px 12px;" +
    "border-radius:7px;border:none;background:transparent;width:100%;text-align:left;" +
    "color:#1A1A2E;text-decoration:none;font-size:13.5px;font-weight:500;cursor:pointer}" +
    "#cms-menubar a.mb-item:hover{background:#FFEBEE}" +
    "#cms-menubar .mb-item.mb-atual{color:#6B7280;cursor:default}" +
    "#cms-menubar .mb-item .mb-icone{font-size:16px;line-height:1}" +

    "#cms-menubar .mb-right{margin-left:auto;display:flex;align-items:center;gap:14px}" +

    // ── Clima e relógio dentro da barra ──
    // Os dois cards se montam sozinhos no #clima-topo (clima.js e
    // relogio.js). A barra passa a HOSPEDAR esse ponto de montagem, então
    // eles entram aqui sem que nenhum dos dois arquivos precise mudar.
    // O que muda é só a aparência: dentro de uma barra branca de 52px eles
    // não podem ser as pílulas escuras que são no corpo da página.
    "#cms-menubar #clima-topo{display:flex;align-items:center;gap:10px;" +
    "max-width:none;margin:0;flex-wrap:nowrap}" +
    "#cms-menubar #weather-card{margin:0;padding:0;background:transparent;color:#1A1A2E;" +
    "gap:7px;font-size:12px;border-radius:0}" +
    "#cms-menubar #weather-card .wc-icone{font-size:17px}" +
    "#cms-menubar #weather-card .wc-temp{font-size:13px}" +
    "#cms-menubar #weather-card .wc-local{font-size:10.5px;color:#6B7280;opacity:1}" +
    "#cms-menubar #weather-card .wc-config{background:#F0F2F5;color:#6B7280;font-size:11px}" +
    "#cms-menubar #flip-clock{margin:0;padding:0;background:transparent;color:#1A1A2E;gap:9px}" +
    "#cms-menubar #flip-clock .fc-digito{width:16px;height:24px;font-size:16px;line-height:24px}" +
    "#cms-menubar #flip-clock .fc-baixo span,#cms-menubar #flip-clock .fc-aba-baixo span" +
    "{margin-top:-12px}" +
    "#cms-menubar #flip-clock .fc-sep{font-size:13px}" +
    "#cms-menubar #flip-clock .fc-dia,#cms-menubar #flip-clock .fc-data" +
    "{font-size:10.5px;color:#6B7280;opacity:1}" +
    // Numa barra estreita, some primeiro a data, depois o clima.
    "@media (max-width:1000px){#cms-menubar #flip-clock .fc-info{display:none}}" +
    "@media (max-width:820px){#cms-menubar #weather-card{display:none}}" +
    "#cms-menubar .mb-quem{font-size:12px;color:#6B7280;white-space:nowrap;display:flex;" +
    "align-items:center;gap:7px}" +
    "#cms-menubar .mb-avatar{width:20px;height:20px;border-radius:50%;object-fit:cover;" +
    "display:block;flex:0 0 auto}" +

    "@media (max-width:720px){#cms-menubar .mb-brand .mb-titulo{display:none}" +
    "#cms-menubar .mb-quem{display:none}}" +
    "@media print{#cms-menubar{display:none}}";

  function montarEstilo() {
    if (document.getElementById("menubar-estilo")) return;
    var estilo = document.createElement("style");
    estilo.id = "menubar-estilo";
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
   * Monta os itens de um grupo. O sistema em que a pessoa já está vira
   * texto sem link, marcado "(atual)" — mesmo comportamento do ROI BNI.
   * @param {object[]} itens - Lista { nome, icone, url }
   * @param {string} atual - Nome do sistema atual ("" se nenhum)
   * @return {HTMLElement} Dropdown preenchido
   */
  function montarDropdown(itens, atual) {
    var drop = elemento("div", "mb-dropdown");
    itens.forEach(function (s) {
      if (!s || !s.nome) return;
      var icone = elemento("span", "mb-icone", s.icone || "•");
      if (s.nome === atual) {
        var span = elemento("span", "mb-item mb-atual");
        span.appendChild(icone);
        span.appendChild(document.createTextNode(s.nome + " (atual)"));
        drop.appendChild(span);
        return;
      }
      // href via setAttribute com a URL vinda da configuração da própria
      // organização; nada aqui vem da URL da página ou de entrada de usuário.
      var a = elemento("a", "mb-item");
      a.setAttribute("href", String(s.url || "#"));
      a.appendChild(icone);
      a.appendChild(document.createTextNode(s.nome));
      drop.appendChild(a);
    });
    return drop;
  }

  /**
   * Liga o comportamento de menu: clique abre/fecha, hover troca entre
   * menus já abertos, clique fora ou Esc fecha tudo.
   * @param {HTMLElement} barra - Elemento da barra
   */
  function ligarInteracao(barra) {
    var menus = Array.prototype.slice.call(barra.querySelectorAll(".mb-menu"));
    var algumAberto = false;

    function fecharTodos() {
      menus.forEach(function (m) { m.classList.remove("aberto"); });
      algumAberto = false;
    }
    function abrir(menu) {
      menus.forEach(function (m) { m.classList.toggle("aberto", m === menu); });
      algumAberto = true;
    }

    menus.forEach(function (menu) {
      var btn = menu.querySelector(".mb-btn");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (menu.classList.contains("aberto")) { fecharTodos(); } else { abrir(menu); }
      });
      menu.addEventListener("mouseenter", function () {
        if (algumAberto && !menu.classList.contains("aberto")) abrir(menu);
      });
    });

    document.addEventListener("click", fecharTodos);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") fecharTodos();
    });
  }

  /**
   * Empurra a página para baixo da barra fixa, somando à distância que a
   * página já tinha. Barra fixa (e não sticky) porque o padding do body
   * muda de página para página — no formulário são 20px, no dashboard
   * zero — e sticky deixaria uma faixa vazia acima em uma delas.
   */
  function compensarAltura() {
    var atual = parseFloat(window.getComputedStyle(document.body).paddingTop) || 0;
    document.body.style.paddingTop = (atual + ALTURA) + "px";
  }

  function iniciar() {
    if (cfg.exibir === false) return;
    var grupos = cfg.grupos || [];
    if (!grupos.length) return;              // sem sistemas configurados: sem barra
    if (document.getElementById("cms-menubar")) return;

    montarEstilo();
    var atual = window.MENUBAR_ATUAL || cfg.sistemaAtual || "";

    var barra = elemento("div", "");
    barra.id = "cms-menubar";

    var brand = elemento("div", "mb-brand");
    if (cfg.logoUrl) {
      var img = elemento("img", "");
      img.setAttribute("src", String(cfg.logoUrl));
      // alt vazio de propósito: o título ao lado já nomeia a marca, e um
      // alt preenchido duplicaria o texto quando a imagem não carregasse.
      img.setAttribute("alt", "");
      brand.appendChild(img);
    }
    if (cfg.titulo) brand.appendChild(elemento("span", "mb-titulo", cfg.titulo));
    barra.appendChild(brand);

    var nav = elemento("nav", "mb-menus");
    grupos.forEach(function (g) {
      if (!g || !g.nome || !(g.itens || []).length) return;
      var menu = elemento("div", "mb-menu");
      var btn = elemento("button", "mb-btn");
      btn.setAttribute("type", "button");
      btn.appendChild(document.createTextNode(g.nome + " "));
      btn.appendChild(elemento("span", "mb-chev", "▾"));
      menu.appendChild(btn);
      menu.appendChild(montarDropdown(g.itens, atual));
      nav.appendChild(menu);
    });
    barra.appendChild(nav);

    // Área de widgets: clima + relógio. Se a página já tem um #clima-topo,
    // ele é MOVIDO para cá (com o que já estiver dentro) em vez de duplicado;
    // se não tem, a barra cria o ponto de montagem. Nos dois casos clima.js e
    // relogio.js encontram o mesmo #clima-topo de sempre e nada muda neles.
    var right = elemento("div", "mb-right");
    var topo = document.getElementById("clima-topo");
    if (!topo) {
      topo = elemento("div", "");
      topo.id = "clima-topo";
    }
    right.appendChild(topo);
    barra.appendChild(right);

    // Bloco de usuário: nestas páginas não há login do Google, então ele só
    // aparece se a organização informar o nome por configuração. Nos web
    // apps do Apps Script quem preenche é o servidor (<?= usuario ?>).
    if (cfg.usuario) {
      var quem = elemento("div", "mb-quem");
      if (cfg.fotoUsuario) {
        var av = elemento("img", "mb-avatar");
        av.setAttribute("src", String(cfg.fotoUsuario));
        av.setAttribute("alt", "");
        quem.appendChild(av);
      } else {
        quem.appendChild(document.createTextNode("👤"));
      }
      quem.appendChild(document.createTextNode(" " + cfg.usuario));
      right.appendChild(quem);
    }

    document.body.insertBefore(barra, document.body.firstChild);
    compensarAltura();
    ligarInteracao(barra);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
