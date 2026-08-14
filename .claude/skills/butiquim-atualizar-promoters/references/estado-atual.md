# Estado atual dos promoters (doc vivo — atualizar a cada execução da skill)

## Roster ativo (bio + NicoChat, antes da rodada de 29/07)
| Nome | Telefone (fmt bio/DB) | Bot field NicoChat (fmt curto) | Bio | Randomizer orgânico | Randomizer niver |
|---|---|---|---|---|---|
| Luana Bido | 554498766957 | 4498766957 (`f71825v14248873`) | ativo, giro | 35% | 30% |
| Mari | 554497077075 | 4497077075 (`f71825v14249239`) | ativo, giro | 34% | 30% |
| Maria Julia | 554498708463 | 4498708463 (`f71825v14248875`) | ativo, giro | 25% | 30% |
| Gabriel | 554491749173 | 4491749173 (`f71825v8873187`) | ativo, `fixoNoFinal` | não participa | 10% |
| Nicolly | 554488274796 | 4488274796 (`f71825v14251637`) | REMOVIDA 27/07 | fora | fora |
| Victinho | 4491475649 (legado, sem "55") | `f71825v8873185` | não está na bio | — | — |

## 29/07/2026 — entrada de Aiko + Medina

Decisões do Rafa: ambas entram no giro semanal da bio (posição = depois das
que já estavam — Luana/Mari/Maria Julia —, antes do Gabriel que continua
`fixoNoFinal`); recebem tráfego orgânico (randomizer); só recebem cliente
pelo link próprio (regra padrão, sem dia fixo); vão atuar nos grupos de
mesa de todos os dias (ele mesmo adiciona manualmente). **Pedido
explícito: só Fase 1 (bastidores) nesta rodada — não ativar recebimento de
cliente/notificação ainda.**

**Telefones:**
- Aiko: `+55 44 9773-8953` → bio/DB `554497738953` / NicoChat curto
  `4497738953`
- Medina: `+55 44 9105-5861` → bio/DB `554491055861` / NicoChat curto
  `4491055861`

**Feito (Fase 1):**
- ✅ Bot field "Promoter Aiko" criado — `var_ns f71825v15970255`, valor
  `4497738953`.
- ✅ Bot field "Promoter Medina" criado — `var_ns f71825v15970257`, valor
  `4491055861`.
- ✅ Nó de MENSAGEM "Aiko" criado no fluxo `f71825s2046453` — `node_ns
  f71825n451490411` (texto + botão WhatsApp usando o bot field acima).
  **Ainda DESCONECTADO** (não linkado em nenhuma cadeia — não afeta
  produção).
- ✅ Nó de MENSAGEM "Medina" criado — `node_ns f71825n451490419`. Mesma
  situação (desconectado).
- ✅ `hub_grupo_remetentes`: 2 linhas inseridas (estab
  `8f249842-cede-42f1-9e49-3e9324f7d8aa`, telefones `554497738953`/
  `554491055861`, nomes Aiko/Medina).
- ❌ **NÃO criado** (bloqueio de plataforma, ver `checklist-tecnico.md` →
  "PEGADINHA BLOQUEANTE"): nó de AÇÃO "Cliente Mesa - Aiko"/"Cliente Mesa -
  Medina" (o que dispara o template automático pro promoter). Precisa ser
  criado manualmente no editor visual (duplicar um existente).
- ⏸️ **Deliberadamente NÃO tocado** (fica pra Fase 2): cadeia de condições
  UTM (nenhuma condição nova criada — os nós de mensagem ficam órfãos até
  lá), randomizer orgânico, randomizer de niver, `config.js` da bio, array
  `mentioned` do aviso de grupo, prompt da Kim, grupos de WhatsApp, links
  `?promoter=` do butiquim-lista.

## 29/07/2026 (tarde) — Rafa autoriza SÓ a Medina ("issoo medina ja pode entrar")

**✅ Feito e NO AR:**
- `butiquim-bio/config.js`: Medina adicionada ao array `promoters` (posição
  depois de Maria Julia, antes do Gabriel `fixoNoFinal`) + deployado
  (`npm run deploy`, `https://c427b6eb.butiquim-bio.pages.dev`).
