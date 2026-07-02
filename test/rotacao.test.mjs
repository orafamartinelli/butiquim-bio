// test/rotacao.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { EPOCA_MS, numeroSemana, ordemRotacao, blocoVisivel, parseDebugData } = require('../rotacao.js');

const P = (nome, ativo = true) => ({ nome, telefone: '5544', ativo });
const cinco = ['A', 'B', 'C', 'D', 'E'].map((n) => P(n));
const t = (iso) => Date.parse(iso);

test('epoca é segunda-feira 05:00 -03:00', () => {
  assert.equal(EPOCA_MS, Date.parse('2026-01-05T05:00:00-03:00'));
  assert.equal(new Date(EPOCA_MS).getUTCDay(), 1); // 08:00 UTC, segunda
});

test('semana 0 mantém a ordem do config', () => {
  const agora = t('2026-01-05T05:00:00-03:00');
  assert.deepEqual(ordemRotacao(cinco, agora).map((p) => p.nome), ['A', 'B', 'C', 'D', 'E']);
});

test('semana 1 gira uma posição (B primeiro)', () => {
  const agora = t('2026-01-12T05:00:00-03:00');
  assert.deepEqual(ordemRotacao(cinco, agora).map((p) => p.nome), ['B', 'C', 'D', 'E', 'A']);
});

test('virada exata: segunda 04:59 ainda é a semana anterior, segunda 05:00 vira', () => {
  assert.equal(numeroSemana(t('2026-01-12T04:59:00-03:00')), 0);
  assert.equal(numeroSemana(t('2026-01-12T05:00:00-03:00')), 1);
});

test('ciclo completo: semana 5 volta pra ordem original', () => {
  const agora = t('2026-02-09T12:00:00-03:00'); // semana 5
  assert.deepEqual(ordemRotacao(cinco, agora).map((p) => p.nome), ['A', 'B', 'C', 'D', 'E']);
});

test('inativo sai da rotação sem quebrar a sequência', () => {
  const lista = [P('A'), P('B', false), P('C'), P('D'), P('E')]; // 4 ativos
  const agora = t('2026-01-12T12:00:00-03:00'); // semana 1 → offset 1 sobre [A,C,D,E]
  assert.deepEqual(ordemRotacao(lista, agora).map((p) => p.nome), ['C', 'D', 'E', 'A']);
});

test('lista vazia retorna []', () => {
  assert.deepEqual(ordemRotacao([], t('2026-01-12T12:00:00-03:00')), []);
});

test('data antes da época não quebra (offset sempre 0..k-1)', () => {
  const ordem = ordemRotacao(cinco, t('2025-12-29T12:00:00-03:00')); // semana -1
  assert.deepEqual(ordem.map((p) => p.nome), ['E', 'A', 'B', 'C', 'D']);
});

test('blocoVisivel: dentro da janela', () => {
  const b = { visivelDe: '2026-06-30T00:00:00-03:00', visivelAte: '2026-07-06T05:00:00-03:00' };
  assert.equal(blocoVisivel(b, t('2026-07-03T12:00:00-03:00')), true);
  assert.equal(blocoVisivel(b, t('2026-07-06T05:00:00-03:00')), false); // Ate é exclusivo
  assert.equal(blocoVisivel(b, t('2026-06-29T23:59:00-03:00')), false);
});

test('blocoVisivel: sem datas = sempre visível; malformada = invisível', () => {
  assert.equal(blocoVisivel({}, t('2026-07-03T12:00:00-03:00')), true);
  assert.equal(blocoVisivel({ visivelAte: 'banana' }, t('2026-07-03T12:00:00-03:00')), false);
});

test('parseDebugData: data e data+hora em -03:00; inválido = null', () => {
  assert.equal(parseDebugData('2026-07-03'), Date.parse('2026-07-03T00:00:00-03:00'));
  assert.equal(parseDebugData('2026-07-06T05:00'), Date.parse('2026-07-06T05:00:00-03:00'));
  assert.equal(parseDebugData('banana'), null);
  assert.equal(parseDebugData(null), null);
});
