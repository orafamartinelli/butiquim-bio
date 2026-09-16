---
name: butiquim-atualizar-promoters
description: Adiciona ou remove um promoter do ecossistema O Butiquim (bio, lista/conferência de comissão, grupos de WhatsApp, hub_reservas, links de rastreio, disputa do placar e prompt da Kim na Prontto). Use esta skill sempre que o usuário pedir "novo promoter", "adicionar promoter no Butiquim", "remover promoter", "trocar promoter", "tirar [nome] dos promoters", "atualizar promoters do butiquim" ou qualquer variação de inserir/remover uma pessoa do time de promoters do Butiquim. Não usar para outros clientes nem para funcionários/gestores (André, Victor) que não são promoters de lista.
---

# Atualizar promoters do Butiquim (adicionar ou remover)

## O que este playbook resolve

Um promoter "existe" em **7 lugares que não se falam entre si**. Toda vez que
entra ou sai alguém, todos precisam ser tocados ou a pessoa fica "meio dentro"
(o caso clássico: aparece na bio, traz cadastro, e o cadastro cai como "Casa"
no fechamento — ela trabalha de graça).

| # | Onde | Arquivo / sistema |
|---|---|---|
| 1 | Bio (`obutiquim.com.br/bio/`) | `butiquim-bio/config.js` |
| 2 | Lista — roteamento de comissão | `butiquim-lista/_worker.js` (`PROMOTERS_OFICIAIS`) |
| 3 | Lista — conferência/fechamento | `butiquim-lista/listasbutiquim/conferencia/index.html` (mesma constante) |
| 4 | Grupos de WhatsApp | time, placar e os 4 grupos de reserva de mesa |
| 5 | Hub Reservas | tabela `hub_grupo_remetentes` (quem pode lançar mesa pelo grupo) |
| 6 | Links de rastreio | TinyURL/Bitly `{promoter}-lista-{dia}` → UTM da lista |
| 7 | Disputa/placar | `butiquim_social_config` chave `disputa_promoters` (mapa de @) |

Mais um passo que **não é automatizável**: a Kim (agente da Prontto.AI) conhece
os promoters pelo **prompt que só o Rafa cola no painel da Prontto**. A skill
apenas LEMBRA de avisar.

> ⚠️ **NicoChat foi DESLIGADO em 06/09/2026 e a conta encerrada.** Não existe
> mais cadeia de condições UTM, randomizer orgânico, nós "Cliente Mesa - X",
> bot field, `agent_id`, fluxo `f71825...` nem `channel_sub_flow_publish`.
> Atendimento e disparos do Butiquim hoje = **Prontto.AI** (WhatsApp Cloud API
> oficial, **+55 44 3170-0906**, agente **Kim**). Se achar instrução de
> NicoChat em qualquer doc antigo, ignore e corrija o doc.

Leia **`references/checklist-tecnico.md`** antes de tocar em qualquer sistema
(IDs fixos, formatos de telefone, comandos prontos) e
**`references/estado-atual.md`** (doc vivo: quem está no time hoje e o que a
última execução deixou pendente). **Atualize os dois ao final.**

## Antes de começar (sempre)

```powershell
git -C C:\Users\User\Documents\projetos\butiquim-bio pull
```

