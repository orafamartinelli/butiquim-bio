// Butiquim Bio — renderização. Lê CONFIG (config.js) e Rotacao (rotacao.js).
(async function () {
  const raiz = document.getElementById('pagina');
  const FALLBACK = '<p class="fallback">Ops, algo falhou ao carregar. Fale com a gente: <a href="https://instagram.com/obutiquim">@obutiquim</a></p>';
  if (typeof CONFIG === 'undefined' || typeof Rotacao === 'undefined') {
    raiz.innerHTML = FALLBACK;
    return;
  }
  try {

  const debug = Rotacao.parseDebugData(new URLSearchParams(location.search).get('debugData'));
  const agora = debug !== null ? debug : Date.now();

  // Regra de qualificação semanal (Rafa 30/10/2026, ver CONFIG.qualificacao): pergunta à lista quem
  // qualificou pra esta semana. A busca começa agora e só é esperada na hora de montar os promoters.
  // Qualquer falha (rede, timeout, resposta estranha) devolve null → a bio mostra todo mundo.
  async function buscaQualificacao(cfg, agoraDebugMs) {
    if (location.protocol === 'file:') return null; // teste de render local (Playwright), sem rede
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs || 3000);
      const u = new URL(cfg.api);
      if (agoraDebugMs !== null) u.searchParams.set('agora', new Date(agoraDebugMs).toISOString());
      const r = await fetch(u.toString(), { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      console.warn('bio: qualificação indisponível, mostrando todos os promoters', e);
      return null;
    }
  }
  const Q = CONFIG.qualificacao || {};
  const regraLigada = !!Q.ativa && (!Q.valeDesde || agora >= Date.parse(Q.valeDesde));
  const promessaQualificacao = regraLigada ? buscaQualificacao(Q, debug !== null ? agora : null) : Promise.resolve(null);

  const ICONES = {
    tiktok: '<svg viewBox="0 0 24 24"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.76 5.76 0 0 0-.77-.05 5.66 5.66 0 1 0 5.66 5.66V9.01a7.32 7.32 0 0 0 4.28 1.37V7.29a4.28 4.28 0 0 1-3.2-1.47z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.59-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.59 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.2 15.61 2.2 15.23 2.2 12s0-3.59.07-4.85C2.42 3.92 3.94 2.38 7.19 2.23 8.45 2.18 8.83 2.2 12 2.2zm0 3.68a6.12 6.12 0 1 0 0 12.24 6.12 6.12 0 0 0 0-12.24zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.4L6.47 22H3.35l7.24-8.28L2.4 2h6.4l4.42 5.84L18.9 2zm-1.1 18.13h1.73L7.86 3.77H6l11.8 16.36z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M12.04 2a9.9 9.9 0 0 0-8.42 15.17L2.05 22l4.98-1.53A9.9 9.9 0 1 0 12.04 2zm5.77 14.06c-.24.68-1.4 1.3-1.93 1.35-.52.05-1.01.24-3.4-.71-2.87-1.13-4.68-4.06-4.82-4.25-.14-.19-1.15-1.53-1.15-2.92s.73-2.07.99-2.35c.26-.28.56-.35.75-.35l.54.01c.17.01.4-.07.63.48.24.57.8 1.96.87 2.1.07.14.12.31.02.5-.09.19-.14.31-.28.48l-.42.49c-.14.14-.29.29-.12.57.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.61-.07.17-.19.71-.82.89-1.1.19-.28.38-.24.63-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  };

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function botao(url, rotulo, sub, icone) {
    return `<a class="botao" href="${esc(url)}" target="_blank" rel="noopener">
      <span class="icone">${ICONES[icone] || ''}</span>
      <span class="textos"><span class="rotulo">${esc(rotulo)}</span>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</span>
    </a>`;
  }

  let html = `
    <header class="header">
      <img class="logo" src="assets/logo.png" alt="O Butiquim" />
      <h1>${esc(CONFIG.titulo)}</h1>
      <div class="social">${CONFIG.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.icone)}">${ICONES[s.icone] || ''}</a>`).join('')}</div>
    </header>
    <div class="card-destaque"><span class="tag">${esc(CONFIG.destaque.tag)}</span><p>${esc(CONFIG.destaque.texto)}</p></div>`;

  for (const b of CONFIG.blocosTemporarios) {
    if (!Rotacao.blocoVisivel(b, agora)) continue;
    html += `<div class="bloco-temp"><div class="mini">${esc(b.titulo)}</div><div class="sub">${esc(b.subtitulo)}</div>${botao(b.url, b.botao, '', 'star')}</div>`;
  }

  // Listas ANTES dos promoters (Rafa 30/10/2026): o cadastro na lista é o primeiro botão que a pessoa vê.
  html += `<div class="secao-titulo"><div class="mini">${esc(CONFIG.listasTitulo)}</div><div class="grande">${esc(CONFIG.listasSubtitulo)}</div></div>`;
  html += `<div class="grupo-listas">`;
  // Lista pode ter janela de data (visivelDe/visivelAte), igual aos blocos temporários — é como
  // entram as noites avulsas (véspera de feriado etc.) sem ninguém precisar lembrar de tirar
  // depois. Lista SEM data continua aparecendo sempre (Rafa 04/11/2026).
  for (const l of CONFIG.listas) {
    if (!Rotacao.blocoVisivel(l, agora)) continue;
    html += botao(l.url, l.rotulo, l.sub, 'star');
  }
  html += `</div>`;

  const dadosQualificacao = await promessaQualificacao;
  const elegiveis = Rotacao.filtraQualificados(CONFIG.promoters.filter((p) => p.telefone), dadosQualificacao, agora, Q);
  if (regraLigada) console.info('bio: qualificação da semana', { corte: new Date(Rotacao.corteSemana(agora)).toISOString(), dados: dadosQualificacao, mostrando: elegiveis.map((p) => p.slug || p.nome) });
  const rotacionados = Rotacao.ordemRotacao(elegiveis, agora);
  if (rotacionados.length) {
    html += `<div class="secao-titulo"><div class="mini">${esc(CONFIG.promotersTitulo)}</div><div class="grande">${esc(CONFIG.promotersSubtitulo)}</div></div>`;
    html += `<section id="promoters">`;
    for (const p of rotacionados) {
      const primeiroNome = p.nome.split(' ')[0];
      const msg = encodeURIComponent(CONFIG.mensagemPromoter.replace('{nome}', primeiroNome));
      html += botao(`https://wa.me/${p.telefone}?text=${msg}`, p.nome, 'Chama no WhatsApp', 'whatsapp');
    }
    html += `</section>`;
  }

  const fotos = CONFIG.carrossel || [];
  if (fotos.length) {
    html += `<div class="secao-titulo secao-titulo--carrossel"><div class="mini">${esc(CONFIG.carrosselTitulo || 'FOTOS')}</div><div class="grande">${esc(CONFIG.carrosselSubtitulo || '')}</div></div>`;
    html += `<div class="carrossel-fotos" id="carrossel-fotos"><div class="carrossel-track" id="carrossel-track"></div></div>`;
  }

  html += `<div class="secao-titulo"><div class="mini">${esc(CONFIG.linksUteisTitulo)}</div><div class="grande">${esc(CONFIG.linksUteisSubtitulo)}</div></div>`;
  for (const u of CONFIG.linksUteis) html += botao(u.url, u.rotulo, u.sub, u.icone);

  for (const o of CONFIG.outros) html += botao(o.url, o.rotulo, o.sub, o.icone);

  raiz.innerHTML = html;

  // Carrossel roda sozinho (CSS animation), sem fim — dobra a lista pra fazer o loop
  // ficar contínuo (na metade do percurso já é a mesma foto de novo, sem soluço).
  // Respeita prefers-reduced-motion: sem duplicar e sem animação, vira rolagem manual.
  if (fotos.length) {
    const track = document.getElementById('carrossel-track');
    const itemHtml = (f, i) => `<div class="carrossel-item"><img src="${esc(f.img)}" alt="${esc(f.legenda || 'Foto ' + (i + 1) + ' — O Butiquim')}" loading="lazy" /></div>`;
    const reduzMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzMovimento) {
      track.innerHTML = fotos.map(itemHtml).join('');
      document.getElementById('carrossel-fotos').classList.add('estatico');
    } else {
      track.innerHTML = fotos.map(itemHtml).join('') + fotos.map(itemHtml).join('');
      track.style.animationDuration = Math.max(13, fotos.length * 2.8) + 's';
    }

    // "#NãoTemErro!" escreve sozinho quando entra na tela (loop depois disso).
    // IMPORTANTE: observa o CONTÊINER (sem clip-path), não o próprio texto — o texto
    // nasce 100% cortado (clip-path) pra animação, e um alvo com área visível zero
    // nunca reporta interseção em alguns navegadores (bug real: sumia no desktop).
    const tituloWrap = document.querySelector('.secao-titulo--carrossel');
    const tituloCarrossel = tituloWrap ? tituloWrap.querySelector('.grande') : null;
    if (tituloWrap && tituloCarrossel && !reduzMovimento) {
      const obsTitulo = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            tituloCarrossel.classList.add('escrever');
            obsTitulo.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      obsTitulo.observe(tituloWrap);
    }
  }
  } catch (e) {
    // config.js é editado à mão: se faltar uma chave, mostra o fallback em vez de página em branco.
    console.error(e);
    raiz.innerHTML = FALLBACK;
  }
})();
