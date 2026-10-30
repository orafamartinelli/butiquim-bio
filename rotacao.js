// Butiquim Bio — lógica de rotação semanal e visibilidade de blocos.
// Pura (sem DOM) para ser testável em Node. Datas sempre ancoradas em -03:00
// (Maringá/America-Sao_Paulo; Brasil não tem mais horário de verão).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Rotacao = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
  // Segunda-feira 05:00 em Maringá — âncora da virada semanal.
  const EPOCA_MS = Date.parse('2026-01-05T05:00:00-03:00');

  function numeroSemana(agoraMs) {
    return Math.floor((agoraMs - EPOCA_MS) / SEMANA_MS);
  }

  function ordemRotacao(promoters, agoraMs) {
    const ativos = promoters.filter((p) => p.ativo);
    const giram = ativos.filter((p) => !p.fixoNoFinal);
    const fixos = ativos.filter((p) => p.fixoNoFinal);
    const k = giram.length;
    if (k === 0) return fixos;
    const offset = ((numeroSemana(agoraMs) % k) + k) % k;
    return giram.map((_, i) => giram[(offset + i) % k]).concat(fixos);
  }

  function blocoVisivel(bloco, agoraMs) {
    const de = bloco.visivelDe ? Date.parse(bloco.visivelDe) : -Infinity;
    const ate = bloco.visivelAte ? Date.parse(bloco.visivelAte) : Infinity;
    if (Number.isNaN(de) || Number.isNaN(ate)) {
      console.warn('Bloco com data malformada, ocultando:', bloco.id || bloco);
      return false;
    }
    return agoraMs >= de && agoraMs < ate;
  }

  function parseDebugData(valor) {
    if (!valor) return null;
    const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/.exec(valor);
    if (!m) return null;
    const ms = Date.parse(`${m[1]}T${m[2] || '00:00'}:00-03:00`);
    return Number.isNaN(ms) ? null : ms;
  }

  // Início (ms) da semana da bio em que `agoraMs` cai: a segunda 05:00 anterior ou igual.
  function corteSemana(agoraMs) {
    return EPOCA_MS + numeroSemana(agoraMs) * SEMANA_MS;
  }

  // Regra de qualificação semanal (Rafa 30/10/2026) — ver CONFIG.qualificacao.
  // `dados` = resposta de lista.obutiquim.com.br/api/bio/promoters
  //   ({ qualificados: [slug], top2: { slugs: [slug] } }) ou null.
  // Devolve só os promoters que entram na bio desta semana:
  //   1. quem está em `qualificados` (teve cadastro pelo link OU marcação/repost na semana que fechou);
  //   2. quem entrou há menos de `carenciaDias` (campo `desde`), sem avaliação;
  //   3. se ninguém passou: os 2 melhores do mês (`top2.slugs`);
  //   4. sem dados / regra desligada / antes de `valeDesde` / top2 vazio: TODO MUNDO (fail-open —
  //      a bio nunca fica vazia por erro técnico).
  // A ordem relativa do config é preservada; quem chama aplica ordemRotacao depois.
  function filtraQualificados(promoters, dados, agoraMs, cfg) {
    if (!cfg || !cfg.ativa) return promoters;
    if (cfg.valeDesde) {
      const v = Date.parse(cfg.valeDesde);
      if (Number.isNaN(v) || agoraMs < v) return promoters;
    }
    if (!dados || !Array.isArray(dados.qualificados)) return promoters;
    const corte = corteSemana(agoraMs);
    const carenciaMs = (cfg.carenciaDias == null ? 7 : cfg.carenciaDias) * 24 * 60 * 60 * 1000;
    const q = new Set(dados.qualificados);
    const passam = promoters.filter((p) => {
      if (p.slug && q.has(p.slug)) return true;
      if (p.desde) {
        const d = Date.parse(p.desde + 'T00:00:00-03:00');
        if (!Number.isNaN(d) && d > corte - carenciaMs) return true; // carência: entrou dentro da semana avaliada (ou depois)
      }
      return false;
    });
    if (passam.length) return passam;
    const top = new Set((dados.top2 && Array.isArray(dados.top2.slugs)) ? dados.top2.slugs : []);
    const melhores = promoters.filter((p) => p.slug && top.has(p.slug));
    return melhores.length ? melhores : promoters;
  }

  return { SEMANA_MS, EPOCA_MS, numeroSemana, corteSemana, ordemRotacao, filtraQualificados, blocoVisivel, parseDebugData };
});
