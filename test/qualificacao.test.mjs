// test/qualificacao.test.mjs — regra de qualificação semanal da bio (Rafa 30/10/2026)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { corteSemana, filtraQualificados, ordemRotacao } = require('../rotacao.js');
const CONFIG = require('../config.js');

const t = (iso) => Date.parse(iso);
const CFG = { ativa: true, valeDesde: '2026-11-02T05:00:00-03:00', carenciaDias: 7 };
const P = (slug, extra = {}) => ({ nome: slug, slug, telefone: '5544', ativo: true, desde: '2025-12-31', ...extra });
const time = [P('luanabido'), P('mari'), P('mariajulia'), P('medina'), P('anny', { desde: '2026-10-30' }), P('gabriel', { fixoNoFinal: true })];
const slugs = (lista) => lista.map((p) => p.slug);
const SEG_02_11 = t('2026-11-02T05:00:00-03:00');
const SEG_09_11 = t('2026-11-09T05:00:00-03:00');

test('corteSemana: segunda 05:00 anterior ou igual', () => {
  assert.equal(corteSemana(t('2026-10-30T18:00:00-03:00')), t('2026-10-26T05:00:00-03:00'));
  assert.equal(corteSemana(SEG_02_11), SEG_02_11);
  assert.equal(corteSemana(t('2026-11-02T04:59:00-03:00')), t('2026-10-26T05:00:00-03:00'));
});

test('regra desligada ou antes de valeDesde: todo mundo', () => {
  const dados = { qualificados: ['medina'], top2: { slugs: [] } };
  assert.deepEqual(slugs(filtraQualificados(time, dados, SEG_02_11, { ...CFG, ativa: false })), slugs(time));
  assert.deepEqual(slugs(filtraQualificados(time, dados, t('2026-10-30T18:00:00-03:00'), CFG)), slugs(time));
  assert.deepEqual(slugs(filtraQualificados(time, dados, SEG_02_11, null)), slugs(time));
});

test('sem dados (API fora) ou resposta estranha: todo mundo — a bio nunca fica vazia', () => {
  assert.deepEqual(slugs(filtraQualificados(time, null, SEG_02_11, CFG)), slugs(time));
  assert.deepEqual(slugs(filtraQualificados(time, { ok: false }, SEG_02_11, CFG)), slugs(time));
  assert.deepEqual(slugs(filtraQualificados(time, { qualificados: 'medina' }, SEG_02_11, CFG)), slugs(time));
});

test('qualificado fica, não qualificado sai; ordem do config preservada', () => {
  const dados = { qualificados: ['medina', 'mari'], top2: { slugs: ['medina', 'luanabido'] } };
  // 02/11: Anny ainda em carência (entrou 30/10) → entra junto
  assert.deepEqual(slugs(filtraQualificados(time, dados, SEG_02_11, CFG)), ['mari', 'medina', 'anny']);
  // 09/11: carência da Anny acabou → só os qualificados
  assert.deepEqual(slugs(filtraQualificados(time, dados, SEG_09_11, CFG)), ['mari', 'medina']);
});

test('carência: entrou dentro da semana avaliada entra; 8 dias antes do corte não', () => {
  const dados = { qualificados: [], top2: { slugs: ['medina', 'luanabido'] } };
  const novo = P('novo', { desde: '2026-10-27' }); // corte 02/11 05h − 7d = 26/10 05h → 27/10 entra
  const velho = P('velho', { desde: '2026-10-25' }); // 25/10 < 26/10 05h → avaliado normalmente (sem atividade = sai)
  assert.deepEqual(slugs(filtraQualificados([novo, velho, P('medina')], dados, SEG_02_11, CFG)), ['novo']);
});

test('gabriel entra na regra como todo mundo: sem atividade some; qualificado fica no final via ordemRotacao', () => {
  const sem = { qualificados: ['medina'], top2: { slugs: [] } };
  assert.deepEqual(slugs(filtraQualificados(time, sem, SEG_09_11, CFG)), ['medina']);
  const com = { qualificados: ['medina', 'gabriel', 'luanabido'], top2: { slugs: [] } };
  const ordem = ordemRotacao(filtraQualificados(time, com, SEG_09_11, CFG), SEG_09_11);
  assert.equal(ordem[ordem.length - 1].slug, 'gabriel');
  assert.deepEqual(slugs(ordem).sort(), ['gabriel', 'luanabido', 'medina']);
});

test('ninguém qualificou: ficam os 2 melhores do mês (top2); top2 vazio = todo mundo', () => {
  const dados = { qualificados: [], top2: { slugs: ['medina', 'luanabido'], mes: '2026-10', origem: 'anterior' } };
  assert.deepEqual(slugs(filtraQualificados(time, dados, SEG_09_11, CFG)), ['luanabido', 'medina']);
  assert.deepEqual(slugs(filtraQualificados(time, { qualificados: [], top2: { slugs: [] } }, SEG_09_11, CFG)), slugs(time));
  assert.deepEqual(slugs(filtraQualificados(time, { qualificados: [] }, SEG_09_11, CFG)), slugs(time));
});

test('config real: todo promoter tem slug e desde válidos, e a regra começa em 02/11 05h', () => {
  for (const p of CONFIG.promoters) {
    assert.match(p.slug, /^[a-z0-9]+$/, p.nome);
    assert.match(p.desde, /^\d{4}-\d{2}-\d{2}$/, p.nome);
    assert.ok(!Number.isNaN(Date.parse(p.desde + 'T00:00:00-03:00')), p.nome);
  }
  assert.equal(CONFIG.qualificacao.ativa, true);
  assert.equal(Date.parse(CONFIG.qualificacao.valeDesde), SEG_02_11);
  assert.match(CONFIG.qualificacao.api, /^https:\/\/lista\.obutiquim\.com\.br\/api\/bio\/promoters$/);
  // com os dados de hoje (só Medina com cadastro na semana), em 02/11 a bio mostraria Medina + Anny (carência)
  const dados = { qualificados: ['medina'], top2: { slugs: ['medina', 'luanabido'] } };
  assert.deepEqual(slugs(ordemRotacao(filtraQualificados(CONFIG.promoters, dados, SEG_02_11, CONFIG.qualificacao), SEG_02_11)).sort(), ['anny', 'medina']);
});