A cópia canônica desta skill vive no repo `butiquim-bio` em
`.claude/skills/butiquim-atualizar-promoters/` (a cópia em
`C:\Users\User\.claude\skills\` é só o gatilho local — mantenha as duas iguais).

## Perguntas pra fazer ANTES de mexer em qualquer sistema

Pra **ADICIONAR** (pode mandar tudo numa mensagem só — o Rafa costuma responder
tudo de uma vez):
1. Nome + telefone (com DDD, do jeito que ele mandar — você normaliza) + **@ do
   Instagram** (precisa pro mapa da disputa).
2. Entra no giro semanal da bio ou fica fixo no final (como o Gabriel,
   `fixoNoFinal:true`)? Se giro, em que posição da fila?
3. Vai lançar reserva de mesa pelos grupos do Hub (sexta/sábado/domingo/quinta)
   ou só lista/bio?
4. Entra na disputa/placar dos promoters (bônus por menção + cadastros)?
5. **Ativar tudo de uma vez ou só os bastidores agora?** O Rafa já pediu
   faseamento antes — pergunte por padrão, não assuma.

Pra **REMOVER**: tira só da rotação (para de receber lead novo, mas o histórico
de comissão fica) ou apaga de tudo? **Padrão = sai da rotação, histórico fica.**
Só apague dados (linha do `hub_grupo_remetentes`, entrada da disputa) se a
pessoa nunca operou — foi o que se fez com o Aiko, que desistiu antes de ativar.

---

## Sequência — ADICIONAR

Marque cada item conforme executa. O **slug** do promoter (minúsculo, sem acento
e sem espaço — ex.: `medina`, `mariajulia`) é o mesmo em todos os lugares: é o
valor de `utm_source` que vai no link dele.

### [ ] 1. Bio — `butiquim-bio/config.js`

Adicione no array `promoters`, na posição combinada (antes do Gabriel, que é
`fixoNoFinal`):

```js
{ nome: 'Fulano', telefone: '5544XXXXXXXX', ativo: true },
```

- `telefone` = **55 + DDD + número, sem "+"** (formato 2 do checklist).
- `fixoNoFinal: true` só se ele NÃO entra no giro semanal.
- O giro é round-robin semanal calculado em `rotacao.js` (vira **segunda 05:00
  -03:00**, época `2026-01-05T05:00:00-03:00`) — só entram no sorteio os que têm
  `ativo:true` e **não** têm `fixoNoFinal`. Não mexa em `rotacao.js`.

Testar e publicar:

```powershell
cd C:\Users\User\Documents\projetos\butiquim-bio
npm test
$env:CLOUDFLARE_ACCOUNT_ID = "57200dd7ed7c5dfbbd795fdf1956bd36"
$env:CLOUDFLARE_API_TOKEN  = (node C:\Users\User\Documents\projetos\butiquim-lista\renova-token.mjs)
npm run deploy            # npx wrangler pages deploy . --project-name=butiquim-bio
```

Depois confira **`https://obutiquim.com.br/bio/`** (com barra final) — é um
Worker proxy (`butiquim-bio-proxy`) que busca do Pages `butiquim-bio`.
⚠️ Existe uma cópia órfã e desatualizada em `butiquim-site/site/bio/` — **não
edite ela**, é código morto desde que o proxy entrou.

### [ ] 2. Lista — `PROMOTERS_OFICIAIS` nos DOIS arquivos

Essa constante decide se o cadastro conta pro promoter ou vira **"Casa"**
(= sem comissão). Ela está **duplicada** e os dois lados precisam ficar
idênticos (já saíram dessincronizados uma vez e o Medina perdeu comissão):

- `C:\Users\User\Documents\projetos\butiquim-lista\_worker.js` (~linha 23)
- `C:\Users\User\Documents\projetos\butiquim-lista\listasbutiquim\conferencia\index.html` (~linha 255)

Hoje (confira antes de editar):

```js
const PROMOTERS_OFICIAIS = new Set(['gabriel','luana','luanabido','mari','mariajulia','medina']);
```

Adicione o slug novo **nos dois**. O match é exato e em minúsculo — se o
promoter usa duas grafias (ex.: `luana` e `luanabido`), inclua as duas.

Publicar (lista):

```powershell
cd C:\Users\User\Documents\projetos\butiquim-lista
$env:CLOUDFLARE_API_TOKEN = (node renova-token.mjs)
node deploy-lista.mjs
```

🚨 **NUNCA** `wrangler pages deploy .` aqui — publica a pasta inteira na CDN
(o `.assetsignore` não vale no Pages; em 22/07/2026 isso vazou o `.dev.vars`).
`deploy-lista.mjs` publica só a lista fechada de arquivos.

### [ ] 3. Hub Reservas — `hub_grupo_remetentes`

É a tabela que resolve "quem lançou a mesa no grupo" (aparece como iniciais no
grupo e como primeiro nome na coluna "Por" do painel). Sem a linha, o promoter
**consegue lançar mesa**, mas sai sem identificação.

Pelo MCP `claude.ai Supabase`, projeto `ibpxoytlngnxlimxbxzg`:

```sql
insert into hub_grupo_remetentes (estab_id, telefone, nome)
values ('8f249842-cede-42f1-9e49-3e9324f7d8aa', '5544XXXXXXXX', 'Fulano')
on conflict (estab_id, telefone) do update set nome = excluded.nome;
```

- PK = `(estab_id, telefone)`; `telefone` no **mesmo formato da bio**
  (55+DDD+8 dígitos) — é como o webhook da Z-API entrega, e o join normaliza
  os dígitos dos dois lados.
- RLS ligado: leitura do painel via policy `grupo_remetentes_sel`; escrita só
  service_role (o MCP já é service_role).

### [ ] 4. Grupos de WhatsApp (MCP `claude.ai MCP z-api`)

`group-add-participant` com `{ groupId, phones: ["55449XXXXXXXX"], autoInvite: true }`.
Telefone **sem formatação** (DDI+DDD+número).

| Grupo | groupId | Quando adicionar |
|---|---|---|
| Novos Promoters - TIME BUTICA | `120363425359400605-group` | sempre |
| 🏆 Placar Promoters | `120363430010372152-group` | só se entra na disputa |
| Reservas SEXTA | `120363420401970586-group` | se lança mesa |
| Reservas SÁBADO | `120363420199715359-group` | se lança mesa |
| Reservas DOMINGO | `554484232574-1574289883` | se lança mesa (id em formato antigo) |
| Reservas QUINTA | `120363408788096065-group` | se lança mesa |

Confirme com `group-metadata` depois de adicionar. Se o número entrar mas não
aparecer, tente a outra grafia do telefone (com/sem o 9º dígito).
**Nunca** adicione promoter no grupo "ADM e GERÊNCIA" (`120363291237972375-group`).

### [ ] 5. Links de rastreio (6 por promoter)

Padrão do destino (o form lê `utm_source` da URL e grava como promoter):

```
https://obutiquim.com.br/{rota}/?utm_source={slug}&utm_medium=whatsapp&utm_campaign={dia}
```

Rotas reais do site (conferidas em `butiquim-site/site/`):

| Dia | Rota | Alias curto do link |
|---|---|---|
| Quarta | `/quarta/` | `{slug}-lista-quarta` |
| Quinta | `/quinta/` | `{slug}-lista-quinta` |
| Sexta | `/sexta-feira/` | `{slug}-lista-sexta` |
| Sábado | `/sabado/` | `{slug}-lista-sabado` |
| Domingo | `/domingo/` | `{slug}-lista-domingo` |
| Véspera | `/feriado/` | `{slug}-lista-vespera` |

(`/sexta/`, `/quarta-feira/`, `/quinta-feira/` e `/vespera/` são redirects ou
rotas mortas — use sempre as da tabela; a query string é preservada nos
redirects, mas link certo evita perda.)

Encurtar em **TinyURL** (principal) e um backup:
- TinyURL: `POST https://api.tinyurl.com/create` (Bearer), body
  `{url, domain:"tinyurl.com", alias:"{slug}-lista-{dia}"}`. Token e pegadinhas
  em `[[reference_encurtadores_butiquim]]` — **leia do arquivo, nunca cole
  token em comando de shell**. Pacing ~2,5s entre chamadas.
- ⚠️ O plano grátis do TinyURL **não deixa editar nem apagar alias** — se
  errar, o jeito é criar um alias novo (convenção: sufixo `-v2`) e o errado
  fica vivo pra sempre.
- Alternativa com MCP: `mcp__claude_ai_Bitly__bitly_create_short_link`
  (custom back-half funciona no grátis, mas a **cota mensal estoura em ~15
  links/mês** — bom só como 3ª via).

Depois: **teste cada link** (tem que dar 301 e abrir o formulário do dia certo)
e registre na planilha `Downloads\Gerador-Links-UTM-Butiquim.xlsx` (abas
"Gerador" e "Links Curtos"), que é a fonte de verdade dos links de todo mundo.

### [ ] 6. Mandar os links pro próprio promoter

Via `mcp__claude_ai_MCP_z-api__send-text` **no WhatsApp pessoal dele** — não
espere ele pedir. Mensagem organizada por dia (um link por linha, identificado),
explicando que **cada link é de um dia específico** e pedindo pra salvar os 6
em algum lugar de acesso rápido (respostas rápidas do WhatsApp Business, notas
fixadas). Depois **confirme explicitamente ao Rafa que os links foram enviados**.

### [ ] 7. Disputa / placar — mapa `disputa_promoters`

O robô do placar (n8n `butiquim_disputa_placar` + receptor
`butiquim_disputa_receptor_mencoes`, ver `butiquim-social/`) identifica quem
marcou o @obutiquim cruzando o **@ do Instagram** com esse mapa. Fora do mapa =
`promoter_slug null` = a menção não pontua pra ninguém.

O valor é **JSON dentro de uma coluna `text`** (`butiquim_social_config`,
`chave='disputa_promoters'`, mesmo projeto Supabase). Leia, edite e regrave:

```sql
select valor from butiquim_social_config where chave = 'disputa_promoters';

update butiquim_social_config
set valor = (valor::jsonb || '{"instagram_do_promoter":"slug"}'::jsonb)::text
where chave = 'disputa_promoters';
```

Chave = @ do Instagram **em minúsculo, sem @**; valor = o mesmo slug do
`PROMOTERS_OFICIAIS`.

### [ ] 8. Kim (Prontto.AI) — avisar o Rafa, não tentar por API

A Kim só conhece os promoters pelo **prompt colado no painel da Prontto**
(número 0906, conta "O Butiquim - Atendimento"). **Não existe caminho de API
nesta skill pra isso.** Faça duas coisas:

1. Atualize o arquivo-fonte do prompt (`Downloads\O Butiquim - Materiais\
   09 - Documentos e Diversos\PROMPT-AGENTE-Kim-Butiquim-PRONTTO-v2-*.md`),
   se ele existir, com o nome + telefone do promoter na lista oficial.
2. **Avise o Rafa, em texto explícito**, que ele precisa colar o prompt
   atualizado no painel da Prontto — senão a Kim segue citando o time antigo.

### [ ] 9. Registrar

- `references/estado-atual.md` (neste repo) — roster novo, o que ficou pendente,
  data.
- Memória: `[[project_promoters_butiquim]]` e `[[project_butiquim_bio]]`
  (Read antes de editar, no mesmo turno — regra da casa).
- `git -C C:\Users\User\Documents\projetos\butiquim-bio commit + push` da skill,
  e replicar a mesma versão em `C:\Users\User\.claude\skills\butiquim-atualizar-promoters\`.

---

## Sequência — REMOVER

Mesma lista ao contrário, começando pelo que reduz exposição mais rápido:

1. **[ ] Bio** (`config.js`): `ativo: false` (ou apagar a linha) + `npm run deploy`
   — some da rotação pública em ~1 min.
2. **[ ] `PROMOTERS_OFICIAIS` nos 2 arquivos** + `node deploy-lista.mjs`. Sem
   isso, cadastro que ainda chegar pelo link antigo dela continua contando como
   promoter ativo no ranking/comissão. (Depois da remoção, esses cadastros
   passam a cair como "Casa" — que é o desejado.)
3. **[ ] Grupos de WhatsApp**: `group-remove-participant` nos grupos em que ela
   está (time, placar, grupos de mesa). Confira com `group-metadata`.
4. **[ ] Disputa**: tirar o @ dela do mapa `disputa_promoters`
   (`valor::jsonb - 'instagram_dela'`).
5. **[ ] Prompt da Kim**: tirar o nome da lista oficial e **avisar o Rafa pra
   recolar no painel da Prontto**.
6. **[ ] `hub_grupo_remetentes`: NÃO apagar** se ela já lançou mesa — é
   histórico/auditoria e não atrapalha (a Nicolly ficou assim). Apague só se
   ela nunca operou (caso Aiko).
7. **[ ] Links de rastreio**: não dá pra matar alias do TinyURL. Eles continuam
   funcionando e levando pro formulário — o cadastro simplesmente vira "Casa"
   depois do passo 2. Se algum link dela estiver impresso/fixado em algum lugar,
   avise o Rafa.
8. **[ ] Registrar** (mesmo passo 9 do adicionar).

---

## Verificação final (não pule)

- [ ] `https://obutiquim.com.br/bio/` mostra (ou não mostra) a pessoa.
- [ ] Um cadastro de teste pelo link dela aparece com o promoter certo em
      `https://orafamartinelli.com.br/listasbutiquim/conferencia/` — não como "Casa".
- [ ] `group-metadata` confirma entrada/saída dos grupos.
- [ ] `select * from hub_grupo_remetentes where estab_id = '8f249842-...'`
      mostra o estado esperado.
- [ ] Rafa avisado sobre o prompt da Kim.

Relacionado: [[project_promoters_butiquim]], [[project_butiquim_bio]],
[[project_hub_reservas_mesas]], [[reference_encurtadores_butiquim]],
[[project_butiquim_prontto_disparos]].

---
⚠️ A CÓPIA CANÔNICA deste playbook vive no repo `orafamartinelli/butiquim-bio`
em `.claude/skills/butiquim-atualizar-promoters/` (desde 14/08/2026), pra
funcionar também nas sessões da nuvem/celular. Antes de executar: `git pull`
nesse repo e leia o `references/estado-atual.md` DE LÁ. Ao final: atualize,
commit + push, e copie a mesma versão pra `C:\Users\User\.claude\skills\`.