- Prompt da Kim (agent_id 1635): "Medina — (44) 99105-5861" adicionada na
  lista de promoters oficiais (campo `information`), via `ai_agent_update`
  patch_ops.
- `hub_grupo_remetentes`: já tinha a linha da Medina desde a Fase 1.

**🚨 BLOQUEADO — achado técnico novo, NicoChat NÃO publicado (zero risco
pra produção, tudo ficou em draft):** ao tentar montar a cadeia de roteamento
por UTM + randomizer pra Medina, **2 campos não persistem de forma confiável
via API mesmo depois de edição bem-sucedida**: (1) o texto/botão da mensagem
"Quem vai te atender é a Medina..." (`f71825n451490419`) — a resposta do
`subflow_node_edit` confirma o conteúdo salvo, mas a releitura seguinte do
fluxo mostra `messages:[]` (vazio) de novo; (2) as variantes de um randomizer
recém-criado (`f71825n451494457`) têm o mesmo problema — edição confirma,
releitura mostra `variants:[]`. Tentei 2x (inclusive as 2 edições juntas
numa única chamada) e o resultado se repetiu igual nas duas vezes — não
parece ser um lag passageiro de cache. **Por segurança, desfiz o único passo
que tinha risco real** (tinha religado o fallback do roteamento orgânico
`f71825n451335401` pro randomizer novo — devolvi pro randomizer antigo
`f71825n450796085`, que segue 100% intacto e funcionando pra Luana/Mari/
Maria Julia). Nada foi publicado (`channel_sub_flow_publish` nunca chamado
nesta rodada) — o fluxo ao vivo está exatamente como estava antes de eu
mexer.

**O que ficou construído em DRAFT, pronto pra quando o bug for contornado:**
- Bot field "Promoter Medina" (`f71825v15970257`) — ok, sempre esteve certo.
- Condição "UTM Promoter: Medina?" (`f71825n451494455`, utm_source `is`
  "medina") — persistiu certo, mas ainda não está ligada em nada ativo
  (o nó anterior `f71825n451206619` foi religado pra apontar pra ela, então
  tecnicamente ela ESTÁ na cadeia — só não adianta nada publicar assim
  porque o nó de destino dela está com conteúdo vazio).
- Nó de mensagem `f71825n451490419` — existe, mas com `messages:[]` (bug
  acima).
- Randomizer novo `f71825n451494457` (luana 27/mari 26/maria julia 22/
  medina 25) — existe, mas com `variants:[]` (bug acima). NÃO está ligado
  em nada (fallback aponta pro antigo).

**Pra fechar a ativação da Medina no NicoChat (quando for retomar):**
1. Tentar de novo os 2 `subflow_node_edit` (mensagem + variantes) — pode ter
   sido transiente; ou tentar editar pelo EDITOR VISUAL do NicoChat
   diretamente (mais confiável pra esses 2 campos especificamente).
2. Confirmar via releitura que os 2 campos persistiram desta vez.
3. Recriar/confirmar o nó de AÇÃO que avisa a Medina automaticamente
   (mesmo bloqueio já documentado — `whatsapp_template` não é criável via
   API; duplicar um nó existente no editor).
4. SÓ ENTÃO religar `f71825n451335401` pro randomizer novo E publicar
   (`channel_sub_flow_publish`).
5. Ainda pendente (não tentado nesta rodada): randomizer de niver
   (`f71825n451468629`) — Rafa não confirmou se quer a Medina recebendo
   leads de aniversário também; perguntar antes de mexer.
6. Confirmar com o Rafa que ele já adicionou a Medina nos grupos de
   WhatsApp (Novos Promoters + grupos de mesa de todos os dias que ela vai
   atuar).
7. Criar/testar o link `?promoter=Medina` nos 6 forms do butiquim-lista,
   quando ela for receber tráfego por lista também.

Aiko segue 100% em Fase 1 (nada mudou pra ela nesta rodada).

**✅ 30/07/2026 — MEDINA PUBLICADA E NO AR.** O Rafa terminou a montagem dos 2
blocos que travavam via API direto no editor visual do NicoChat (mensagem +
ação "Cliente Mesa - Medina", `node_ns f71825n451494683`/`...719`) e ligou a
Medina como variante nova no randomizer orgânico JÁ EXISTENTE
(`f71825n450796085`, o de sempre — não o que eu tinha criado quebrado) em vez
de recriar um randomizer do zero. **Lição confirmada: quando a API travar em
criar/editar `messages[]` ou `variants[]`, a saída confiável é pedir pro Rafa
fazer no editor visual — ele acerta de primeira, a API não.**

