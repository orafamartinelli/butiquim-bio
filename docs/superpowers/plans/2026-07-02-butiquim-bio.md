# Butiquim Bio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página link-in-bio própria do O Butiquim em `bio.obutiquim.com.br`, réplica visual do Beacons atual, com seção de promoters rotativos (round-robin semanal, virada segunda 05:00 -03:00).

**Architecture:** Site estático (HTML/CSS/JS puro, sem build) em Cloudflare Pages, projeto novo `butiquim-bio`. Todo conteúdo editável centralizado em `config.js`. Lógica de rotação isolada em `rotacao.js` (pura, testável em Node). Renderização em `app.js` lê `CONFIG` e monta o DOM.

**Tech Stack:** HTML/CSS/JS vanilla, `node:test` (Node 24) para lógica, Playwright para teste de renderização, Wrangler 4.x para deploy CF Pages.

**Spec:** `docs/superpowers/specs/2026-07-02-butiquim-bio-design.md` (ler antes de começar)

**Working dir:** `C:\Users\User\Documents\projetos\butiquim-bio` (repo git já iniciado)

---

## File Structure

```
butiquim-bio/
├── index.html          # casca da página; seções são renderizadas pelo app.js
├── styles.css          # visual réplica do Beacons (escuro + #C8D200)
├── config.js           # ÚNICO arquivo editado no dia a dia (promoters, blocos, links)
├── rotacao.js          # lógica pura: número da semana, ordem round-robin, visibilidade de blocos
├── app.js              # renderização: lê CONFIG + rotacao.js e monta o DOM
├── assets/             # logo.png, bg.jpg (extraídos do Beacons atual)
├── wrangler.toml       # deploy CF Pages
├── package.json        # devDependency playwright; scripts de teste
├── test/
│   ├── rotacao.test.mjs   # node:test da lógica pura
│   └── render.test.mjs    # Playwright: página renderizada com datas simuladas
└── docs/superpowers/   # spec + este plano
```

`config.js` e `rotacao.js` usam o padrão dual (browser global + CommonJS export) para serem testáveis em Node sem bundler.

---

### Task 1: Scaffold do projeto

**Files:**
- Create: `wrangler.toml`, `package.json`, `.gitignore`

- [ ] **Step 1: Criar wrangler.toml**

```toml
name = "butiquim-bio"
pages_build_output_dir = "."
compatibility_date = "2026-06-01"
```

- [ ] **Step 2: Criar .gitignore**

```
node_modules/
.wrangler/
test-results/
```

- [ ] **Step 3: Criar package.json e instalar Playwright**

```json
{
  "name": "butiquim-bio",
  "private": true,
  "scripts": {
    "test": "node --test test/rotacao.test.mjs",
    "test:render": "node test/render.test.mjs",
    "deploy": "wrangler pages deploy . --project-name=butiquim-bio"
  }
}
```

