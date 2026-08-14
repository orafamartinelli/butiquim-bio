---
name: butiquim-atualizar-promoters
description: Adiciona ou remove um promoter do ecossistema O Butiquim (bio, NicoChat, grupos WhatsApp, hub_reservas, links de rastreio). Use esta skill sempre que o usuário pedir "novo promoter", "adicionar promoter no Butiquim", "remover promoter", "trocar promoter", "tirar [nome] dos promoters", "atualizar promoters do butiquim" ou qualquer variação de inserir/remover uma pessoa do time de promoters do Butiquim. Não usar para outros clientes nem para funcionários/gestores (André, Victor) que não são promoters de lista.
---

# Atualizar promoters do Butiquim (adicionar ou remover)

## O que este playbook resolve

Um promoter "existe" em **5 sistemas diferentes** que não se falam entre si —
bio (site próprio), NicoChat (chatbot), grupos de WhatsApp, banco do
hub_reservas e links de rastreio da lista. Toda vez que entra ou sai alguém,
todos os 5 precisam ser tocados, na ordem certa, ou o promoter fica
"meio dentro" (ex.: recebe aviso mas não está no link da bio, ou aparece na
bio mas o NicoChat não sabe rotear pra ele). Este playbook existe pra nunca
mais remapear isso do zero — mapeado e testado em 29/07/2026 (entrada de
Aiko + Medina).

Leia **`references/checklist-tecnico.md`** ANTES de tocar em qualquer sistema —
tem os node_ns/var_ns/ids atuais, os formatos exatos de telefone por sistema
(são 3 formatos diferentes!) e uma limitação real de plataforma que bloqueia
criar automaticamente 1 dos nós do NicoChat (ver "PEGADINHA BLOQUEANTE").

`references/estado-atual.md` é o **doc vivo** — quem está em qual fase
(bastidor pronto / ativado) e os node_ns/var_ns já criados. Leia-o pra saber
de onde continuar (cada invocação desta skill é uma sessão nova, sem memória
da anterior) e **atualize-o** ao final de qualquer execução.

## Perguntas pra fazer ANTES de mexer em qualquer sistema

Pra ADICIONAR, pergunte (pode ser tudo numa mensagem, ele costuma responder
tudo de uma vez):
1. Nome + telefone (com DDD, do jeito que ele mandar — você normaliza).
2. Entra no giro semanal da bio, ou fica fixo numa posição (como o Gabriel,
   que tem `fixoNoFinal:true`)? Se giro, em que posição da fila?
3. Recebe tráfego ORGÂNICO (sorteio aleatório de quem chega sem link de
   ninguém — ver checklist item NicoChat 2b)?
4. Cobre algum DIA fixo (esquema "promoter do dia" / patrocinado) ou só
   recebe pelo link próprio (regra padrão hoje)?
5. Vai atuar em reserva de mesa pelos grupos de dia da semana (sexta/
   sábado/domingo/quinta) do hub_reservas, ou só lista/bio?
6. **Ativar tudo de uma vez, ou só construir os bastidores agora e ativar
   depois** (bio pública + sorteio + notificação de cliente) numa 2ª rodada,
   quando ele já tiver conversado com a pessoa / adicionado nos grupos? Rafa
   já pediu esse faseamento uma vez (29/07) — perguntar por padrão, não
   assumir "tudo de uma vez".

Pra REMOVER, pergunte: tira só da rotação (para de receber lead novo, mas
fica registrado pra histórico/comissão) ou apaga de tudo? O padrão usado
com a Nicolly (27/07) foi: sai da bio, sai do sorteio/randomizer(s), sai da
lista oficial no prompt da Kim, e o UTM dela passa a cair no caminho padrão
(em vez de apagar a condição, ela foi redirecionada pro fallback) — **não
precisa apagar os nós do NicoChat**, só desviar o roteamento. Os dados
históricos dela (Supabase, `hub_grupo_remetentes`) foram deixados como
estavam (é auditoria/comissão passada, não atrapalha nada ficar).

## Sequência (ADICIONAR)

