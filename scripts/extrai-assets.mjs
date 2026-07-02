// One-off: extrai logo + foto de fundo da página Beacons atual do Butiquim.
// Uso: node scripts/extrai-assets.mjs
//
// Lições da 1ª execução (2026-07-02):
// - beacons.ai não bloqueia Playwright com emulação mobile (chega 200 OK), mas
//   'networkidle' pode nunca disparar (giphy/analytics ficam de polling) — usar
//   'domcontentloaded' + waitForLoadState('networkidle') com timeout curto e seguir.
// - O avatar real (a bolinha verde "O") é a <img alt="profile"> vinda de
//   storage.googleapis.com/.../profile_pictures/instagram/obutiquim.jpg — as
//   demais <img> da página são ícones dos botões de link (link_images), não o logo.
// - O fundo é o CSS background-image do container raiz (backgrounds/home/mobile_background_*).
// - page.request.get() baixa os bytes originais (podem ser PNG mesmo com URL .jpg
//   e vice-versa). Para gravar com a extensão certa (logo.png / bg.jpg), a forma
//   confiável é carregar num <img> dentro da própria página e reexportar via
//   <canvas>.toDataURL(), que sempre gera o formato pedido.
import { chromium, devices } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

async function baixarComoFormato(page, url, mime) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const dataUrl = await page.evaluate(async (mimeType) => {
    const img = document.querySelector('img');
    await new Promise((res) => {
      if (img.complete) res();
      else img.onload = res;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL(mimeType, 0.92);
  }, mime);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function main() {
  await mkdir(ASSETS, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();

  console.log('Abrindo https://beacons.ai/obutiquim ...');
  const resp0 = await page.goto('https://beacons.ai/obutiquim', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('status:', resp0 && resp0.status());
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {
    console.log('networkidle não disparou a tempo, seguindo assim mesmo');
  }
  await page.waitForTimeout(3000);

  const imgs = await page.$$eval('img', (els) =>
    els
      .map((el) => ({ src: el.currentSrc || el.src, w: el.naturalWidth, h: el.naturalHeight, alt: el.alt }))
      .filter((i) => i.src)
  );
  console.log('--- <img> encontradas ---');
  console.log(JSON.stringify(imgs, null, 2));

  const bgs = await page.$$eval('*', (els) =>
    els
      .map((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
          const rect = el.getBoundingClientRect();
          return { bg, w: rect.width, h: rect.height, top: rect.top };
        }
        return null;
      })
      .filter(Boolean)
  );
  console.log('--- background-image encontrados ---');
  console.log(JSON.stringify(bgs, null, 2));

  // Avatar = <img alt="profile">; se não achar, cai para heurística (menor img quadrada).
  const avatar =
    imgs.find((i) => i.alt === 'profile') ||
    imgs.filter((i) => i.w > 0 && Math.abs(i.w - i.h) < i.w * 0.3).sort((a, b) => a.w - b.w)[0];
  console.log('Avatar/logo escolhido:', avatar);

  let bgUrl = null;
  if (bgs.length) {
    const maior = bgs.sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const m = /url\("?(.*?)"?\)/.exec(maior.bg);
    if (m) bgUrl = m[1];
  }
  console.log('Background escolhido:', bgUrl);

  const page2 = await context.newPage();
  if (avatar && avatar.src) {
    const buf = await baixarComoFormato(page2, avatar.src, 'image/png');
    await writeFile(path.join(ASSETS, 'logo.png'), buf);
    console.log(`logo.png salvo (${buf.length} bytes) de ${avatar.src}`);
  } else {
    console.log('NENHUM avatar/logo candidato encontrado — usar fallback local.');
  }

  if (bgUrl) {
    const buf = await baixarComoFormato(page2, bgUrl, 'image/jpeg');
    await writeFile(path.join(ASSETS, 'bg.jpg'), buf);
    console.log(`bg.jpg salvo (${buf.length} bytes) de ${bgUrl}`);
  } else {
    console.log('NENHUM background-image candidato — usar fallback (screenshot ou foto local).');
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