**Efeito colateral achado e corrigido:** ao duplicar o bloco da Medina pra
criar o da Aiko, o Rafa esqueceu de trocar telefone/texto (ficou tudo com o
dado da Medina) — corrigi via `subflow_node_edit` com `patch_ops` (esse tipo
de edição, texto-pontual em bloco que JÁ tem conteúdo, funciona bem pela API
— o que não funciona é criar conteúdo novo do zero). Aiko ficou com dado
certo mas segue desconectada (Fase 1).

**Segundo efeito colateral, sem relação com promoters:** o bloco "Condition
#3" (decide "Promoções de Sexta" vs "Promoções de Domingo", vive logo depois
do bloco "Mapa") apareceu com os 2 ramos vazios — bug de gravação da API
pegou ali também em algum momento anterior a esta sessão (não achei a causa).
2 rodadas de tentativa: a 1ª piorou (derrubei o ramo de domingo também ao
tentar arrumar o de sexta), a 2ª o Rafa recriou o bloco de mensagem "Promos
sexta" pelo editor (funcionou de primeira) e eu religuei os 2 ramos da
condição via API (funcionou na 2ª tentativa — a 1ª também tinha voltado
vazia na releitura). **Fica registrado como aviso geral: sempre que for
mexer numa condição/randomizer/mensagem já existente e importante, releia
depois de editar antes de dar como certo — a API deste NicoChat NÃO é
confiável de primeira tentativa pra esses 3 tipos de campo.**

**Publicado e verificado em modo `live` (não só draft) em 30/07/2026.**
Faltam: Rafa adicionar a Medina nos grupos de WhatsApp (Novos Promoters +
grupos de mesa); randomizer de niver (não mexido, perguntar antes); bio e
prompt da Kim já estavam OK desde a rodada anterior.

## ✅ 01/08/2026 — Passo 9 fechado: links de lista do Medina criados, testados e enviados