### Fase 1 — Bastidores (não expõe cliente nem manda notificação)
1. Normalizar telefone nos 3 formatos (ver checklist-tecnico.md).
2. NicoChat: criar bot field "Promoter {Nome}" (`content_bot_field_create`).
3. NicoChat: criar o nó de MENSAGEM "Cliente Mesa - {Nome}" (texto + botão
   WhatsApp) no fluxo `f71825s2046453` — funciona via API, testado.
4. NicoChat: o nó de AÇÃO que dispara o template `aviso_promoter_cliente_
   quer_mesa_butica` pro telefone do promoter **NÃO dá pra criar via API**
   (kind `whatsapp_template` foi removido da lista de kinds aceitos na
   escrita — só existe em nós legados). Dar a Rafa o passo manual exato
   (duplicar um nó "Cliente Mesa - X" existente no editor visual e trocar
   nome/telefone) — ver checklist-tecnico.md pro texto pronto.
5. Supabase: inserir linha em `hub_grupo_remetentes` (estab Butiquim).
6. **NÃO tocar ainda**: cadeia de condições UTM (deixa a pessoa sem rota
   viva até a Fase 2), randomizer(s), `config.js` da bio, array `mentioned`
   do aviso de grupo, prompt da Kim, grupos de WhatsApp.
7. Atualizar `references/estado-atual.md` com o que foi feito.

### Fase 2 — Ativação (só quando Rafa confirmar)
1. Rafa adiciona a pessoa nos grupos de WhatsApp relevantes (manual, ele
   mesmo faz — não é uma ferramenta que você tem).
2. Rafa (ou você, se ele autorizar) cria manualmente o nó de ação faltante
   do passo 4 da Fase 1 no editor visual do NicoChat.
3. NicoChat: inserir a condição UTM na cadeia do fluxo `f71825s2046453`
   (rewire do "senão" do último nó da cadeia pra apontar pro novo, na ORDEM
   certa — ver checklist-tecnico.md, ordem importa quando um nome é
   substring de outro).
4. Se ela recebe tráfego orgânico: adicionar variante no randomizer
   `f71825n450796085` (recalcular pesos) — **PEGADINHA:** `subflow_node_
   edit` num randomizer NÃO cria variante nova, só edita/preserva as que já
   existem. Pra adicionar variante de verdade precisa criar um randomizer
   NOVO com `subflow_node_create` e religar tudo que apontava pro antigo.
   **Esse randomizer hoje só é alcançado como último recurso (ver item 5
   abaixo) — não é mais o caminho normal de quem chega sem promoter, que
   agora vai pro auto-atendimento (Fase 5).**
5. **NÃO ligar o "Cliente Mesa - {Nome}" no aviso de grupo — essa rota foi
   DESATIVADA em 01/08/2026** (ordem do Rafa: "não dar cliente de graça pra
   quem tá no grupo"). O `next_node_ns` do nó de ação "Cliente Mesa - {Nome}"
   fica **vazio** (`""`) — ele termina ali, só avisa aquele promoter mesmo
   (mensagem + template WhatsApp), nunca o grupo "Novos Promoters - TIME
   BUTICA". O array `mentioned` do nó "Aviso - Rafa" (`f71825n450796947`,
   hoje órfão/desconectado) não precisa mais ser tocado pra promoter novo —
   ver [[project_promoters_butiquim]] seção 01/08/2026 pro histórico completo
   da mudança.
6. `channel_sub_flow_publish` do fluxo `f71825s2046453` (as edições ficam
   em DRAFT até publicar — nada do passo 3/4/5 vale antes disso).
7. `butiquim-bio/config.js`: adicionar no array `promoters` na posição
   combinada (`ativo:true`, `fixoNoFinal` só se for pra ficar fixo) +
   `npm run deploy`.
8. NicoChat: `ai_agent_update` no agente Kim (`agent_id 1635`, canal
   `f71825`) — adicionar o nome na lista de promoters oficiais do prompt
   (`patch_ops` no campo certo — leia com `ai_agent_get` primeiro pra achar
   onde a lista atual está).
