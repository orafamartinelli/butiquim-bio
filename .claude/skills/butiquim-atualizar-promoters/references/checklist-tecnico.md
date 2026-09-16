# Checklist técnico — onde um promoter existe (reverificado 16/09/2026)

> Tudo aqui foi conferido no código/banco em 16/09/2026. O NicoChat (fluxos
> `f71825...`, bot fields, randomizers, cadeia de UTM, `agent_id 1635`) **não
> existe mais** — desligado em 06/09/2026, conta encerrada. Atendimento e
> disparos = **Prontto.AI**, WhatsApp Cloud API oficial, **+55 44 3170-0906**,
> agente **Kim**.

## IDs e caminhos fixos

| Item | Valor |
|---|---|
| Repo da bio | `C:\Users\User\Documents\projetos\butiquim-bio` (`config.js`, `rotacao.js`) |
| CF Pages da bio | projeto `butiquim-bio`, servido em `https://obutiquim.com.br/bio/` via Worker `butiquim-bio-proxy` |
| Cloudflare account_id | `57200dd7ed7c5dfbbd795fdf1956bd36` |
| Repo da lista | `C:\Users\User\Documents\projetos\butiquim-lista` |
| CF Pages da lista | projeto `butiquim-lista` (`lista.obutiquim.com.br`, embedado no site) |
| Repo do site | `C:\Users\User\Documents\projetos\butiquim-site` (páginas dos dias + iframe da lista) |
| Supabase | projeto `ibpxoytlngnxlimxbxzg` (usar SEMPRE o MCP `claude.ai Supabase`) |
| `estab_id` do Butiquim | `8f249842-cede-42f1-9e49-3e9324f7d8aa` |
| Grupo "Novos Promoters - TIME BUTICA" | `120363425359400605-group` (também em `butiquim_social_config.grupo_promoters_producao`) |
| Grupo "🏆 Placar Promoters" | `120363430010372152-group` (`butiquim_social_config.grupo_disputa`) |
| Grupos de reserva de mesa | sexta `120363420401970586-group` · sábado `120363420199715359-group` · domingo `554484232574-1574289883` · quinta `120363408788096065-group` |
| Grupo "ADM e GERÊNCIA" | `120363291237972375-group` — **gestão; promoter não entra** |
| Prontto (conta de disparo) | "O Butiquim - Atendimento" `70c7a5b1-e33b-46dc-9868-eec4e2dd0393`, WABA `1599027091586241` |

## Os formatos de telefone (não confundir)

Dado `+55 44 9105-5861`:

1. **`config.js` da bio e `hub_grupo_remetentes`** → `554491055861`
   (55 + DDD + 8 dígitos, sem "+", sem 9º dígito). É como o webhook da Z-API
   entrega o remetente do grupo; o join do Hub normaliza os dígitos dos 2 lados.
2. **MCP Z-API (`group-add-participant` / `send-text`)** → só dígitos, DDI+DDD+
   número, sem máscara. Use a mesma grafia do item 1; se o participante não
   entrar, tente a variante com o 9 (`5544991055861`).
3. **Prontto / Cloud API** → `phoneComDDI()` do `_worker.js`: 10/11 dígitos
   ganham `55` na frente; 12/13 dígitos que já começam com `55` passam direto.
   Você não monta isso na mão nesta skill.

## 1. Bio — `butiquim-bio/config.js`

```js
promoters: [
  { nome: 'Luana Bido',  telefone: '554498766957', ativo: true },
  { nome: 'Mari',        telefone: '554497077075', ativo: true },
  { nome: 'Maria Julia', telefone: '554498708463', ativo: true },
  { nome: 'Medina',      telefone: '554491055861', ativo: true },
  { nome: 'Gabriel',     telefone: '554491749173', ativo: true, fixoNoFinal: true },
],
```

- `ativo:false` ou telefone vazio = fora da rotação.
- `fixoNoFinal:true` = fora do giro, sempre no fim da lista.
- O giro é calculado em `rotacao.js` (`ordemRotacao`): round-robin semanal com
  virada **segunda 05:00 -03:00** (época `2026-01-05T05:00:00-03:00`).
  **Não precisa editar `rotacao.js`** pra entrar/sair promoter — ele lê o array.
- Debug sem esperar a semana virar: `?debugData=YYYY-MM-DD[THH:mm]`.
- Testes: `npm test` (rotação) e `npm run test:render` (Playwright).