Item que tinha ficado pendente na Fase 2 ("Criar e testar 1 link `?promoter=NOME`
por dia") — resolvido nesta rodada, e a skill (`SKILL.md`) foi atualizada com um
passo 10 novo pra nunca mais esquecer: **depois de criar os links, sempre
mandar pro WhatsApp PESSOAL do promoter (organizados por dia, com aviso de
"salva num lugar de acesso rápido") e confirmar pro Rafa que foi enviado.**

**Achado maior nesta rodada (não era só o Medina):** ao gerar os 6 links dele
pelo padrão da planilha `Downloads\Gerador-Links-UTM-Butiquim.xlsx`, descobri
que os links de **Quarta e Quinta de TODOS os promoters existentes estavam
quebrados** desde a migração do site novo — apontavam pra `/quarta-feira/` e
`/quinta-feira/`, rotas que não existem mais (o CF Pages cai pra home em vez
de dar 404, então o link "abria" mas sem formulário e sem UTM — perdia
cadastro e rastreio). Rota certa hoje: `/quarta/` e `/quinta/`. **Vespera**
também trocou: de `butiquim-lista.pages.dev/feriado` (formulário puro, sem o
Pixel/GA4 do site) pra `obutiquim.com.br/feriado/` (página nova do site,
com o rastreio completo — ver [[project_butiquim_site_novo]]).

**Corrigido pra Gabriel, Luana Bido, Mari, Maria Julia e Nicolly** (Quarta/
Quinta/Vespera) + **criado do zero pro Medina (6 dias)**. Planilha atualizada
(as 2 abas) com backup do arquivo original salvo em
`Downloads\Gerador-Links-UTM-Butiquim.backup-01-08-2026.xlsx`.

**Pegadinha nova do TinyURL:** o plano grátis **não permite editar nem apagar
um alias já criado** (`PATCH`/`DELETE` retornam "This action is unauthorized").
Pra corrigir um link antigo quebrado, a única saída é criar um alias NOVO
(convenção usada: sufixo `-v2`, ex. `gabriel-lista-quarta-v2`) — **os links
antigos (`gabriel-lista-quarta` sem sufixo, etc.) continuam existindo e
redirecionando pro destino ERRADO**, não tem como matar eles. Se esses links
antigos já foram impressos/postados em algum lugar fixo (adesivo, destaque
fixado do Instagram), precisam ser trocados manualmente pelos `-v2` — avisar
o Rafa se isso surgir. **ulvis** não teve esse problema (é idempotente: pedir
de novo o mesmo alias+URL só devolve o link de novo), mas trava fácil com
"Spam detected!" sob rajada — pacing de 2,5s entre chamadas e retry com
backoff crescente (6s, 12s, 18s...) resolveu.

**Links do Medina, todos testados (redirect 301 confirmado) e enviados no
WhatsApp pessoal dele (554491055861) em 01/08/2026:**
- Quarta: `tinyurl.com/medina-lista-quarta`
- Quinta: `tinyurl.com/medina-lista-quinta`
- Sexta: `tinyurl.com/medina-lista-sexta`
- Sábado: `tinyurl.com/medina-lista-sabado`
- Domingo: `tinyurl.com/medina-lista-domingo`
- Véspera: `tinyurl.com/medina-lista-vespera`

Backup em ulvis.net (mesma convenção de nome, sem hífen) pra cada um, caso o
TinyURL saia do ar.

## ✅ 01/08/2026 (tarde) — Rota do cliente sem promoter mudou: acabou o aviso de grupo

**Achado que disparou a mudança:** cliente Mauro (Sábado, veio pelo link da Mari)
foi investigado a pedido do Rafa — "por que ele não caiu no auto-atendimento?".
Resposta: não é bug, é como o fluxo SEMPRE funcionou — `utm_source=mari` bate
na condição da Mari bem antes de chegar na checagem de auto-atendimento (Fase 5,
`f71825n451335401`), então ele nunca teria elegibilidade pro link de
autoatendimento. O Rafa então redesenhou a regra de negócio:

**Regra nova (substitui a anterior):**
1. Cliente veio por link de promoter ativo (utm_source bate exato com
   gabriel/luanabido/mari/mariajulia/medina/aiko) → avisa **só aquele
   promoter** (mensagem + template WhatsApp). **Ponto final — não avisa mais
   ninguém.**
2. Cliente sem promoter identificado (orgânico, Instagram, site, bio, link de
   promoter antigo tipo Nicolly, qualquer patrocinado) → vai pra **rota da
   casa** = link de auto-atendimento (`/m/<token>`), se resolve sozinho.
3. **O aviso no grupo "Novos Promoters - TIME BUTICA" ("Cliente Precisando de
   Mesa ✅") NÃO EXISTE MAIS.** Ordem explícita do Rafa: "não dar cliente de
   graça pra quem tá no grupo". Os 2 nós que faziam isso (`f71825n292434339`
   "Aviso - Rafa" + `f71825n450796947`, que chamava a API do Z-API pro grupo)
   ficaram **órfãos de propósito** (não apagados — só desconectados, mesmo
   padrão de sempre desta skill: nunca deletar nó do NicoChat, só desviar o
   roteamento).

**2 bugs achados e corrigidos no worker (`butiquim-lista/_worker.js`) que
sustentavam essa regra, ANTES de mexer no fluxo:**
- `PROMOTERS_OFICIAIS` (decide se o cadastro conta como daquele promoter ou
  vira "Casa" no banco/ranking/conferência) **não tinha `medina` nem `aiko`**
  — cadastro dela cairia como "Casa" pro banco mesmo o NicoChat roteando
  certo pra ela (o NicoChat usa o utm_source cru, não essa lista — então não
  quebrava o atendimento, só o ranking/comissão dela). Zero cadastros reais
  perdidos ainda (ela só recebeu os links no mesmo dia). Corrigido: `medina` e
  `aiko` adicionados.
- `DOW_BY_DAY` (calcula a data-alvo do token de auto-atendimento) só tinha
  **Domingo, Sexta, Sábado** — Quarta/Quinta/Véspera nunca mintavam token,
  então cliente Casa desses 3 dias sempre caía no "senão" (fallback). Corrigido
  Quarta(3)/Quinta(4). **Véspera ficou de fora de propósito** (não é dia fixo
  da semana, não tem "próxima quarta" — Rafa vai decidir a regra dela depois,
  "trato à parte"). Deployado (`wrangler pages deploy . --branch=main`).

**Implementação no fluxo `f71825s2046453`:** os 6 nós de ação "Cliente Mesa -
{Promoter}" (`f71825n450796107` Gabriel, `f71825n450796125` Luana,
`f71825n450796129` Mari, `f71825n450796131` Maria Julia, `f71825n451494719`
Medina, `f71825n451494739` Aiko) tinham `next_node_ns` apontando pro "Aviso -
Rafa" (grupo) — **mudado pra `""`** (vazio, o fluxo termina ali) nos 6, via
`subflow_node_edit` (campo simples, não é `messages`/`variants`/`conditions`
— editou de primeira, sem a pegadinha de confiabilidade documentada acima).
Publicado e **verificado em modo `live`**: `linkDataArray` confirma que nenhum
link aponta mais pro `f71825n292434339`.

