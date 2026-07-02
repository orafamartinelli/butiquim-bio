// Verificação pós-deploy: renderiza a URL de produção e confere tudo.
import { chromium, devices } from 'playwright';

const URL = process.argv[2] || 'https://butiquim-bio.pages.dev/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-BR' });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1000);

const promoters = await page.$$eval('#promoters .rotulo', (els) => els.map((e) => e.textContent));
const links = await page.$$eval('a.botao', (as) => as.map((a) => a.href));
const copa = await page.locator('.bloco-temp').count();
await page.screenshot({ path: 'docs/screenshot-live.png', fullPage: true });

console.log(JSON.stringify({ promoters, copa, totalBotoes: links.length, erros, links }, null, 2));
await browser.close();