**Deploy** (`package.json` → `npx wrangler pages deploy . --project-name=butiquim-bio`):

```powershell
cd C:\Users\User\Documents\projetos\butiquim-bio
$env:CLOUDFLARE_ACCOUNT_ID = "57200dd7ed7c5dfbbd795fdf1956bd36"
$env:CLOUDFLARE_API_TOKEN  = (node C:\Users\User\Documents\projetos\butiquim-lista\renova-token.mjs)
npm run deploy
```

(Alternativa: o token Pages:Edit de `.credentials\cloudflare-api-token.json`.)
Conferir no ar: `https://obutiquim.com.br/bio/` **com barra final**.

⚠️ **Armadilha histórica:** existe uma cópia duplicada e desatualizada da bio em
`butiquim-site/site/bio/`. O Worker `butiquim-bio-proxy` força `/bio*` a vir do
Pages `butiquim-bio`, então a cópia é código morto — mas se alguém remover o
proxy, ela volta a aparecer. Nunca edite os dois; edite o repo `butiquim-bio`.

## 2 e 3. Lista — `PROMOTERS_OFICIAIS` (DUPLICADA, manter igual)

```js
const PROMOTERS_OFICIAIS = new Set(['gabriel','luana','luanabido','mari','mariajulia','medina']);
```

- `butiquim-lista/_worker.js` ~linha 23 → usada por `normalizaPromoter()`:
  `utm_source` que não bate EXATO vira **`'Casa'`** no banco/ranking.
- `butiquim-lista/listasbutiquim/conferencia/index.html` ~linha 255 → mesma
  constante, usada por `normPromoter()` no fechamento de comissão.
- Já ficaram dessincronizadas (03/08/2026): o Medina existia num arquivo e não
  no outro, e o cadastro dele virava "Casa" no cálculo — ou seja, sem comissão.
  **Editar os dois no mesmo commit.**
- Quem é quem (confirmado pelo telefone da bio): `mari` = Mariana Zalasko
  (@m.zalasko) · `mariajulia` = Maria Julia (@mari_juu_l) · `luanabido` = Luana
  Bido · `medina` = @edaimedina · `gabriel` = @gabrieellgoncalves.
- `gabriel` permanece na lista mesmo fora do giro: ele não recebe distribuição
  da casa, só o que traz por esforço próprio.

**Deploy:**

```powershell
cd C:\Users\User\Documents\projetos\butiquim-lista
$env:CLOUDFLARE_API_TOKEN = (node renova-token.mjs)
node deploy-lista.mjs
```

🚨 **NUNCA `wrangler pages deploy .` neste repo.** O `.assetsignore` não vale no
Pages e o comando publica a pasta inteira (incidente 22/07/2026: `.dev.vars`
ficou público). `deploy-lista.mjs` copia só `_worker.js`, `_routes.json`,
`niver.mjs`, as 6 pastas de dia e `listasbutiquim/` pra uma pasta temporária e
deploya de lá.

## 4. Grupos de WhatsApp (MCP `claude.ai MCP z-api`)

```
group-add-participant    { groupId, phones: ["554491055861"], autoInvite: true }
group-remove-participant { groupId, phones: ["554491055861"] }
group-metadata           { groupId }   ← sempre conferir depois
```

Instância = a do Rafa (é o bot que posta os mapas). Saúde da instância:
`session: true` (só `connected: true` não basta).

## 5. Hub Reservas — `hub_grupo_remetentes`

Criada na migration `0051_grupo_remetentes_e_reservado_por.sql`:

```sql
create table if not exists hub_grupo_remetentes (
  estab_id uuid not null references hub_estabelecimentos(id) on delete cascade,
  telefone text not null,          -- dígitos (o join normaliza os 2 lados)
  nome     text not null,
  primary key (estab_id, telefone)
);
```

- RLS ligado. Policy de leitura `grupo_remetentes_sel` (migration `0052`) só pro
  gerente do próprio estabelecimento; escrita = service_role (o MCP Supabase já é).
- Usada pela RPC `get_mapa_mesas_grupo` → `reservado_por`. No grupo aparece como
  **iniciais** (`35 - Cliente A - LB`); no painel, como **primeiro nome** na
  coluna "Por".
- Sem a linha, o promoter **ainda consegue lançar mesa** pelo grupo — só sai sem
  identificação.

Inserir / atualizar:

```sql
insert into hub_grupo_remetentes (estab_id, telefone, nome)
values ('8f249842-cede-42f1-9e49-3e9324f7d8aa', '5544XXXXXXXX', 'Fulano')
on conflict (estab_id, telefone) do update set nome = excluded.nome;
```

Remover (só se a pessoa nunca operou):

```sql
delete from hub_grupo_remetentes
where estab_id = '8f249842-cede-42f1-9e49-3e9324f7d8aa' and telefone = '5544XXXXXXXX';
```

**Comandos que o promoter usa no grupo:** `Número - Nome` (reserva) e
`Número - cancelar` (só cancela reserva de origem `promoter`; reserva feita pelo
cliente é protegida, a menos que o remetente esteja em `GRUPO_ADMIN_TELEFONES`).
Ver `[[project_hub_reservas_mesas]]`.

## 6. Links de rastreio

O formulário lê **`utm_source`** da URL (`sexta/index.html` linha ~327:
`_params.get('utm_source')`) e manda no payload como `promoter`; o `_worker.js`
grava em `butiquim_cadastros.promoter` / `promoter_origem`.

Padrão em uso:

```
https://obutiquim.com.br/{rota}/?utm_source={slug}&utm_medium=whatsapp&utm_campaign={dia}
```

| Dia | Rota viva | Alias |
|---|---|---|
| Quarta | `/quarta/` | `{slug}-lista-quarta` |
| Quinta | `/quinta/` | `{slug}-lista-quinta` |
| Sexta | `/sexta-feira/` | `{slug}-lista-sexta` |
| Sábado | `/sabado/` | `{slug}-lista-sabado` |
| Domingo | `/domingo/` | `{slug}-lista-domingo` |
| Véspera | `/feriado/` | `{slug}-lista-vespera` |

`/sexta/` e `/vespera/` existem só como página de redirect JS (preservam a query);
`/quarta-feira/` e `/quinta-feira/` **não existem mais** — link antigo assim cai
na home e perde o cadastro e o rastreio (bug real corrigido em 01/08/2026).

Encurtadores, tokens e pegadinhas: `[[reference_encurtadores_butiquim]]`.
Resumo: TinyURL é o principal (alias com hífen funciona no grátis, pacing 2,5s)
e **não deixa editar nem apagar alias** — link errado só se conserta criando um
`-v2`. Bitly pelo MCP (`mcp__claude_ai_Bitly__bitly_create_short_link`) funciona,
mas a cota grátis estoura em ~15 links/mês. Planilha-fonte:
`Downloads\Gerador-Links-UTM-Butiquim.xlsx`.

## 7. Disputa / placar — `butiquim_social_config.disputa_promoters`

```sql
create table butiquim_social_config ( chave text primary key, valor text not null );
```

`valor` é **JSON dentro de texto**. O receptor de menções
(`butiquim-social/workflows/butiquim_disputa_receptor_mencoes.json`) faz
`JSON.parse(cfg.disputa_promoters)` e resolve
`promoter_slug = mapa[ig_username.toLowerCase()]`; quem não está no mapa fica
com `promoter_slug: null` (a menção é guardada como alcance orgânico, mas não
pontua pra ninguém). O placar (`butiquim_disputa_placar`, diário 18h) usa esse
slug + os cadastros da lista.

```sql
-- ler
select valor from butiquim_social_config where chave = 'disputa_promoters';
-- adicionar
update butiquim_social_config
set valor = (valor::jsonb || '{"instagram":"slug"}'::jsonb)::text
where chave = 'disputa_promoters';
-- remover
update butiquim_social_config
set valor = (valor::jsonb - 'instagram')::text
where chave = 'disputa_promoters';
```

Gate `disputa_lancada` ('true' hoje) controla se os promoters veem as mensagens
da disputa. Regras e níveis de bônus: `butiquim-social/estudio/MUDANCAS-19-08-AVISOS.md`.

## 8. Kim (Prontto.AI) — sem API nesta skill

A lista de promoters oficiais da Kim vive **dentro do prompt**, que o Rafa cola
à mão no painel da Prontto. Arquivo-fonte:
`Downloads\O Butiquim - Materiais\09 - Documentos e Diversos\PROMPT-AGENTE-Kim-Butiquim-PRONTTO-v2-*.md`.
**Não tente editar o agente por API.** Atualize o arquivo (se existir) e avise
o Rafa, em texto explícito, que ele precisa recolar. Ver
`[[project_butiquim_prontto_disparos]]`.
