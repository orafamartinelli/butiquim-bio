// Prova visual: a bio hoje (com o botao da quinta 19/11) e simulando 20/11 as 10h (sem ele).
import { chromium } from 'playwright';

const OUT = process.argv[2];
const URL = 'https://obutiquim.com.br/bio/';

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 440, height: 1400 }, deviceScaleFactor: 2 });

for (const [arquivo, query, rotulo] of [
  ['bio-hoje.png', '', 'hoje'],
  ['bio-dia-seguinte.png', '?debugData=2026-11-20T10:00', '20/11 as 10h'],
]) {
  const pagina = await ctx.newPage();
  await pagina.goto(URL + query, { waitUntil: 'networkidle', timeout: 60000 });
  await pagina.waitForSelector('.grupo-listas .botao', { timeout: 20000 });
  await pagina.waitForTimeout(1200);

  const listas = await pagina.$$eval('.grupo-listas .botao .rotulo', (ns) => ns.map((n) => n.textContent.trim()));
  const temQuinta = listas.some((t) => t.includes('QUINTA 19/11'));
  console.log(`[${rotulo}] listas visiveis: ${listas.join(' | ')}`);
  console.log(`[${rotulo}] botao da quinta 19/11: ${temQuinta ? 'APARECE' : 'oculto'}`);

  await pagina.screenshot({ path: `${OUT}/${arquivo}`, fullPage: true });
  await pagina.close();
}

await navegador.close();
console.log('\nprova visual gerada');
