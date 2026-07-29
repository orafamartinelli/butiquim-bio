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

  return { SEMANA_MS, EPOCA_MS, numeroSemana, ordemRotacao, blocoVisivel, parseDebugData };
});
