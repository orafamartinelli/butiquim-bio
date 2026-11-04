// Confere a janela do botao avulso de lista (quinta 19/11, vespera de feriado):
// aparece desde ja, continua na madrugada e sai sexta 20/11 as 9h em ponto.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CONFIG = require('../config.js');
const Rotacao = require('../rotacao.js');

const quinta = CONFIG.listas.find((l) => l.rotulo.includes('QUINTA 19/11'));
assert.ok(quinta, 'botao da quinta 19/11 nao encontrado no config');
assert.ok(quinta.url.includes('/feriado/'), 'deve apontar pra pagina /feriado/');
assert.ok(quinta.url.includes('utm_campaign=VesperaFeriado1911'), 'deve ter UTM propria');

const em = (iso) => Rotacao.blocoVisivel(quinta, Date.parse(iso));

const casos = [
  ['2026-11-04T18:00:00-03:00', true, 'hoje (procura antecipada)'],
  ['2026-11-11T12:00:00-03:00', true, 'uma semana antes'],
  ['2026-11-19T22:00:00-03:00', true, 'na noite da festa'],
  ['2026-11-20T04:30:00-03:00', true, 'madrugada, saindo da festa'],
  ['2026-11-20T08:59:00-03:00', true, 'um minuto antes de sair'],
  ['2026-11-20T09:00:00-03:00', false, 'as 9h em ponto: sai'],
  ['2026-11-20T12:00:00-03:00', false, 'depois do corte'],
  ['2026-12-24T20:00:00-03:00', false, 'dezembro: nao volta sozinho'],
  ['2026-11-03T23:59:00-03:00', false, 'antes de entrar'],
];

for (const [iso, esperado, porque] of casos) {
  assert.equal(em(iso), esperado, `${porque} (${iso}) deveria ser ${esperado}`);
  console.log(`  ok  ${esperado ? 'aparece ' : 'oculto  '} ${iso}  ${porque}`);
}

// As 3 listas fixas nao podem ter sido afetadas: sem data = sempre visiveis.
for (const l of CONFIG.listas.filter((x) => !x.visivelDe && !x.visivelAte)) {
  assert.equal(em.call(null, '2027-05-01T12:00:00-03:00') || Rotacao.blocoVisivel(l, Date.now()), true, `${l.rotulo} deveria aparecer sempre`);
  console.log(`  ok  sempre visivel  ${l.rotulo}`);
}

console.log('\njanela da quinta 19/11: OK');