9. **`butiquim-lista/_worker.js`: adicionar o nome (minúsculo, sem acento) em
   `PROMOTERS_OFICIAIS`** — esquecer esse passo não quebra o roteamento do
   NicoChat (que usa o utm_source cru), mas faz todo cadastro dela cair como
   "Casa" no banco/ranking/conferência de comissão (bug real achado 01/08/2026
   com a Medina, corrigido antes de virar prejuízo). Deploy: `renova-token.mjs`
   + `wrangler pages deploy . --project-name=butiquim-lista --branch=main`.
10. Criar e testar 1 link `?promoter=NOME` por dia (6 forms do
    butiquim-lista) se ela também vai gerar cadastro de lista rastreado.
    Registrar também na planilha `Downloads\Gerador-Links-UTM-Butiquim.xlsx`
    (aba "Gerador" = 6 links longos; aba "Links Curtos" = versões encurtadas
    TinyURL + ulvis, ver [[reference_encurtadores_butiquim]] pros tokens e
    pegadinhas de cada encurtador) — é a fonte de verdade dos links de todo
    mundo, não só desta pessoa.
11. **Mandar os links pro próprio promoter, no WhatsApp PESSOAL dele** (via
    Z-API — nunca esperar ele pedir): mensagem organizada por dia (Quarta/
    Quinta/Sexta/Sábado/Domingo/Véspera, cada link numa linha própria,
    identificado), explicando que **cada link é de um dia específico** (não
    dá pra usar o de sexta num sábado) e recomendando que ele **salve os 6
    com atalho de teclado ou em algum lugar de acesso rápido** (ex.: respostas
    rápidas do WhatsApp Business, notas do celular fixadas) pra copiar e
    colar rápido quando um cliente pedir. Depois de enviar, **confirmar pro
    Rafa explicitamente que os links foram mandados** (não deixar implícito).
12. Atualizar `references/estado-atual.md`.

## Sequência (REMOVER)

Espelha a Fase 2 ao contrário, na ordem que reduz exposição mais rápido
primeiro:
1. Bio (`config.js`): `ativo:false` (ou remover a linha) + deploy — some da
   rotação pública imediatamente.
2. Randomizer(s): remover a variante dela e redistribuir o peso entre quem
   ficou (mesma pegadinha de criar-nó-novo pra editar variantes).
3. Cadeia de UTM: em vez de apagar a condição, redirecionar o `next_node_ns`
   do "senão" dela pro fallback padrão (mesmo padrão usado com a Nicolly) —
   mantém o nó existente como está (histórico/auditoria), só desvia quem
   chegar com o link antigo dela.
4. Prompt da Kim: tirar o nome da lista oficial.
5. `butiquim-lista/_worker.js`: tirar o nome de `PROMOTERS_OFICIAIS` (senão
   cadastro que ainda chegar com o link antigo dela conta como promoter ativo
   no banco/ranking, mesmo ela fora do time) + deploy.
6. `channel_sub_flow_publish`.
7. Grupos de WhatsApp: Rafa remove manualmente.
8. **NÃO apagar** a linha dela em `hub_grupo_remetentes` nem os nós dela no
   NicoChat — é histórico de comissão/auditoria, não atrapalha ficar.
9. Atualizar `references/estado-atual.md`.

(O aviso de grupo "Novos Promoters - TIME BUTICA" foi desativado pra todo
mundo em 01/08/2026 — não existe mais array `mentioned` pra tirar telefone.)

Relacionado: [[project_promoters_butiquim]], [[project_butiquim_bio]],
[[project_hub_reservas_mesas]], [[reference_nicochat]] (memórias do
projeto — leia se precisar de contexto histórico mais amplo).

---
⚠️ CÓPIA CANÔNICA A PARTIR DE 14/08/2026: este playbook vive no repo butiquim-bio (`.claude/skills/`) para funcionar também nas sessões da nuvem/celular. `references/estado-atual.md` (doc vivo) DEVE ser commitado+push a cada execução — é ele que sincroniza o estado entre o PC e a nuvem. A cópia em ~/.claude/skills desta máquina é espelho; em caso de divergência, vale a do repo.
