// Teste dirigido do /estudio: lazy-load das capas + modal de visualização com player
import { chromium } from 'playwright';

const nav = await chromium.launch();
const pg = await nav.newPage({ viewport: { width: 1280, height: 900 } });
const SHOT = 'C:/Users/User/AppData/Local/Temp/claude/C--Users-User/c2ec9f4b-870b-4a37-8fa0-6e6cbf04b8a6/scratchpad';
const falhas = [];
pg.on('pageerror', (e) => falhas.push('pageerror: ' + e.message));

await pg.goto('https://orafamartinelli.com.br/estudio/?k=butica19anos', { waitUntil: 'networkidle', timeout: 45000 });
await pg.waitForSelector('.card', { timeout: 15000 });

// 1) lazy-load: capas fora da tela NÃO devem ter src; as visíveis sim
const stats = await pg.evaluate(() => {
  const todas = [...document.querySelectorAll('.thumb video')];
  return {
    total: todas.length,
    carregadas: todas.filter((v) => v.src).length,
    preguicosas: todas.filter((v) => v.dataset.src).length,
  };
});
console.log('capas:', JSON.stringify(stats));
if (!stats.total) falhas.push('nenhum card renderizado');
if (stats.preguicosas === 0 && stats.total > 12) falhas.push('lazy-load não segurou nada — tudo carregou junto');

// 2) rola até o fim (deve carregar sob demanda, sem erro)
await pg.mouse.wheel(0, 20000);
await pg.waitForTimeout(1500);

// 3) clica na capa do CARROSSEL -> modal horizontal (1 slide por vez, setas, contador)
await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(400);
const cardCarrossel = pg.locator('.card', { has: pg.locator('.fmt.carrossel') }).first();
await cardCarrossel.locator('.thumb').click();
await pg.waitForSelector('#ver[open]', { timeout: 5000 });
const setas = await pg.locator('#ver .ver-seta').count();
let contador = await pg.locator('#ver .ver-contador').textContent();
console.log('modal carrossel aberto — setas:', setas, '| contador:', contador.trim());
if (setas !== 2) falhas.push('esperava 2 setas, achei ' + setas);
if (!contador.includes('1 / ')) falhas.push('contador errado: ' + contador);
// navega: › vai pro slide 2, ‹ ‹ volta dando a volta
await pg.click('#ver .ver-seta.prox');
await pg.waitForTimeout(300);
contador = (await pg.locator('#ver .ver-contador').textContent()).trim();
console.log('depois da seta ›:', contador);
if (!contador.startsWith('2 /')) falhas.push('seta › não navegou: ' + contador);
await pg.screenshot({ path: `${SHOT}/teste-modal-carrossel.png` });
// teclado ← volta pro 1
await pg.keyboard.press('ArrowLeft');
await pg.waitForTimeout(300);
contador = (await pg.locator('#ver .ver-contador').textContent()).trim();
console.log('depois do teclado ←:', contador);
if (!contador.startsWith('1 /')) falhas.push('teclado ← não navegou: ' + contador);
// volta pro slide 1 (vídeo) pro teste de player


// 4) player funciona? dá play no vídeo do modal
const tocou = await pg.evaluate(async () => {
  const v = document.querySelector('#ver-conteudo video');
  if (!v) return 'sem video';
  try { v.muted = true; await v.play(); await new Promise((r) => setTimeout(r, 900)); return v.currentTime > 0 ? 'tocando' : 'parado'; }
  catch (e) { return 'erro: ' + e.message; }
});
console.log('player:', tocou);
if (tocou !== 'tocando') falhas.push('vídeo do modal não tocou: ' + tocou);

// 5) fecha e abre um REELS comum
await pg.click('#ver button.bt');
await pg.waitForTimeout(300);
const cardReels = pg.locator('.card', { has: pg.locator('.fmt.reels') }).first();
await cardReels.locator('.thumb').click();
await pg.waitForSelector('#ver[open]', { timeout: 5000 });
await pg.waitForTimeout(600);
await pg.screenshot({ path: `${SHOT}/teste-modal-reels.png` });
await pg.click('#ver button.bt');

console.log(falhas.length ? 'FALHAS:\n- ' + falhas.join('\n- ') : 'TUDO FUNCIONAL');
await nav.close();
process.exit(falhas.length ? 1 : 0);
