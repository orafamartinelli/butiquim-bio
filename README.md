# butiquim-bio

Página de bio do Instagram do O Butiquim (`@obutiquim`). HTML/CSS/JS estáticos, sem build.
Vai pro ar no Cloudflare Pages (projeto `butiquim-bio`, branch de produção `master`) e é
servida ao público em `https://obutiquim.com.br/bio/` por um worker proxy.

## Deploy

Desde 16/09/2026 o deploy é **automático**: todo push na branch `master` dispara
`.github/workflows/deploy.yml`, que publica a pasta no Pages usando o token permanente do
Cloudflare (secret `CLOUDFLARE_API_TOKEN` do repositório), faz smoke test em
`https://butiquim-bio.pages.dev/` e `https://obutiquim.com.br/bio/` (barra final sempre —
sem ela o Pages responde 308) e avisa o Rafa no WhatsApp se algum passo falhar.
Para publicar sem push: Actions → deploy → Run workflow.

O deploy manual continua possível:

```bash
npm run deploy   # npx wrangler pages deploy . --project-name=butiquim-bio
```

O **worker proxy** (`scripts/deploy-worker-proxy.mjs`), que liga `obutiquim.com.br/bio/` ao
Pages, NÃO entra no deploy automático: só é publicado na mão quando o roteamento muda.

## Testes

```bash
npm test              # rotação dos links
npm run test:render   # render com Playwright
```
