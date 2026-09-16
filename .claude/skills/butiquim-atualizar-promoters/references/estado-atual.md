# Estado atual dos promoters (doc vivo — atualizar a cada execução da skill)

Última reverificação: **16/09/2026** (código + banco conferidos).

## Roster ativo

| Nome | Slug (`utm_source`) | Telefone (bio / `hub_grupo_remetentes`) | @ Instagram (disputa) | Bio | Disputa |
|---|---|---|---|---|---|
| Luana Bido | `luanabido` (e `luana`) | 554498766957 | luanabido | ativa, giro | sim |
| Mari (Mariana Zalasko) | `mari` | 554497077075 | m.zalasko | ativa, giro | sim |
| Maria Julia | `mariajulia` | 554498708463 | mari_juu_l | ativa, giro | sim |
| Medina | `medina` | 554491055861 | edaimedina | ativo, giro | sim |
| Gabriel | `gabriel` | 554491749173 | gabrieellgoncalves | ativo, `fixoNoFinal` | sim |

Também em `hub_grupo_remetentes` (não são promoters de lista — **não mexer por
esta skill**): André `554484210698`, Victor `554491475649`, Rafa `554484232574`
e `5544984232574`, Nicolly `554488274796` (saiu do time em 27/07/2026; a linha
ficou por histórico de comissão).

Mapa `disputa_promoters` no banco hoje:
`{"luanabido":"luanabido","m.zalasko":"mari","mari_juu_l":"mariajulia","edaimedina":"medina","gabrieellgoncalves":"gabriel","orafamartinelli":"rafa"}`
(o `orafamartinelli` está fora da competição, é só identificação). Gate
`disputa_lancada = true`.

`PROMOTERS_OFICIAIS` (idêntica nos 2 arquivos, conferido 16/09):
`['gabriel','luana','luanabido','mari','mariajulia','medina']`.

## Mudança estrutural — NicoChat desligado (06/09/2026)

O NicoChat foi **desligado e a conta encerrada**. Com isso morreram, para
sempre, todos os passos que as versões antigas desta skill mandavam executar:
cadeia de condições UTM do fluxo `f71825s2046453`, nós "Cliente Mesa - {Nome}",
bot fields "Promoter {Nome}", randomizer orgânico (`f71825n450796085`),
randomizer de aniversário, `channel_sub_flow_publish` e edição do prompt da Kim
por `ai_agent_update` (`agent_id 1635`).

Hoje:
- **Atendimento e disparos** = Prontto.AI, WhatsApp Cloud API oficial,
  **+55 44 3170-0906**, agente **Kim**, WABA `1599027091586241`.
- **Confirmação de cadastro da lista** sai da própria `butiquim-lista`
  (`_worker.js` → `POST https://api.prontto.ai/v1/broadcasts`, template
  `confirmacao_lista_v2`, chave `PRONTTO_KEY`) — não há mais IWH de NicoChat.
- **Cliente sem promoter** continua indo pro auto-atendimento de mesa
  (`/m/<token>` do Hub) — desde 03/09/2026 **todo** cadastro ganha o link
  pessoal, independentemente da origem (decisão do Rafa junto com o
  desligamento: o promoter não ganha a mais por fazer a reserva e o cliente não
  pode ficar esperando resposta; a comissão segue carimbada no cadastro).
- **A Kim conhece os promoters só pelo prompt** que o Rafa cola no painel —
  promoter novo ou removido exige que ele recole. Não há API para isso.

## Histórico que ainda importa

- **27/07/2026 — Nicolly saiu do time.** Fora da bio e do `PROMOTERS_OFICIAIS`;
  linha em `hub_grupo_remetentes` preservada (auditoria de comissão).
- **29–30/07/2026 — Medina entrou** (bio, prompt da Kim, `hub_grupo_remetentes`).
- **01/08/2026 — Aiko desistiu antes de ativar** e foi apagado de tudo (nunca
  operou, zero histórico). É a exceção que justifica apagar dado.
- **01/08/2026 — dois achados que viraram regra desta skill:**
  (a) os links de **Quarta e Quinta de todos os promoters estavam quebrados**
  desde a migração do site (apontavam pra `/quarta-feira/` e `/quinta-feira/`,
  que não existem mais — o CF Pages cai pra home, então o link "abria" sem
  formulário e sem UTM, perdendo cadastro e comissão); rota certa é `/quarta/`
  e `/quinta/`, e a Véspera passou a ser `obutiquim.com.br/feriado/`;
  (b) depois de criar os links, **sempre mandar pro WhatsApp pessoal do
  promoter** e confirmar ao Rafa que foi enviado.
- **01/08/2026 — acabou o aviso de "Cliente Precisando de Mesa" no grupo**
  ("não dar cliente de graça pra quem tá no grupo"). O grupo TIME BUTICA segue
  existindo pro mapa de mesas e recados, não pra distribuir lead.
- **03/08/2026 — `PROMOTERS_OFICIAIS` dessincronizada** entre `_worker.js` e a
  página de conferência: o Medina virava "Casa" no fechamento. Daí a regra de
  editar os dois arquivos juntos.
- **19/08/2026 — disputa/placar no ar**: grupo "🏆 Placar Promoters", tabela
  `butiquim_social_disputa_eventos`, mapa `disputa_promoters`. Promoter novo que
  não entra no mapa não pontua.

## Pendências abertas

- Nenhuma entrada/saída de promoter pendente nesta data.
- Item antigo ainda sem resposta (`[[project_promoters_butiquim]]`, fila de
  03/08): conferir se os links curtos antigos de todos os promoters ainda
  respondem depois das mudanças de domínio/rota — link quebrado = promoter
  perdendo comissão sem saber.

## Como registrar a próxima execução

Acrescente aqui: data, quem entrou/saiu, quais dos 9 passos da SKILL.md foram
feitos, o que ficou pendente e por quê. Depois atualize
`[[project_promoters_butiquim]]` e `[[project_butiquim_bio]]` na memória, e faça
commit + push do repo `butiquim-bio` (mantendo a cópia de
`C:\Users\User\.claude\skills\butiquim-atualizar-promoters\` idêntica).
