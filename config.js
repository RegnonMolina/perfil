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

  // Ícone da aba do navegador (favicon), separado da logo.
  // Deixe "" para usar os emojis padrão: 🧠 no formulário, 📊 no dashboard.
  faviconUrl: "",

  // Cores da identidade visual (formato #RRGGBB)
  corPrimaria: "#1f4788",   // cor institucional forte: cabeçalho, títulos
  corSecundaria: "#667eea", // cor de destaque: botões, seleções, barra de progresso

  // URL do App da Web do Google Apps Script (veja CONFIGURACAO.md)
  urlAppsScript: "https://script.google.com/macros/s/AKfycbw93nCoG-IfMQCdLBtLsb60SZvT3ClZBeE6Lkm-yjBMq6EujKHXaeHrsgwERIolakSUCw/exec",

  // E-mail do gestor que recebe cópia de todos os resultados.
  // Deixe "" para configurar apenas no Apps Script (propriedade EMAIL_GESTOR).
  emailGestor: "",

  // Texto pequeno exibido no rodapé das páginas (deixe "" para ocultar)
  rodape: "",

  // ----------------------------------------------------------
  //  BARRA SUPERIOR (navegação entre os sistemas da organização)
  // ----------------------------------------------------------
  // Mesma barra que os web apps do Apps Script já têm no topo.
  // OUTRAS ESCOLAS: troque os grupos pelos seus próprios sistemas, ou
  // apague o bloco inteiro / use exibir:false — sem ele nenhuma barra
  // é montada e as páginas ficam como eram.
  menubar: {
    exibir: true,
    titulo: "Sistema CMS + BNI",
    logoUrl: "https://colegiomundodosaber.com.br/wp-content/uploads/2024/11/Logo-Oficial-2048x1003.png",
    grupos: [
      {
        nome: "CMS",
        itens: [
          { nome: "Avisos de Vencimento",  icone: "🔔", url: "https://script.google.com/macros/s/AKfycbz7yppFxWfd62Bikg3Klmp4IDIc64RSooU5mdDsB4xx6kxaXtmOFNUlWVw9OCupWgZScw/exec" },
          { nome: "B.I. Financeiro",       icone: "📊", url: "https://script.google.com/macros/s/AKfycbwf8KMNha-zaEc_H5Km8It6MxrFEsDyU6TF8jhNPxPbG3VjU1jJ_pcknQ5AxHvBqm0/exec" },
          { nome: "Busca de Currículos",   icone: "📄", url: "https://script.google.com/a/macros/colegiomundodosaber.com.br/s/AKfycbwKD_EAWUCQQFSN0jxEFW9IeTn8FPtOAbou_dSlx56TJZRJIa71eOU_vvme30yXQmTi1w/exec" },
          { nome: "Cobranças",             icone: "💰", url: "https://script.google.com/macros/s/AKfycbwZfLC7aH02yrnuWK9jUw9BhrczGNU4Yy90yKH0pU3jKG-bA2mXumHwuBSVYQ0MlEcmeg/exec" },
          { nome: "Perfil Comportamental", icone: "🧭", url: "https://script.google.com/macros/s/AKfycbzBk6TW3cmioqepgvotL1Dnici_sCbY_yu9WagNaHIgCuhizwtSV-qJwBiS-6wzA6A/exec" },
          { nome: "Rematrículas",          icone: "🎓", url: "https://script.google.com/a/macros/colegiomundodosaber.com.br/s/AKfycbzs3_XV5Wrj9rs_DKG350ppiZl3KotQ8QPgpJZmm_rsBM5biAcsdaW73X9aZ76bkL3xrQ/exec" }
        ]
      },
      {
        nome: "BNI",
        itens: [
          { nome: "BNI Imperador", icone: "🤝", url: "https://script.google.com/macros/s/AKfycbza1ISrbDAYV9Z5IdyhDDzHKk_PFksb38OWJUgaP0FGhEi6szb5skrxretO2CFTd-85lQ/exec" },
          { nome: "ROI BNI",       icone: "📊", url: "https://script.google.com/macros/s/AKfycbyvRHnTr5p9DP5FWI7CohXPTJYJT7SgvAVnyI11VwGioLsfievqpfwsdhPtF9iZXbHbug/exec" }
        ]
      },
      {
        nome: "Ferramentas",
        itens: [
          { nome: "Controle de Acesso", icone: "🔐", url: "https://script.google.com/a/macros/colegiomundodosaber.com.br/s/AKfycbzHRwDKNKrUzz8oH4GcO6m4uzfPZerXEm67U6PTMcy_FR5n6fz0KzBFfJ53BPxVeSCjJA/exec" }
        ]
      }
    ]
  },

  // Card de clima exibido no topo das páginas (dados da API gratuita Open-Meteo)
  clima: {
    exibir: true,             // false esconde o card em todas as páginas
    fonte: "dispositivo",     // "dispositivo" = posição atual de quem acessa; "cidade" = a cidade abaixo
    cidade: "Ribeirão Preto", // usada quando fonte é "cidade" e quando o dispositivo não informa a posição
    latitude: null,           // opcional: preencha lat/lon para dispensar a busca pelo nome
    longitude: null,
    unidade: "C",             // "C" (Celsius) ou "F" (Fahrenheit)
    mostrarConfiguracoes: true // false esconde o botão ⚙ do card
  },

  // ----------------------------------------------------------
  //  VOCABULÁRIO DA ORGANIZAÇÃO
  // ----------------------------------------------------------
  //
  // É daqui que saem as palavras usadas na tela e, principalmente, na análise
  // gerada pela IA. Antes da v2.0 esse vocabulário estava fixo no código do
  // Apps Script ("colaborador de uma escola", "ambiente escolar", "gestor"),
  // o que obrigava a manter uma cópia separada do backend para cada cliente.
  //
  // Os ITENS do questionário continuam iguais para todo mundo, de propósito:
  // mudar o texto das perguntas por cliente tornaria os resultados
  // incomparáveis entre si. O que muda por aqui é só a linguagem da análise.
  //
  // Para outro tipo de organização, veja o exemplo pronto em config.bni.js.
  contexto: {
    // Como a organização é descrita para a IA ("uma escola", "um grupo de
    // networking", "uma clínica"...). Entra em frases, então use o artigo.
    tipoOrganizacao: "uma escola",

    // Como se chama quem responde ao teste.
    termoPessoa: "colaborador",

    // Como se chama quem recebe a cópia do resultado e lidera a pessoa.
    termoLider: "gestor",

    // Rótulo do campo de agrupamento na tela de identificação.
    termoGrupo: "Setor",

    // Descrição do ambiente, usada pela IA para dar exemplos concretos.
    descricaoAmbiente: "o dia a dia escolar",

    // Opções do campo de agrupamento.
    opcoesGrupo: [
      "Administrativo",
      "Comercial",
      "Coordenação",
      "Auxiliar de sala",
      "Professor(a)",
      "Cozinha",
      "Limpeza",
      "Segurança",
      "Externo (Consultor, Amigo, Parente)"
    ]
  },

  // ----------------------------------------------------------
  //  PRIVACIDADE (LGPD)
  // ----------------------------------------------------------
  //
  // O texto abaixo monta o aviso que a pessoa lê e aceita ANTES de começar o
  // teste. O aceite é obrigatório: o Apps Script recusa qualquer envio sem ele.
  //
  // Preencha com dados reais da sua organização — este é um texto informativo,
  // não uma peça jurídica pronta. Se houver dúvida sobre a base legal aplicável
  // ao seu caso, vale passar por quem cuida do jurídico antes de publicar.
  privacidade: {
    // Quem é responsável pelos dados (o "controlador", na linguagem da LGPD).
    controlador: "Colégio Mundo do Saber",

    // Para que os dados são usados. Seja específico e honesto.
    finalidade: "conhecer melhor o perfil de cada pessoa da equipe e apoiar o " +
      "desenvolvimento profissional e a comunicação no dia a dia",

    // Quem vê o resultado além da própria pessoa.
    quemAcessa: "a própria pessoa e a coordenação responsável",

    // Por quanto tempo os dados ficam guardados.
    retencao: "enquanto durar o vínculo com a instituição, ou até que a pessoa peça a exclusão",

    // Canal para dúvidas, correção ou exclusão dos dados.
    contato: "regnon@colegiomundodosaber.com.br",

    // Link opcional para uma política de privacidade completa. "" para ocultar.
    urlPolitica: ""
  }
};
