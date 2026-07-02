// Butiquim Bio — TODO o conteúdo editável vive aqui.
// Editar + `npm run deploy` = mudança no ar em ~1 min.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.CONFIG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    titulo: 'O Butiquim - Maringá/PR',
    destaque: { tag: '#NÃOTEMERRO ✅', texto: '19 anos criando histórias e colocando a culpa no ar condicionado!' },

    social: [
      { icone: 'tiktok', url: 'https://bit.ly/TIKTOKBUTICA' },
      { icone: 'instagram', url: 'https://instagram.com/obutiquim' },
      { icone: 'x', url: 'https://twitter.com/obutiquim' },
      { icone: 'facebook', url: 'https://facebook.com/obutiquim' },
    ],

    // telefone: E.164 sem "+" (ex: "5544984232574"). Vazio = fora da rotação.
    promoters: [
      { nome: 'Gabriel', telefone: '554491749173', ativo: true },
      { nome: 'Luana Bido', telefone: '554498766957', ativo: true },
      { nome: 'Mari', telefone: '554497077075', ativo: true },
      { nome: 'Maria Julia', telefone: '554498708463', ativo: true },
      { nome: 'Nicolly', telefone: '554488274796', ativo: true },
    ],
    promotersTitulo: 'FALE COM UM PROMOTER 👇',
    promotersSubtitulo: 'Desconto e lista VIP direto com o time!',
    mensagemPromoter: 'Oi {nome}! Vim pela bio do Butiquim 🍺',

    // Blocos temporários — somem sozinhos fora da janela (datas em -03:00).
    blocosTemporarios: [
      {
        id: 'copa',
        visivelDe: '2026-06-30T00:00:00-03:00',
        visivelAte: '2026-07-06T05:00:00-03:00',
        titulo: 'JOGOS DA COPA DO MUNDO NO BUTIQUIM!',
        subtitulo: 'Open Bar de Chopp + Vodka + Telão e 03 tvs. Ingressos antecipados!',
        botao: '05/07 Domingo 15h — BRASIL X Noruega · Abrimos 19h30',
        url: 'https://www.ingressonacional.com.br/evento/34467/arenaobutiquimoitavasdefinalopenvodkaopenchopp',
      },
    ],

    listas: [
      { rotulo: 'LISTA DE SEXTA', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sexta-feira/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SextaOrganico' },
      { rotulo: 'LISTA DE SÁBADO', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sabado/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SabadoOrganico' },
      { rotulo: 'LISTA DE DOMINGO', sub: 'Garanta seu desconto', url: 'https://www.obutiquim.com.br/domingo/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=DomingoOrganico' },
    ],

    outros: [
      { rotulo: 'Reservas de Mesas', sub: 'Clique aqui', url: 'https://split.to/ReservasBioButiquim', icone: 'whatsapp' },
      { rotulo: 'Seja promoter! Queremos você!', sub: '', url: 'https://forms.gle/vn1Ypk3VLekEuwCU9', icone: 'star' },
    ],
  };
});
