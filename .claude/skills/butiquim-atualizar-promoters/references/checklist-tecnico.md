# Checklist técnico — onde um promoter existe (mapeado 29/07/2026)

## IDs fixos que você vai precisar

- **NicoChat:** workspace_id `61425` ("O Butiquim"), canal `flow_ns` `f71825`.
- **Fluxo principal de roteamento:** `f71825s2046453` ("API - ✅📋 Confirmação
  de cadastro na Lista") — é aqui que vive a cadeia de UTM, os nós "Cliente
  Mesa - X" e o randomizer orgânico.
- **Fluxo de aniversário (randomizer separado):** `f71825s2046573` ("1. 🎈
  Niver - Fluxo Central").
- **Fluxo legado/morto, NÃO MEXER:** `f71825s2046457` ("API - Avisar
  Promoter - Interessado Reserva") — confirmado pelo Rafa em 29/07 que está
  desativado (foi embutido em outro fluxo).
- **Agente Kim:** `agent_id 1635`, `ai_agent_ns f71825ag1573`, mesmo canal.
- **Grupo WhatsApp "Novos Promoters - TIME BUTICA":**
  `120363425359400605-group` — recebe o aviso "Cliente Precisando de Mesa"
  (nó `f71825n450796947`, POST Z-API `send-text` com array `mentioned`).
- **Grupo "ADM e GERÊNCIA - O Butiquim":** `120363291237972375-group` — só
  gestão, promoter comum não entra aqui.
- **Grupos de mesa (hub_reservas, um por dia):** sexta
  `120363420401970586-group`, sábado `120363420199715359-group`, domingo
  `554484232574-1574289883`, quinta-teste `120363408788096065-group`.
- **Supabase projeto:** `ibpxoytlngnxlimxbxzg`. Tabela `hub_grupo_remetentes`
  (colunas `estab_id`, `telefone`, `nome`); `estab_id` do Butiquim =
  `8f249842-cede-42f1-9e49-3e9324f7d8aa`.
- **Bio:** repo `Documents/projetos/butiquim-bio`, arquivo `config.js`,
  array `promoters`. Deploy = `npm run deploy` (wrangler; renovar oauth
  token antes — ver `[[reference_cloudflare]]`).
- **Template WhatsApp usado no aviso ao promoter:**
  `aviso_promoter_cliente_quer_mesa_butica` (`wa_uid`
  `9df640e15d141cccebe1d3e914db7de2`, `namespace`
  `08247182_6e5d_4856_b887_19742cf77062`, `lang pt_BR`) — params
  `BODY_{{1}}`=nome do cliente, `BODY_{{2}}`=telefone do cliente.

## Os 3 formatos de telefone (não confundir)

Dado um número real, ex. `+55 44 9773-8953`:
1. **Bot field / botão WhatsApp / `to_number` do template** (NicoChat):
   `4497738953` — DDD + 8 dígitos, SEM "55", SEM "+".
2. **`config.js` da bio / `hub_grupo_remetentes`**: `554497738953` — "55" +
   DDD + 8 dígitos, sem "+" (isso é o "SEM 9º dígito" que a memória antiga
   menciona — na prática é só que o número de 8 dígitos já é o que existe,
   não tem um 9 extra prefixado).
3. **Array `mentioned` do aviso de grupo** (Z-API): CADA pessoa entra em
   **2 formatos** — com um "9" extra inserido (`554499...` → 13 dígitos,
   ex. `5544991749173`) E sem (`554491749173`, 12 dígitos) — pra cobrir os
   2 jeitos que o WhatsApp pode ter salvo o contato. Só mexer aqui na
   Fase 2 (ativação).

## PEGADINHA BLOQUEANTE — nó de notificação ao promoter não é criável via API

Os nós existentes "Cliente Mesa - {Nome}" (ação) mandam o template pro
promoter via um step de ação `type:"whatsapp_template"`. Esse kind **NÃO
está na lista de kinds aceitos por `subflow_node_create`/`subflow_node_edit`**
(confirmado 29/07 — erro explícito lista todos os kinds suportados e
`whatsapp_template` não está lá; só sobrevive em nós antigos, criados antes
dessa validação existir ou por outro caminho). **Não dá pra criar esse nó
específico via MCP.**

**Contorno:** o nó de MENSAGEM (texto + botão "WhatsApp Aqui", que é o que
o CLIENTE vê e usa pra chamar o promoter) funciona normal via API — só o
nó de AÇÃO que avisa automaticamente o promoter é que fica de fora.

**Passo manual pro Rafa (ou pra você, se ele topar operar o editor visual):**
No editor do NicoChat, abrir o fluxo "API - ✅📋 Confirmação de cadastro na
Lista", localizar um nó de ação existente tipo "Cliente Mesa - Luana",
**duplicar**, e no duplicado trocar:
- Nome do nó → "Cliente Mesa - {Nome novo}"
- `to_number` → `+55{{Promoter {Nome novo}}}` (a variável do bot field
  criado na Fase 1 — já existe, só selecionar no seletor de variável)
- Deixar o resto do template igual (nome/idioma/namespace são os mesmos
  pra todos)
- Adicionar um step `add_note` com texto "Recebeu contato: Promoter
  {Nome novo}" (opcional, mas os outros têm)
- Ligar a saída do nó de MENSAGEM (feito via API) → nesse nó novo → nó
  compartilhado "Aviso - Rafa" (`f71825n292434339`)

## Cadeia de condições UTM (fluxo `f71825s2046453`)

Nós, em ordem (cada um testa se `f71825v13414821` [utm_source] contém um
texto; se não bate, cai no próximo; a ORDEM importa — nome que é substring
de outro tem que vir DEPOIS do mais específico, ex. "julia" antes de "mari"
porque "mariajulia" contém "mari"):

```
n451206611 (contém "julia"?)  → Maria Julia | senão↓
n451206613 (contém "gabriel"?) → Gabriel     | senão↓
n451206615 (contém "luana"?)   → Luana       | senão↓
n451206617 (contém "mari"?)    → Mari        | senão↓
n451206619 (contém "nicolly"?) → (fallback — ela saiu do time) | senão↓
n451335401 (link de auto-atendimento? "casa") → randomizer orgânico (n450796085)
```

Promoter novo com link próprio = inserir uma condição nova ENTRE
`n451206619` e `n451335401` (ou em qualquer ponto antes do fallback — não
há colisão de substring conhecida com "aiko"/"medina"), testando
`utm_source contains "<nome>"`, apontando pro nó de MENSAGEM dele.
Rewire o "senão"/`next_node_ns` default do nó anterior da cadeia pra
apontar pra condição nova, e a condição nova aponta pro próximo — **usar
`subflow_node_edit` direto no campo `next_node_ns`/`conditions[].next_node_ns`,
NUNCA `subflow_connection_create`/`delete` numa condição — isso apaga os
grupos da condição (`conditions:[]`) e quebra o nó.**

## Randomizer orgânico (`f71825n450796085`, dentro do mesmo fluxo)

Hoje: Luana 35% / Mari 34% / Maria Julia 25% (variantes somam ~94, tem
folga de arredondamento). Gabriel NÃO participa (só recebe por link
próprio). Pra adicionar variante: **não dá pra editar o nó existente pra
ganhar variante nova** (`subflow_node_edit` num randomizer só
preserva/remove as que já tem) — criar um randomizer NOVO via
`subflow_node_create` com todas as variantes (as antigas + as novas,
pesos recalculados) e religar todo mundo que apontava pro randomizer
antigo (a condição `n451335401`) pro novo.

## Randomizer do fluxo de aniversário (`f71825s2046573`)

Nó `f71825n451468629` (recriado em 27/07 quando a Nicolly saiu). Hoje:
Gabriel 10% / Luana-Mari-MariaJulia 30% cada. Mesma pegadinha do item
acima (recriar, não editar). **Independente** do randomizer do item
anterior — se o promoter novo deve receber leads de aniversário também,
precisa entrar nos DOIS randomizers separadamente.

## Prompt da Kim

`ai_agent_get(flow_ns:"f71825", workspace_id:"61425", agent_id:1635)` pra
achar onde a lista de "promoters oficiais" está hoje (campo `roles` ou
`information` — mudou de lugar quando a Nicolly foi removida em 27/07,
conferir antes de assumir). Editar com `ai_agent_update` usando
`patch_ops` (find→replace) pra não reenviar o campo inteiro.

## Fluxos ainda não lidos em detalhe (conferir se for relevante)

- "Patrocinado - Direcionando para Promoters" (`f71825s578773`) e as 4
  variantes por dia ("Patrocinado - Sexta/Sábado/Domingo/Quinta",
  `f71825s654885`/`654973`/`677859`/`986201`) — prováveis rotas de lead de
  anúncio pago pra promoter específico.
- Dentro do próprio fluxo principal, nó `f71825n450795997` tem um esquema
  ALTERNATIVO de "promoter do dia fixo" (Quinta→Victor, Sexta→Gabriel,
  Sábado→Victinho, Domingo→Victor) — não é o mesmo mecanismo do UTM/
  randomizer. Só relevante se o promoter novo cobre um dia fixo.
- "Totalizador em Looping - Promoters" (`f71825s2046567`) — provável
  contador/ranking; conferir se tem lista fixa de nomes.

## Grupos de mesa do hub_reservas — comandos que o promoter usa

`Número - Nome` (reserva) e `Número - cancelar` (cancela — só cancela
reserva de origem `promoter`, reserva de cliente é protegida a menos que
quem mandar seja um admin listado em `GRUPO_ADMIN_TELEFONES`). Ver
`[[project_hub_reservas_mesas]]` pro funcionamento completo.
