// Worker proxy pra obutiquim.com.br/bio/* → butiquim-bio.pages.dev, mesmo padrão
// usado nas rotas de orafamartinelli.com.br (ver reference_cloudflare.md). Criado
// 29/07 pra resolver o cache de borda de ~4h que a config anterior (custom domain
// direto do provedor) deixava, sem permissão de purge pro token do dia a dia —
// como Worker, a gente controla o Cache-Control da resposta e desliga o cache de
// subrequest (cf.cacheTtl=0), então uma mudança em config.js fica visível na hora.
//
// Uso: node scripts/deploy-worker-proxy.mjs [cloudflare_oauth_token]
// Sem argumento, lê o oauth_token do wrangler (renove antes com butiquim-lista/renova-token.mjs).

import { readFileSync } from "node:fs";

function tokenDoWrangler() {
  try {
    return readFileSync("C:/Users/User/.wrangler/config/default.toml", "utf8").match(/oauth_token\s*=\s*"([^"]+)"/)[1];
  } catch {
    return null;
  }
}

const TOKEN = process.argv[2] || tokenDoWrangler();
if (!TOKEN) {
  console.error("Uso: node deploy-worker-proxy.mjs <token>");
  process.exit(1);
}

const ACCOUNT_ID = "57200dd7ed7c5dfbbd795fdf1956bd36";
const ZONE_ID = "534d0506b86aec2ff76d19c2faf3978a"; // obutiquim.com.br
const WORKER_NAME = "butiquim-bio-proxy";
const ROTAS = ["obutiquim.com.br/bio*", "obutiquim.com.br/vagas*", "obutiquim.com.br/promoter*"];

const SCRIPT = `
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

const ORIGEM_BIO = 'https://butiquim-bio.pages.dev';
const PREFIXO_BIO = '/bio';

// /vagas e /promoter (29/07): links curtos e memoráveis do domínio do bar pra
// compartilhar (Instagram, WhatsApp, impresso) — redirecionam pro formulário real,
// que continua vivendo no QG (orafamartinelli.com.br/qg/f/...). Dado cai no mesmo
// lugar de sempre; só a URL visível ao candidato fica com a cara do Butiquim.
const REDIRECTS = {
  '/vagas': 'https://orafamartinelli.com.br/qg/f/trabalhe-conosco/',
  '/promoter': 'https://orafamartinelli.com.br/qg/f/vagas-de-promoter/',
};

async function handleRequest(request) {
  const url = new URL(request.url);

  // /vagas/<cargo> (29/09/2026): formulário exclusivo de uma vaga, servido pelo SITE
  // no domínio do bar (butiquim-site/_worker.js, lista FORMULARIOS_QG). fetch(request)
  // sai desta rota e cai na origem, que é o Pages do site.
  if (url.pathname.startsWith('/vagas/') && url.pathname.length > '/vagas/'.length) {
    return fetch(request);
  }

  for (const [prefixo, destino] of Object.entries(REDIRECTS)) {
    if (url.pathname === prefixo || url.pathname === prefixo + '/') {
      return Response.redirect(destino + url.search, 302);
    }
  }

  // Sem isso, /bio (sem barra) devolve o HTML mas o navegador resolve os
  // assets relativos (config.js, styles.css...) contra a raiz do domínio
  // em vez de /bio/ — carrega o site institucional errado e a página fica
  // em branco. Precisa da barra ANTES de servir o conteúdo.
  if (url.pathname === PREFIXO_BIO) {
    return Response.redirect(url.origin + PREFIXO_BIO + '/' + url.search, 301);
  }

  let caminho = url.pathname;
  if (caminho.startsWith(PREFIXO_BIO)) caminho = caminho.slice(PREFIXO_BIO.length) || '/';
  const destinoBio = ORIGEM_BIO + caminho + url.search;

  const resposta = await fetch(destinoBio, {
    method: request.method,
    headers: request.headers,
    body: (request.method === 'GET' || request.method === 'HEAD') ? undefined : request.body,
    cf: { cacheTtl: 0, cacheEverything: false },
  });

  const nova = new Response(resposta.body, resposta);
  nova.headers.set('Cache-Control', 'no-store');
  return nova;
}
`;

async function cf(method, path, body, contentType) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": contentType || "application/json",
    },
    body,
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${method} ${path} -> ${JSON.stringify(json.errors)}`);
  return json.result;
}

console.log("1) publicando worker...");
await cf(
  "PUT",
  `accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}`,
  SCRIPT,
  "application/javascript",
);
console.log("   ok:", WORKER_NAME);

console.log("2) conferindo rotas existentes...");
const rotasExistentes = await cf("GET", `zones/${ZONE_ID}/workers/routes`);
for (const pattern of ROTAS) {
  const jaExiste = rotasExistentes.find((r) => r.pattern === pattern);
  if (jaExiste) {
    console.log(`   ${pattern}: já existe, atualizando...`);
    await cf("PUT", `zones/${ZONE_ID}/workers/routes/${jaExiste.id}`, JSON.stringify({ pattern, script: WORKER_NAME }));
  } else {
    console.log(`   ${pattern}: criando...`);
    await cf("POST", `zones/${ZONE_ID}/workers/routes`, JSON.stringify({ pattern, script: WORKER_NAME }));
  }
}
console.log("Pronto:", ROTAS.join(", "));
