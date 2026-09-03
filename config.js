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
    // fixoNoFinal: true = não entra no giro semanal, fica sempre no fim da lista.
    promoters: [
      { nome: 'Luana Bido', telefone: '554498766957', ativo: true },
      { nome: 'Mari', telefone: '554497077075', ativo: true },
      { nome: 'Maria Julia', telefone: '554498708463', ativo: true },
      { nome: 'Medina', telefone: '554491055861', ativo: true },
      { nome: 'Gabriel', telefone: '554491749173', ativo: true, fixoNoFinal: true },
    ],
    promotersTitulo: 'FALE COM UM PROMOTER 👇',
    promotersSubtitulo: 'Reserve a sua mesa!',
    mensagemPromoter: 'Oi {nome}! Vim pela bio do Butiquim 🍺',

    // Blocos temporários — somem sozinhos fora da janela (datas em -03:00).
    blocosTemporarios: [
      {
        // 🎂 PROMO ANIVERSARIANTE — OCULTO até validar (pedido Rafa 02/08).
        // PARA ATIVAR: troque visivelDe pra data de hoje. O texto do botão abre o
        // WhatsApp oficial 0906 (Prontto.AI, Kim v2) com a frase de contexto do niver.
        // Trocado de 3142-4595 (NicoChat) pra 3170-0906 em 03/09/2026; a Kim v2
        // entende a frase por contexto, sem keyword.
        id: 'aniversariante',
        visivelDe: '2026-08-03T00:00:00-03:00',
        visivelAte: '2026-12-31T23:59:00-03:00',
        titulo: 'ANIVERSARIANTE DO MÊS? 🎂',
        subtitulo: 'Kit garantido + brindes pela sua turma. Vale o mês inteiro!',
        botao: 'QUERO MINHA PROMO 🎁',
        url: 'https://wa.me/554431700906?text=Quero%20minha%20promo%20de%20aniversariante%20%F0%9F%8E%82',
      },
      {
        id: 'copa',
        visivelDe: '2026-06-30T00:00:00-03:00',
        visivelAte: '2026-07-06T05:00:00-03:00',
        titulo: 'JOGOS DA COPA DO MUNDO NO BUTIQUIM!',
        subtitulo: 'Open Bar de Chopp + Vodka + Telão e 03 tvs. Ingressos antecipados!',
        botao: '05/07 Domingo 15h — BRASIL X Noruega · Compre seu ingresso 🎫',
        url: 'https://www.ingressonacional.com.br/evento/34467/arenaobutiquimoitavasdefinalopenvodkaopenchopp',
      },
    ],

    listasTitulo: 'CADASTRE-SE NA LISTA DO DIA 👇',
    listasSubtitulo: 'Garanta seu desconto!',
    listas: [
      { rotulo: 'LISTA DE SEXTA', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sexta-feira/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SextaOrganico' },
      { rotulo: 'LISTA DE SÁBADO', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sabado/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SabadoOrganico' },
      { rotulo: 'LISTA DE DOMINGO', sub: 'Garanta seu desconto', url: 'https://www.obutiquim.com.br/domingo/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=DomingoOrganico' },
    ],

    // Carrossel de fotos — rola sozinho, sem fim, logo abaixo das listas (pedido do
    // Rafa 30/07). Pra trocar/adicionar fotos: solte o arquivo em assets/carrossel/
    // e adicione a linha aqui (`legenda` é opcional).
    carrosselTitulo: 'BASTIDORES 📸',
    carrosselSubtitulo: '#NãoTemErro!',
    carrossel: [
      { img: 'assets/carrossel/1.jpg' },
      { img: 'assets/carrossel/2.jpg' },
      { img: 'assets/carrossel/3.jpg' },
      { img: 'assets/carrossel/4.jpg' },
      { img: 'assets/carrossel/5.jpg' },
      { img: 'assets/carrossel/6.jpg' },
      { img: 'assets/carrossel/7.jpg' },
      { img: 'assets/carrossel/8.jpg' },
      { img: 'assets/carrossel/9.jpg' },
      { img: 'assets/carrossel/10.jpg' },
      { img: 'assets/carrossel/11.jpg' },
      { img: 'assets/carrossel/12.jpg' },
      { img: 'assets/carrossel/13.jpg' },
    ],

    linksUteisTitulo: 'LINKS ÚTEIS 👇',
    linksUteisSubtitulo: 'Para facilitar sua vida!',
    linksUteis: [
      { rotulo: '💼 Trabalhe Conosco', sub: 'Candidate-se aqui', url: 'https://orafamartinelli.com.br/qg/f/trabalhe-conosco/', icone: 'star' },
      { rotulo: '🎉 Seja nosso Promoter', sub: 'Candidate-se aqui', url: 'https://orafamartinelli.com.br/qg/f/vagas-de-promoter/', icone: 'star' },
      { rotulo: 'Cardápio 🍺', sub: '', url: 'https://drive.google.com/file/d/1AkwMqIjLH_gcTKWuq96oDVP0RCGZabe8/view?usp=sharing', icone: 'star' },
      { rotulo: 'Cardápio de Drinks 🍹', sub: '', url: 'https://drive.google.com/file/d/1rJ-2RU4TsByUunz-JG_6L12d90WC1plU/view?usp=sharing', icone: 'star' },
      { rotulo: '📍 Nosso Endereço', sub: 'Clique e deixe o GPS te trazer!', url: 'https://goo.gl/maps/244NjK7F7C6eKkhs5', icone: 'star' },
      { rotulo: 'Achados e Perdidos', sub: '🕔 Atendimento: Seg a Sexta, 9h-12h / 14h-16h', url: 'https://api.whatsapp.com/send?phone=554498006859&text=Ol%C3%A1,%20gostaria%20de%20saber%20sobre%20achados%20e%20perdidos', icone: 'whatsapp' },
      { rotulo: '⭐ Avalie O Butiquim', sub: 'Deixe sua avaliação no Google!', url: 'https://bit.ly/AVALIACAOGOOGLE', icone: 'star' },
    ],

    // vazio de propósito: o link antigo de promoter (Google Forms) foi substituído
    // pelo botão "Seja nosso Promoter" em linksUteis (formulário nativo do QG, 29/07).
    outros: [],
  };
});