**O sorteio antigo (`f71825n450796085`, pesos Medina/Luana/Mari/Maria Julia)
ficou INTOCADO como fallback de ÚLTIMO RECURSO** — só é alcançado hoje pelo
"senão" da condição Fase 5 (`f71825n451335401`) quando não existe token de
auto-atendimento (ou seja: Véspera-Casa, ou falha real de rede ao mintar o
token — casos raros agora que Quarta/Quinta foram corrigidos). Nesse caso
raro, ainda sorteia um promoter pra atender (evita deixar o cliente sem
resposta) — **mas sem avisar o grupo**, porque os "Cliente Mesa - X" que o
sorteio usa são os MESMOS 6 nós já desconectados do grupo. Quando o Rafa
decidir a regra de data da Véspera, esse fallback vira 100% morto e dá pra
desconectar o sorteio também.

**Promoter novo daqui pra frente:** ao rodar a Fase 2 desta skill, lembrar de
(a) adicionar o nome em `PROMOTERS_OFICIAIS` no `_worker.js`, e (b) o nó
"Cliente Mesa - {Nome}" dele **NÃO deve apontar pro "Aviso - Rafa"** — essa
rota não existe mais, `next_node_ns` do "Cliente Mesa" fica vazio.

## ✅ 01/08/2026 (noite) — AIKO REMOVIDO (desistiu) + Véspera entrou no auto-atendimento

**Aiko desistiu do time (aviso do Rafa 01/08). Limpeza total executada:**
- `_worker.js`: `aiko` removido de `PROMOTERS_OFICIAIS` (tinha entrado horas
  antes na mesma lista) + deploy.
- NicoChat: nós órfãos dele **APAGADOS de vez** (`f71825n451494737` mensagem
  "Aiko" + `f71825n451494739` "Cliente Mesa - Aiko") via `subflow_node_delete`
  + publish — exceção à regra "nunca apagar nó": ele nunca foi ativado, zero
  histórico, e o Rafa pediu "o mais limpo possível".
- Supabase: linha dele em `hub_grupo_remetentes` deletada (nunca operou).
- Bot field "Promoter Aiko" (`f71825v15970255`) ficou — inócuo, API não
  deleta bot field. Bio/Kim/links nunca tiveram Aiko (ele parou na Fase 1).
- Roster ativo agora: Luana Bido, Mari, Maria Julia, Medina (giro) + Gabriel
  (fixo).

**Véspera de feriado (`Feriado`) agora minta token de auto-atendimento:**
regra do Rafa = idêntica aos outros dias (link de promoter → promoter; sem
promoter → auto-atendimento). Como véspera não é dia fixo, `proximaDataAlvo`
assume a ocorrência mais próxima de **segunda/terça** (hoje se já for
seg/ter, senão a próxima segunda) — a lista /feriado/ só cobre vésperas que
caem nesses 2 dias. Limitação aceita e comentada no código: véspera de TERÇA
com cadastro dias antes ganha token de segunda (raro; cadastro de véspera
concentra no próprio dia). Com isso, **o randomizer fallback
(`f71825n450796085`) virou último recurso quase morto** (só falha real de
rede ao mintar token) — mantido por segurança.
