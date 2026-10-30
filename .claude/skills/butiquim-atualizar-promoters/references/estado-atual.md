# Estado atual dos promoters (doc vivo — atualizar a cada execução da skill)

Última reverificação: **30/10/2026** (entrada da Anny — código, banco, n8n conferidos).

## Roster ativo (6 oficiais)

| Nome | Slug (`utm_source`) | Telefone (bio / `hub_grupo_remetentes`) | @ Instagram (disputa) | Bio | Disputa |
|---|---|---|---|---|---|
| Luana Bido | `luanabido` (`luana` = alias) | 554498766957 | luanabido | ativa, giro | sim |
| Mari (Mariana Zalasko) | `mari` | 554497077075 | m.zalasko | ativa, giro | sim |
| Maria Julia | `mariajulia` | 554498708463 | mari_juu_l | ativa, giro | sim |
| Medina (Jean Medina) | `medina` | 554491055861 | edaimedina | ativo, giro | sim |
| Anny (Anny Candida) | `anny` | 554499607128 | annycandida | ativa, giro (desde 30/10) | sim |
| Gabriel | `gabriel` | 554491749173 | gabrieellgoncalves | ativo, `fixoNoFinal` | sim |

Também em `hub_grupo_remetentes` (não são promoters de lista — **não mexer por
esta skill**): André `554484210698`, Victor `554491475649`, Rafa `554484232574`
e `5544984232574`, Nicolly `554488274796` (saiu do time em 27/07/2026; a linha
ficou por histórico de comissão). A Anny está lá como "Anny Candida" (iniciais AC).

Mapa `disputa_promoters` no banco hoje:
`{"luanabido":"luanabido","m.zalasko":"mari","mari_juu_l":"mariajulia","edaimedina":"medina","gabrieellgoncalves":"gabriel","annycandida":"anny","orafamartinelli":"rafa"}`
(o `orafamartinelli` está fora da competição, é só identificação). Gate
`disputa_lancada = true`. `promoter_fones` tem os 6 (slug → fone/nome).

`PROMOTERS_OFICIAIS` (idêntica em `_worker.js`, `conferencia/index.html` e
`butiquim-reguas/relatorio-promoter-dia.mjs`, conferido 30/10):
`['gabriel','luanabido','mari','mariajulia','medina','anny']` + `ALIAS_PROMOTER {luana→luanabido}`.
Mesma lista (com `'luana'` junto) nos 3 workflows n8n (`placar`, `aviso_time`,
`aviso_cadastro`) e nos espelhos de `butiquim-social/workflows/`.

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
- **A Kim conhece os promoters pelo documento `promoters-oficiais` da base de
  conhecimento** (desde 30/10/2026, pedido do Rafa: "pra facilitar a troca e
  evitar mexer no prompt"). Os itens 23-25 do prompt v5 só apontam pro
  documento. Promoter novo ou removido = Rafa recola SÓ o documento. Não há API.

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

- **19/10/2026 — nome de exibição**: `conferencia/index.html` ganhou
  `NOME_PROMOTER` (slug → nome real no ranking/certificado) e `ALIAS_PROMOTER`
  (`luana` → `luanabido`). Promoter novo = acrescentar nos dois, junto com o
  `PROMOTERS_OFICIAIS`. O ranking de segunda passou a ir pro grupo TIME BUTICA.

- **30/10/2026 — Anny Candida entrou** (`anny`, 554499607128, @annycandida; giro
  da bio, mesas, disputa, tudo de uma vez). Feito na sessão: bio (deploy),
  `PROMOTERS_OFICIAIS` + `NOME_PROMOTER` (deploy lista), `hub_grupo_remetentes`,
  6 TinyURL + 6 ulvis testados e mandados pro WhatsApp dela (17h58), planilha
  (linha 12 do Gerador, linhas 41-46 dos Links Curtos; cópia no Drive),
  `disputa_promoters`, `promoter_fones`, `relatorio-promoter-dia.mjs` (push →
  GH Actions), 3 workflows n8n (publicados) + espelhos, cadastro de teste OK
  (promoter `anny`, não "Casa"; aposentado como TESTE). **Descobertas que viraram
  passos 7b–7d e 8 da SKILL.md**: 4 listas fixas fora da tabela antiga; prompt
  mais novo da Kim era o v4 de 25/10 no Drive (o .md de Downloads estava em
  22/10); promoters saíram do prompt → documento `promoters-oficiais`.
  **Z-API central caiu ~18h00 no meio dos grupos** (`connected:false`): os 6
  `group-add-participant` devolveram `true` às 17h57, mas não deu pra conferir
  com `group-metadata`.

## Pendências abertas

- ✅ 30/10 18h20 — Rafa conferiu os grupos ("fiz"). ✅ 30/10 18h30 — documento
  `promoters-oficiais` CRIADO e VINCULADO à Kim pelo Chrome (painel →
  Base de Conhecimento → Escrever texto → marcar "O Butiquim - Kim - OFICIAL"
  em "Agentes que consultam este documento"; o vínculo salva sozinho).
  **Prompt NÃO foi trocado por decisão do Rafa** ("não mexa no prompt"): o v4
  (25/10) ainda traz os 5 nomes no item 23 com "só confirme quem está nesta
  lista" — enquanto o v5 (ponteiro pro documento) não for colado, a Kim pode
  não confirmar a Anny. Página pronta: `COPIAR-prompt-Kim-2026-10-30.html`.
- Item antigo ainda sem resposta (`[[project_promoters_butiquim]]`, fila de
  03/08): conferir se os links curtos antigos de todos os promoters ainda
  respondem depois das mudanças de domínio/rota — link quebrado = promoter
  perdendo comissão sem saber.
- ✅ 30/10 19h — **regra de qualificação semanal da bio NO AR** (vale a partir
  da virada de seg 02/11 05h): só aparece quem teve cadastro pelo link OU
  marcação/repost na semana que fechou; carência de 7 dias pelo `desde`; ninguém
  → 2 melhores do mês; Gabriel na regra. Fonte: `butiquim-lista/bio-promoters.mjs`
  + `GET /api/bio/promoters`; filtro em `rotacao.js` (`filtraQualificados`).
  Detalhes e como desligar em `[[project_butiquim_bio]]`. **Pendente:** Rafa
  avisar o time (quem não tiver cadastro na semana some da bio).

## Como registrar a próxima execução

Acrescente aqui: data, quem entrou/saiu, quais dos 9 passos da SKILL.md foram
feitos, o que ficou pendente e por quê. Depois atualize
`[[project_promoters_butiquim]]` e `[[project_butiquim_bio]]` na memória, e faça
commit + push do repo `butiquim-bio` (mantendo a cópia de
`C:\Users\User\.claude\skills\butiquim-atualizar-promoters\` idêntica).