Run: `npm i -D playwright` (Chromium já instalado na máquina via `npx playwright install chromium`).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold butiquim-bio (wrangler + package.json)"
```

---

### Task 2: Lógica de rotação (TDD)

**Files:**
- Create: `rotacao.js`
- Test: `test/rotacao.test.mjs`

Regras (do spec): época `2026-01-05T05:00:00-03:00` (segunda 5h em Maringá); `semana = floor((agora - epoca)/604800000)`; `offset = ((semana % k) + k) % k`; ordem = lista de ativos girada pelo offset. Blocos: visível se `De <= agora < Ate`; data malformada → invisível + `console.warn`.

- [ ] **Step 1: Escrever os testes (falhando)**

```js
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test test/rotacao.test.mjs`
Expected: FAIL (Cannot find module '../rotacao.js')

- [ ] **Step 3: Implementar rotacao.js**

```js
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
    const k = ativos.length;
    if (k === 0) return [];
    const offset = ((numeroSemana(agoraMs) % k) + k) % k;
    return ativos.map((_, i) => ativos[(offset + i) % k]);
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test test/rotacao.test.mjs`
Expected: PASS (11 testes)

- [ ] **Step 5: Commit**

```bash
git add rotacao.js test/rotacao.test.mjs
git commit -m "feat: rotação semanal round-robin + visibilidade de blocos (TDD)"
```

---

### Task 3: config.js com o conteúdo real

**Files:**
- Create: `config.js`

- [ ] **Step 1: Criar config.js**

Telefones ficam `""` (vazio) até o Rafa passar — promoter sem telefone é tratado como inativo pela renderização (spec). Todos os URLs abaixo vieram do Beacons atual (extraídos em 01/07/2026, listados no spec).

```js
// Butiquim Bio — TODO o conteúdo editável vive aqui.
// Editar + `npm run deploy` = mudança no ar em ~1 min.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.CONFIG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    titulo: 'O Butiquim - Maringá/PR',
    destaque: { tag: '#NÃOTEMERRO ✅', texto: '19 anos criando histórias e colocando a culpa no ar condicionado!' },

    social: [
      { icone: 'tiktok', url: 'https://bit.ly/TIKTOKBUTICA' },
      { icone: 'instagram', url: 'https://instagram.com/obutiquim' },
      { icone: 'x', url: 'https://twitter.com/obutiquim' },
      { icone: 'facebook', url: 'https://facebook.com/obutiquim' },
    ],

    // telefone: E.164 sem "+" (ex: "5544984232574"). Vazio = fora da rotação.
    promoters: [
      { nome: 'Gabriel', telefone: '', ativo: true },
      { nome: 'Luana Bido', telefone: '', ativo: true },
      { nome: 'Mari', telefone: '', ativo: true },
      { nome: 'Maria Julia', telefone: '', ativo: true },
      { nome: 'Nicolly', telefone: '', ativo: true },
    ],
    promotersTitulo: 'FALE COM UM PROMOTER 👇',
    promotersSubtitulo: 'Desconto e lista VIP direto com o time!',
    mensagemPromoter: 'Oi {nome}! Vim pela bio do Butiquim 🍺',

    // Blocos temporários — somem sozinhos fora da janela (datas em -03:00).
    blocosTemporarios: [
      {
        id: 'copa',
        visivelDe: '2026-06-30T00:00:00-03:00',
        visivelAte: '2026-07-06T05:00:00-03:00',
        titulo: 'JOGOS DA COPA DO MUNDO NO BUTIQUIM!',
        subtitulo: 'Open Bar de Chopp + Vodka + Telão e 03 tvs. Ingressos antecipados!',
        botao: '05/07 Domingo 15h — BRASIL X Noruega · Abrimos 19h30',
        url: 'https://www.ingressonacional.com.br/evento/34467/arenaobutiquimoitavasdefinalopenvodkaopenchopp',
      },
    ],

    listas: [
      { rotulo: 'LISTA DE SEXTA', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sexta-feira/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SextaOrganico' },
      { rotulo: 'LISTA DE SÁBADO', sub: 'Garanta seu desconto', url: 'https://obutiquim.com.br/sabado/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=SabadoOrganico' },
      { rotulo: 'LISTA DE DOMINGO', sub: 'Garanta seu desconto', url: 'https://www.obutiquim.com.br/domingo/?utm_source=Instagram&utm_medium=BioInsta&utm_campaign=DomingoOrganico' },
    ],

    outros: [
      { rotulo: 'Reservas de Mesas', sub: 'Clique aqui', url: 'https://split.to/ReservasBioButiquim', icone: 'whatsapp' },
      { rotulo: 'Seja promoter! Queremos você!', sub: '', url: 'https://forms.gle/vn1Ypk3VLekEuwCU9', icone: 'star' },
    ],
  };
});
```

- [ ] **Step 2: Smoke test em Node**

Run: `node -e "const c=require('./config.js'); console.log(c.promoters.length, c.listas.length)"`
Expected: `5 3`

- [ ] **Step 3: Commit**

```bash
git add config.js && git commit -m "feat: config.js com conteúdo real do Beacons (telefones pendentes)"
```

---

### Task 4: Assets (logo + fundo) do Beacons atual

**Files:**
- Create: `assets/logo.png`, `assets/bg.jpg`, `scripts/extrai-assets.mjs`

- [ ] **Step 1: Extrair URLs das imagens da página atual**

Playwright (o beacons.ai responde 403 pra curl sem render; imagens vêm de CDN):

```js
// scripts/extrai-assets.mjs — roda uma vez, baixa logo e fundo do Beacons
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newContext({ ...devices['iPhone 13'] }).then((c) => c.newPage());
await page.goto('https://beacons.ai/obutiquim', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(4000);
const imgs = await page.evaluate(() => {
  const urls = [...document.images].map((i) => i.currentSrc || i.src);
  const bg = [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage)
    .filter((b) => b && b.includes('url(')).map((b) => b.slice(5, -2));
  return { urls, bg };
});
console.log(JSON.stringify(imgs, null, 2));
mkdirSync('assets', { recursive: true });
// identificar visualmente qual é o logo (verde "O") e qual é o fundo; baixar:
for (const [nome, url] of Object.entries({ /* preencher após inspecionar o output */ })) {
  const buf = Buffer.from(await (await page.request.get(url)).body());
  writeFileSync(`assets/${nome}`, buf);
}
await browser.close();
```

Run: `node scripts/extrai-assets.mjs` — inspecionar o output, preencher o mapa `{ 'logo.png': ..., 'bg.jpg': ... }` e rodar de novo.

**Fallback:** se o CDN bloquear, tirar screenshot dos elementos (`locator.screenshot()`) ou pedir os arquivos originais ao Rafa (ele tem o material da marca — pasta `Downloads/OButiquim`). Checar primeiro `Downloads/OButiquim` antes de raspar.

- [ ] **Step 2: Verificar que os dois arquivos existem e abrem** (Read tool nos PNGs)

- [ ] **Step 3: Commit**

```bash
git add assets scripts && git commit -m "feat: assets da marca (logo + fundo)"
```

---

### Task 5: index.html + styles.css (réplica visual)

**Files:**
- Create: `index.html`, `styles.css`

Referência visual: screenshot da página atual (sessão de 01/07) — fundo preto com foto do bar no topo, logo central, botões pílula cinza-escuro `#2b2b2b` com texto `#C8D200`, card branco de destaque com borda verde-limão, títulos de seção em caixinhas com borda.

- [ ] **Step 1: Criar index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>@obutiquim — O Butiquim · Maringá/PR</title>
  <meta name="description" content="Listas, reservas e promoters do O Butiquim — Maringá/PR. #NÃOTEMERRO" />
  <meta property="og:title" content="O Butiquim — Maringá/PR" />
  <meta property="og:description" content="Garanta seu desconto nas listas de sexta, sábado e domingo!" />
  <link rel="icon" href="assets/logo.png" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-foto"></div>
  <main id="pagina">
    <noscript><p class="fallback">Ative o JavaScript ou fale com a gente: <a href="https://instagram.com/obutiquim">@obutiquim</a></p></noscript>
  </main>
  <script src="config.js"></script>
  <script src="rotacao.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar styles.css**

```css
/* Butiquim Bio — réplica do visual Beacons. Marca: verde-limão #C8D200. */
:root {
  --verde: #c8d200;
  --fundo: #0c0c0c;
  --botao: #2b2b2b;
  --texto: #ffffff;
  --raio: 28px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--fundo);
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
}
.bg-foto {
  position: fixed; inset: 0 0 auto 0; height: 420px; z-index: 0;
  background: url('assets/bg.jpg') center top / cover no-repeat;
  -webkit-mask-image: linear-gradient(#000 30%, transparent);
  mask-image: linear-gradient(#000 30%, transparent);
  opacity: 0.55;
}
#pagina { position: relative; z-index: 1; max-width: 480px; margin: 0 auto; padding: 40px 16px 60px; }

.header { text-align: center; margin-bottom: 18px; }
.header img.logo { width: 96px; height: 96px; object-fit: contain; }
.header h1 { font-size: 17px; font-weight: 600; margin-top: 10px; }
.social { display: flex; justify-content: center; gap: 18px; margin-top: 12px; }
.social a { color: var(--texto); display: inline-flex; }
.social svg { width: 22px; height: 22px; fill: currentColor; }

.card-destaque {
  background: #fff; color: #111; border: 2px solid var(--verde);
  border-radius: 20px; padding: 18px 16px; text-align: center; margin: 18px 0;
}
.card-destaque .tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #1a7f37; margin-bottom: 6px; }
.card-destaque p { font-size: 16px; color: var(--verde); -webkit-text-stroke: 0.4px #666; font-weight: 700; }

.secao-titulo {
  border: 2px solid var(--verde); border-radius: 20px; background: rgba(255,255,255,0.96);
  text-align: center; padding: 14px 16px; margin: 26px 0 14px;
}
.secao-titulo .mini { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #333; }
.secao-titulo .grande { font-size: 18px; font-weight: 700; color: var(--verde); -webkit-text-stroke: 0.3px #666; margin-top: 4px; }

.botao {
  display: flex; align-items: center; gap: 12px;
  background: var(--botao); border-radius: var(--raio);
  padding: 14px 18px; margin: 12px 0; text-decoration: none;
  box-shadow: 0 4px 0 rgba(0,0,0,0.45);
  transition: transform 0.08s ease;
}
.botao:active { transform: scale(0.98); }
.botao .icone { flex: 0 0 34px; height: 34px; display: flex; align-items: center; justify-content: center; }
.botao .icone svg, .botao .icone img { width: 30px; height: 30px; fill: var(--verde); border-radius: 8px; }
.botao .textos { flex: 1; text-align: center; margin-right: 34px; }
.botao .rotulo { color: var(--verde); font-size: 16px; font-weight: 600; }
.botao .sub { color: #e6e6e6; font-size: 12px; margin-top: 2px; }

.bloco-temp {
  border: 2px solid var(--verde); border-radius: 20px; background: rgba(255,255,255,0.96);
  text-align: center; padding: 16px; margin: 22px 0;
}
.bloco-temp .mini { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #222; }
.bloco-temp .sub { font-size: 15px; font-weight: 700; color: var(--verde); -webkit-text-stroke: 0.3px #666; margin: 8px 0 12px; }
.bloco-temp .botao { background: #171717; }

.fallback { text-align: center; padding: 40px 20px; }
.fallback a { color: var(--verde); }
@media (min-width: 500px) { #pagina { padding-top: 56px; } }
```

- [ ] **Step 3: Conferir no navegador local** (ainda sem app.js — só ver se a casca carrega sem erro 404 de CSS/assets)

Run: `npx serve .` ou abrir `index.html` direto; conferir console limpo.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css && git commit -m "feat: casca da página + visual réplica do Beacons"
```

---

### Task 6: app.js — renderização

**Files:**
- Create: `app.js`

Comportamento (spec): renderiza na ordem header → destaque → blocos temporários visíveis → promoters (rotacionados) → listas → outros. `?debugData=` substitui o "agora" em rotação **e** blocos. Promoter sem telefone ou `ativo:false` fica fora. Seção de promoters some se nenhum ativo com telefone. Se `CONFIG` não carregar, mostra fallback mínimo.

- [ ] **Step 1: Implementar app.js**

```js
// Butiquim Bio — renderização. Lê CONFIG (config.js) e Rotacao (rotacao.js).
(function () {
  const raiz = document.getElementById('pagina');
  if (typeof CONFIG === 'undefined' || typeof Rotacao === 'undefined') {
    raiz.innerHTML = '<p class="fallback">Ops, algo falhou ao carregar. Fale com a gente: <a href="https://instagram.com/obutiquim">@obutiquim</a></p>';
    return;
  }

  const debug = Rotacao.parseDebugData(new URLSearchParams(location.search).get('debugData'));
  const agora = debug !== null ? debug : Date.now();

  const ICONES = {
    tiktok: '<svg viewBox="0 0 24 24"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.76 5.76 0 0 0-.77-.05 5.66 5.66 0 1 0 5.66 5.66V9.01a7.32 7.32 0 0 0 4.28 1.37V7.29a4.28 4.28 0 0 1-3.2-1.47z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.59-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.59 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.2 15.61 2.2 15.23 2.2 12s0-3.59.07-4.85C2.42 3.92 3.94 2.38 7.19 2.23 8.45 2.18 8.83 2.2 12 2.2zm0 3.68a6.12 6.12 0 1 0 0 12.24 6.12 6.12 0 0 0 0-12.24zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.4L6.47 22H3.35l7.24-8.28L2.4 2h6.4l4.42 5.84L18.9 2zm-1.1 18.13h1.73L7.86 3.77H6l11.8 16.36z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M12.04 2a9.9 9.9 0 0 0-8.42 15.17L2.05 22l4.98-1.53A9.9 9.9 0 1 0 12.04 2zm5.77 14.06c-.24.68-1.4 1.3-1.93 1.35-.52.05-1.01.24-3.4-.71-2.87-1.13-4.68-4.06-4.82-4.25-.14-.19-1.15-1.53-1.15-2.92s.73-2.07.99-2.35c.26-.28.56-.35.75-.35l.54.01c.17.01.4-.07.63.48.24.57.8 1.96.87 2.1.07.14.12.31.02.5-.09.19-.14.31-.28.48l-.42.49c-.14.14-.29.29-.12.57.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.61-.07.17-.19.71-.82.89-1.1.19-.28.38-.24.63-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  };

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function botao(url, rotulo, sub, icone) {
    return `<a class="botao" href="${esc(url)}" target="_blank" rel="noopener">
      <span class="icone">${ICONES[icone] || ''}</span>
      <span class="textos"><span class="rotulo">${esc(rotulo)}</span>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</span>
    </a>`;
  }

  let html = `
    <header class="header">
      <img class="logo" src="assets/logo.png" alt="O Butiquim" />
      <h1>${esc(CONFIG.titulo)}</h1>
      <div class="social">${CONFIG.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.icone)}">${ICONES[s.icone] || ''}</a>`).join('')}</div>
    </header>
    <div class="card-destaque"><span class="tag">${esc(CONFIG.destaque.tag)}</span><p>${esc(CONFIG.destaque.texto)}</p></div>`;

  for (const b of CONFIG.blocosTemporarios) {
    if (!Rotacao.blocoVisivel(b, agora)) continue;
    html += `<div class="bloco-temp"><div class="mini">${esc(b.titulo)}</div><div class="sub">${esc(b.subtitulo)}</div>${botao(b.url, b.botao, '', 'star')}</div>`;
  }

  const rotacionados = Rotacao.ordemRotacao(CONFIG.promoters.filter((p) => p.telefone), agora);
  if (rotacionados.length) {
    html += `<div class="secao-titulo"><div class="mini">${esc(CONFIG.promotersTitulo)}</div><div class="grande">${esc(CONFIG.promotersSubtitulo)}</div></div>`;
    html += `<section id="promoters">`;
    for (const p of rotacionados) {
      const primeiroNome = p.nome.split(' ')[0];
      const msg = encodeURIComponent(CONFIG.mensagemPromoter.replace('{nome}', primeiroNome));
      html += botao(`https://wa.me/${p.telefone}?text=${msg}`, p.nome, 'Chama no WhatsApp', 'whatsapp');
    }
    html += `</section>`;
  }

  html += `<div class="secao-titulo"><div class="mini">CADASTRE-SE NA LISTA DO DIA 👇</div><div class="grande">Garanta seu desconto!</div></div>`;
  for (const l of CONFIG.listas) html += botao(l.url, l.rotulo, l.sub, 'star');
  for (const o of CONFIG.outros) html += botao(o.url, o.rotulo, o.sub, o.icone);

  raiz.innerHTML = html;
})();
```

- [ ] **Step 2: Conferir manualmente no navegador**

Abrir `index.html?debugData=2026-07-03` — bloco Copa visível; `?debugData=2026-07-07` — Copa some. Console limpo.
(Promoters ainda invisíveis — telefones vazios. Testar com telefone fake temporário no console se quiser.)

- [ ] **Step 3: Commit**

```bash
git add app.js && git commit -m "feat: renderização da página (blocos, promoters rotativos, listas)"
```

---

### Task 7: Teste de renderização (Playwright)

**Files:**
- Create: `test/render.test.mjs`

Usa telefones fake injetados via `page.addInitScript` pra testar a rotação de ponta a ponta sem depender dos telefones reais.

- [ ] **Step 1: Escrever o teste**

```js
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
```

- [ ] **Step 2: Rodar**

Run: `node test/render.test.mjs`
Expected: `render.test: OK`

- [ ] **Step 3: Rodar também os testes de unidade de novo**

Run: `node --test test/rotacao.test.mjs` → PASS

- [ ] **Step 4: Commit**

```bash
git add test/render.test.mjs && git commit -m "test: renderização end-to-end com datas simuladas"
```

---

### Task 8: Telefones reais + deploy CF Pages + domínio

**Files:**
- Modify: `config.js` (telefones)

- [ ] **Step 1: Pedir ao Rafa os 5 telefones** (bloqueante — parar e perguntar). Preencher `config.js`, formato `5544XXXXXXXXX`. Se algum faltar, deixar `""` (fica fora da rotação, ok).

- [ ] **Step 2: Criar o projeto no CF Pages e deployar**

```bash
BRANCH=$(git branch --show-current)   # conferir: repo foi iniciado com branch padrão local
npx wrangler pages project create butiquim-bio --production-branch=$BRANCH
npx wrangler pages deploy . --project-name=butiquim-bio --branch=$BRANCH
```

Expected: URL `https://butiquim-bio.pages.dev` no output. Se `wrangler` pedir login, o Rafa roda `! npx wrangler login` (interativo).

