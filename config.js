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
