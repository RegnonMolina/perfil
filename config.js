/**
 * ============================================================
 *  CONFIGURAÇÃO DO COLÉGIO  (edite apenas este arquivo!)
 * ============================================================
 *
 * Este é o ÚNICO arquivo que cada colégio precisa alterar para
 * colocar a própria identidade no teste, no resultado, no PDF,
 * nos e-mails e no dashboard.
 *
 * Depois de editar, siga o CONFIGURACAO.md para criar a sua
 * planilha + Apps Script e publicar no GitHub Pages.
 */

window.CONFIG_ESCOLA = {

  // Nome da instituição (aparece no cabeçalho, resultado, PDF, e-mail e dashboard)
  nome: "Colégio Mundo do Saber",

  // Frase exibida abaixo do título no cabeçalho do teste
  subtitulo: "Avaliação de Perfil Comportamental",

  // URL da logo (PNG/JPG/SVG, fundo transparente fica melhor).
  // Deixe "" para não exibir logo.
  logoUrl: "",

  // Cores da identidade visual (formato #RRGGBB)
  corPrimaria: "#1f4788",   // cor institucional forte: cabeçalho, títulos
  corSecundaria: "#667eea", // cor de destaque: botões, seleções, barra de progresso

  // URL do App da Web do Google Apps Script (veja CONFIGURACAO.md)
  urlAppsScript: "https://script.google.com/macros/s/AKfycbylnX-qItREgco0fPVlrp70KXjrg5JIzdSjp513TAxZIlykmcd89w7oS8Cns0ZdkEdL/exec",

  // E-mail do gestor que recebe cópia de todos os resultados.
  // Deixe "" para configurar apenas no Apps Script (propriedade EMAIL_GESTOR).
  emailGestor: "",

  // Texto pequeno exibido no rodapé das páginas (deixe "" para ocultar)
  rodape: "",

  // Card de clima exibido no topo das páginas (dados da API gratuita Open-Meteo)
  clima: {
    exibir: true,             // false esconde o card em todas as páginas
    fonte: "dispositivo",     // "dispositivo" = posição atual de quem acessa; "cidade" = a cidade abaixo
    cidade: "Ribeirão Preto", // usada quando fonte é "cidade" e quando o dispositivo não informa a posição
    latitude: null,           // opcional: preencha lat/lon para dispensar a busca pelo nome
    longitude: null,
    unidade: "C",             // "C" (Celsius) ou "F" (Fahrenheit)
    mostrarConfiguracoes: true // false esconde o botão ⚙ do card
  }
};
