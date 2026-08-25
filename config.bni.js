/**
 * ============================================================
 *  CONFIGURAÇÃO — EXEMPLO PARA GRUPO DE NETWORKING (BNI)
 * ============================================================
 *
 * Este arquivo é um MODELO. Para usar em um segundo site (o do grupo de
 * networking), copie o repositório e renomeie este arquivo para config.js,
 * ou troque a linha <script src="config.js"> do index.html e do dashboard.html
 * para apontar para cá.
 *
 * O que muda de um cliente para o outro: nome, cores, URL do Apps Script e o
 * bloco "contexto". As perguntas do teste NÃO mudam — é isso que permite
 * comparar resultados entre grupos diferentes.
 */

window.CONFIG_ESCOLA = {

  nome: "BNI",

  subtitulo: "Perfil Comportamental dos Membros",

  logoUrl: "",

  // Ícone da aba do navegador (favicon): cole aqui a URL pública da logo do
  // BNI (PNG/SVG quadrado fica melhor). Vazio = emojis padrão (🧠 e 📊).
  faviconUrl: "",

  corPrimaria: "#c8102e",
  corSecundaria: "#e04b60",

  // Cada organização tem a SUA planilha e o SEU Apps Script.
  // Cole aqui a URL do App da Web do grupo (veja CONFIGURACAO.md).
  urlAppsScript: "",

  emailGestor: "",

  rodape: "",

  contexto: {
    tipoOrganizacao: "um grupo de networking de negócios",
    termoPessoa: "membro",
    termoLider: "líder do capítulo",
    termoGrupo: "Categoria profissional",
    descricaoAmbiente: "as reuniões semanais, as apresentações e as reuniões um a um entre membros",
    opcoesGrupo: [
      "Advocacia",
      "Arquitetura e Engenharia",
      "Consultoria",
      "Contabilidade",
      "Educação",
      "Finanças e Seguros",
      "Imobiliário",
      "Marketing e Publicidade",
      "Saúde e Bem-estar",
      "Serviços",
      "Tecnologia",
      "Varejo",
      "Outro"
    ]
  }
};