- [ ] **Step 3: Conferir o preview**

Run: abrir `https://butiquim-bio.pages.dev` (Playwright ou navegador) — página completa, console limpo, promoters na ordem da semana corrente.

- [ ] **Step 4: Custom domain `bio.obutiquim.com.br`**

Via dashboard CF (Pages → butiquim-bio → Custom domains → add `bio.obutiquim.com.br`; a zona `obutiquim.com.br` já está na conta — mesmo fluxo usado pro `lista.obutiquim.com.br`). Alternativa API direta (memória `reference_cloudflare`: MCP tem bug, usar API com token).

- [ ] **Step 5: Verificação final no domínio real**

- `https://bio.obutiquim.com.br` carrega com visual ok (screenshot mobile via Playwright)
- Todos os links de saída conferidos contra o spec (lista sexta/sábado/domingo, reservas, seja promoter, sociais, Copa se ainda na janela)
- `?debugData=2026-07-07` esconde o bloco Copa
- Lighthouse mobile (via Playwright/Chrome DevTools ou PageSpeed) — performance deve ficar ~100 (página estática sem dependências; fecha o item do spec de < 1s em 4G)
- Testar 1 botão de promoter no celular (abre WhatsApp com mensagem)

- [ ] **Step 6: Commit final + atualizar memória**

```bash
git add -A && git commit -m "feat: telefones reais + deploy bio.obutiquim.com.br"
```

Atualizar memória do projeto (`project_butiquim_bio`) com: URL, fluxo de deploy, regra de rotação, e a pendência de trocar o link na bio do Instagram (manual, Rafa decide quando).

---

## Notas para o executor

- **Não** mexer no projeto `butiquim-lista` — isolamento é requisito do spec.
- Ao final, o Beacons continua no ar; a troca do link na bio do Instagram é decisão manual do Rafa (critério de aceite é a página no ar, não a troca).
- Skills relevantes: superpowers:test-driven-development (Task 2), webapp-testing (Tasks 4/7), superpowers:verification-before-completion (Task 8).
