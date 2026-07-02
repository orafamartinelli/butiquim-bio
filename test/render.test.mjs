// test/render.test.mjs — valida a página renderizada com datas simuladas.
import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const url = pathToFileURL(resolve('index.html')).href;
const browser = await chromium.launch();

async function abre(query) {
  const page = await browser.newPage();
  // injeta telefones fake pra rotação renderizar
  await page.addInitScript(() => {
    const orig = Object.getOwnPropertyDescriptor(window, 'CONFIG');
    let val;
    Object.defineProperty(window, 'CONFIG', {
      configurable: true,
      get: () => val,
      set: (v) => { v.promoters.forEach((p, i) => (p.telefone = `55440000000${i}`)); val = v; },
    });
  });
  await page.goto(`${url}${query}`);
  await page.waitForTimeout(300);
  return page;
}

// semana 0 (época 05/01/2026): ordem original
let page = await abre('?debugData=2026-01-05T05:00');
let nomes = await page.$$eval('#promoters .rotulo', (els) => els.map((e) => e.textContent));
assert.deepEqual(nomes, ['Gabriel', 'Luana Bido', 'Mari', 'Maria Julia', 'Nicolly']);

// semana seguinte: gira 1
page = await abre('?debugData=2026-01-12T05:00');
nomes = await page.$$eval('#promoters .rotulo', (els) => els.map((e) => e.textContent));
assert.deepEqual(nomes, ['Luana Bido', 'Mari', 'Maria Julia', 'Nicolly', 'Gabriel']);

// wa.me com mensagem e primeiro nome
const href = await page.$eval('#promoters a', (a) => a.href);
assert.match(href, /^https:\/\/wa\.me\/554400000001\?text=Oi%20Luana!/);

// bloco copa: visível dentro da janela, some depois
page = await abre('?debugData=2026-07-03');
assert.equal(await page.locator('.bloco-temp').count(), 1);
page = await abre('?debugData=2026-07-07');
assert.equal(await page.locator('.bloco-temp').count(), 0);

// links das listas intactos
page = await abre('');
const listas = await page.$$eval('a.botao', (as) => as.map((a) => a.href));
assert.ok(listas.some((h) => h.includes('obutiquim.com.br/sexta-feira/?utm_source=Instagram')));
assert.ok(listas.some((h) => h.includes('split.to/ReservasBioButiquim')));

await browser.close();
console.log('render.test: OK');
